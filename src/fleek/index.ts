import { FleekSdk } from '@fleekxyz/sdk';
import { BaseFunction, OpenNextOutput } from '../open-next/types';
import path from 'node:path';
import { copyDir, printHeader } from '../utils';

import * as fs from 'node:fs/promises';
import { FunctionManifest, MiddlewareManifest } from '../next/types';
import { Origin } from './types';
import { proxyFunctionTemplate } from '../proxy';
import { Routes } from '@fleekxyz/proxy';
import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { readdirSync } from 'node:fs';

export async function uploadFile(props: { filePath: string; remotePath: string; fleekSdk: FleekSdk }): Promise<string> {
  const { filePath, remotePath, fleekSdk } = props;

  const data = await fs.readFile(filePath, 'utf8');

  if (remotePath === 'function') {
    // TODO: Fix Next.js's bad bundling instead of doing this hack
    const modifiedData = data.replaceAll(/([\w\d]{1,3}).socket/g, '$1?.socket');
    return uploadData({ data: modifiedData, fileName: path.basename(filePath), fleekSdk });
  } else {
    return uploadData({ data, fileName: path.basename(filePath), fleekSdk });
  }
}

async function uploadData(props: { data: string; fileName: string; fleekSdk: FleekSdk }): Promise<string> {
  try {
    const result = await props.fleekSdk.ipfs().add({
      path: props.fileName,
      content: new TextEncoder().encode(props.data),
    });

    return result.cid.toV1().toString();
  } catch (error: unknown) {
    console.error(`Failed to upload file at ${props.fileName}`, process.env.DEBUG ? error : '');
    throw new Error(`Failed to upload file at ${props.fileName}`);
  }
}

export async function uploadDir(props: { path: string; fleekSdk: FleekSdk }): Promise<string> {
  try {
    const result = await props.fleekSdk.ipfs().addFromPath(props.path, { wrapWithDirectory: true });

    const root = result.find((r) => r.path === '');

    if (!root) {
      throw new Error('Failed to find root dir CID');
    }

    return root.cid.toV1().toString();
  } catch (error: unknown) {
    console.error(`Failed to upload dir at ${path}`, process.env.DEBUG ? error : '');
    throw new Error(`Failed to upload dir at ${path}`);
  }
}

export async function createFunction(props: {
  openNextPath: string;
  origin: BaseFunction;
  fleekSdk: FleekSdk;
  key: string;
  bundle?: boolean;
  filename?: string;
}): Promise<Origin> {
  const filename = props.filename ?? 'index.mjs';

  const filePath = path.join(props.openNextPath, props.origin.bundle, filename);

  const result = await uploadFile({
    filePath,
    remotePath: 'function',
    fleekSdk: props.fleekSdk,
  });

  const response: Origin = {
    url: `http://fleek-test.network/services/1/ipfs/${result}`,
    type: 'functions',
    name: props.key,
  };

  console.log(`Function ${props.key === '' ? 'default' : props.key}`, response.url);

  return response;
}

export async function createOrigins(props: {
  openNextPath: string;
  openNextOutput: OpenNextOutput;
  fleekSdk: FleekSdk;
}): Promise<Record<string, Origin>> {
  const { imageOptimizer: imageOrigin, ...restOrigins } = props.openNextOutput.origins;

  const edgeFunctions = props.openNextOutput.edgeFunctions ?? {};

  printHeader('Uploading assets');
  const s3 = await uploadAssets({
    openNextPath: props.openNextPath,
    openNextOutput: props.openNextOutput,
    fleekSdk: props.fleekSdk,
  });

  printHeader('Creating edge functions');
  const edgeFunctionOrigins = await Object.entries(edgeFunctions).reduce(
    async (acc, [key, value]) => {
      const acc2 = await acc;
      acc2[key] = await createFunction({
        openNextPath: props.openNextPath,
        origin: value,
        fleekSdk: props.fleekSdk,
        key,
        bundle: false,
      });
      return acc2;
    },
    {} as Promise<Record<string, { url: string }>>,
  );

  return {
    s3,
    imageOptimizer: await createFunction({
      openNextPath: props.openNextPath,
      origin: imageOrigin,
      fleekSdk: props.fleekSdk,
      key: 'imageOptimizer',
    }),
    ...(await Object.entries(restOrigins)
      .filter(([key]) => key !== 'default')
      .reduce(
        async (acc, [key, value]) => {
          const acc2 = await acc;
          if (value.type === 'function') {
            acc2[key] = await createFunction({
              openNextPath: props.openNextPath,
              origin: value,
              fleekSdk: props.fleekSdk,
              key,
            });
          }
          return acc2;
        },
        {} as Promise<Record<string, Origin>>,
      )),
    ...edgeFunctionOrigins,
  };
}

export async function uploadAssets(props: {
  openNextPath: string;
  openNextOutput: OpenNextOutput;
  fleekSdk: FleekSdk;
}): Promise<Origin> {
  const assetsDirPath = path.join(props.openNextPath, '.open-next', '_assets');

  try {
    await fs.mkdir(assetsDirPath, { recursive: true });

    for (const copyOperation of props.openNextOutput.origins.s3.copy) {
      const { from } = copyOperation;
      const sourceDir = path.join(props.openNextPath, from);
      const destinationDir = assetsDirPath;

      await fs.mkdir(destinationDir, { recursive: true });

      await copyDir({ src: sourceDir, dest: destinationDir });
    }

    const result = await uploadDir({
      path: assetsDirPath,
      fleekSdk: props.fleekSdk,
    });

    const response: Origin = { url: `https://${result}.ipfs.cf-ipfs.com/`, type: 'middleware', name: '/' };
    console.log('Assets', response.url);
    return response;
  } catch (error) {
    console.error('Failed to upload assets:', error);
    throw error;
  }
}

export async function createProxyFunction(props: {
  openNextPath: string;
  middlewareManifest: MiddlewareManifest;
  origins: Record<string, Origin>;
  fleekSdk: FleekSdk;
}) {
  const {
    openNextPath,
    middlewareManifest: { functions },
    origins,
    fleekSdk,
  } = props;

  printHeader('Creating proxy function');

  const imageOptimizerPath = '^_next/image$';
  let defaultRoute;

  const routes: Routes = Object.entries(origins)
    .filter(([, value]) => value.type === 'functions')
    .map(([key, value]) => {
      let functionManifest: FunctionManifest;
      if (key === '') {
        functionManifest = functions['/page'];
        defaultRoute = value.url;
      } else if (key === 'imageOptimizer') {
        return { [imageOptimizerPath]: value.url };
      } else {
        const auxKey = `/${key}/page`;
        functionManifest = functions[auxKey];
      }

      if (!functionManifest?.matchers?.length) {
        return {};
      }

      const matcher = functionManifest.matchers[0];

      return { [matcher.regexp]: `${value.url}${matcher.originalSource}` };
    })
    .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Record<string, string>);

  const assetRoute = readdirSync(path.join(openNextPath, '.open-next', 'assets'))
    .map((file) => {
      return escapeRegex(file);
    })
    .join('|');

  routes[`^/(${assetRoute})`] = `${origins.s3.url}$1`;

  const functionCode = proxyFunctionTemplate({
    routes,
    default: defaultRoute ?? '',
  });

  await build({
    outfile: path.join(openNextPath, '.open-next', 'fleek', 'routing.js'),
    bundle: true,
    minify: true,
    stdin: {
      contents: functionCode,
      loader: 'ts',
    },
    treeShaking: true,
    conditions: ['module'],
    mainFields: ['module', 'main'],
    target: 'es2022',
    format: 'esm',
    platform: 'neutral',
    plugins: [
      alias({
        '@fleekxyz/proxy': require.resolve('@fleekxyz/proxy'),
      }),
    ],
  });

  const result = await uploadFile({
    filePath: path.join(openNextPath, '.open-next', 'fleek', 'routing.js'),
    remotePath: 'function',
    fleekSdk,
  });

  console.log(`Function routing http://fleek-test.network/services/1/ipfs/${result}`);
}

function escapeRegex(str: string) {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}
