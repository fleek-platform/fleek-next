import { FleekFunction, FleekSdk } from '@fleekxyz/sdk';
import { BaseFunction, OpenNextOutput } from '../open-next/types';
import path from 'node:path';
import { Routes } from '@fleekxyz/proxy';
import { build } from 'esbuild';
import * as fs from 'node:fs/promises';
import alias from 'esbuild-plugin-alias';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

import { copyDir } from '../../../utils.js';
import { FunctionManifest, MiddlewareManifest } from '../next/types.js';
import { Origin } from './types.js';
import { proxyFunctionTemplate } from '../proxy/index.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { uploadDirectory, uploadFunction } from '../../../fleek/index.js';
import { FleekFileUploadError } from '../../../errors/FleekFileUploadError.js';
import { FleekDirUploadError } from '../../../errors/FleekDirUploadError.js';

const require = createRequire(import.meta.url);

export async function uploadFunctionFile(props: {
  functionName: string;
  filePath: string;
  remotePath: string;
  fleekSdk: FleekSdk;
  dryRun?: boolean;
}): Promise<FleekFunction> {
  const { functionName, filePath, remotePath, fleekSdk, dryRun } = props;

  let data = await fs.readFile(filePath, 'utf8');

  if (remotePath === 'function') {
    // TODO: Look into Next.js's bad bundling instead of doing this hack
    data = data.replaceAll(/([\w\d]{1,3}).socket/g, '$1?.socket');
    fs.writeFile(filePath, data);
  }

  if (dryRun) {
    return {
      id: 'dry-run',
      name: 'dry-run',
      slug: 'dry-run',
    };
  }

  try {
    return uploadFunction({ filePath, fileName: path.basename(filePath), name: functionName, fleekSdk });
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('fleekFileUploadErrorIncludeError', { error: error.message }));
      throw new FleekFileUploadError({ error });
    }
    output.error(t('fleekFileUploadError'));
    throw new FleekFileUploadError({});
  }
}

export async function createFunction(props: {
  projectName: string;
  openNextPath: string;
  origin: BaseFunction;
  fleekSdk: FleekSdk;
  key: string;
  bundle?: boolean;
  filename?: string;
  dryRun?: boolean;
}): Promise<Origin> {
  const functionName = props.key === '' ? 'default' : props.key;

  output.spinner(`${t('creatingFunction', { name: functionName })}...`);
  const filename = props.filename ?? 'index.mjs';

  const filePath = path.join(props.openNextPath, props.origin.bundle, filename);

  const result = await uploadFunctionFile({
    functionName: `${props.projectName}-${props.key}`,
    filePath,
    remotePath: 'function',
    fleekSdk: props.fleekSdk,
    dryRun: props.dryRun,
  });

  const response: Origin = {
    url: `https://${result.slug}.functions.stg.on-fleek-test.app`,
    type: 'functions',
    name: props.key,
  };

  if (!props.dryRun) {
    output.success(t('functionCreated', { name: functionName, url: response.url }));
  } else {
    output.success(t('functionCreatedDryRun', { name: functionName }));
  }

  return response;
}

export async function createOrigins(props: {
  projectName: string;
  projectPath: string;
  openNextOutput: OpenNextOutput;
  fleekSdk: FleekSdk;
  dryRun?: boolean;
}): Promise<Record<string, Origin>> {
  const { imageOptimizer: imageOrigin, ...restOrigins } = props.openNextOutput.origins;

  const edgeFunctions = props.openNextOutput.edgeFunctions ?? {};

  output.box(['Uploading assets']);
  const s3 = await uploadAssets({
    openNextPath: props.projectPath,
    openNextOutput: props.openNextOutput,
    fleekSdk: props.fleekSdk,
    dryRun: props.dryRun,
  });

  output.box(['Creating edge functions']);
  const edgeFunctionOrigins = await Object.entries(edgeFunctions).reduce(
    async (acc, [key, value]) => {
      const acc2 = await acc;
      acc2[key] = await createFunction({
        projectName: props.projectName,
        openNextPath: props.projectPath,
        origin: value,
        fleekSdk: props.fleekSdk,
        key,
        bundle: false,
        dryRun: props.dryRun,
      });
      return acc2;
    },
    {} as Promise<Record<string, { url: string }>>,
  );

  return {
    s3,
    imageOptimizer: await createFunction({
      projectName: props.projectName,
      openNextPath: props.projectPath,
      origin: imageOrigin,
      fleekSdk: props.fleekSdk,
      key: 'imageOptimizer',
      dryRun: props.dryRun,
    }),
    ...(await Object.entries(restOrigins)
      .filter(([key]) => key !== 'default')
      .reduce(
        async (acc, [key, value]) => {
          const acc2 = await acc;
          if (value.type === 'function') {
            acc2[key] = await createFunction({
              projectName: props.projectName,
              openNextPath: props.projectPath,
              origin: value,
              fleekSdk: props.fleekSdk,
              key,
              dryRun: props.dryRun,
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
  dryRun?: boolean;
}): Promise<Origin> {
  output.spinner(`${t('creatingAssets')}...`);
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

    let response: Origin;

    if (!props.dryRun) {
      const result = await uploadDirectory({
        path: assetsDirPath,
        fleekSdk: props.fleekSdk,
      });

      response = { url: `https://${result}.ipfs.cf-ipfs.com/`, type: 'middleware', name: '/' };

      output.success(t('assetsCreated', { url: response.url }));
    } else {
      output.success(t('assetsCreatedDryRun'));
      response = { url: '(dry run)', type: 'middleware', name: '/' };
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('fleekDirUploadErrorIncludeError', { error: error.message }));
      throw new FleekDirUploadError({ error });
    }
    output.error(t('fleekDirUploadError'));
    throw new FleekDirUploadError({});
  }
}

export async function createProxyFunction(props: {
  projectName: string;
  projectPath: string;
  middlewareManifest: MiddlewareManifest;
  origins: Record<string, Origin>;
  fleekSdk: FleekSdk;
  dryRun?: boolean;
}): Promise<Origin> {
  const {
    projectPath,
    middlewareManifest: { functions },
    origins,
    fleekSdk,
  } = props;

  output.spinner(t('creatingFunction', { name: 'routing' }));

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

  const assetRoute = readdirSync(path.join(projectPath, '.open-next', 'assets'))
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
    outfile: path.join(projectPath, '.open-next', 'fleek', 'routing.js'),
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

  const result = await uploadFunctionFile({
    functionName: `${props.projectName}-routing`,
    filePath: path.join(projectPath, '.open-next', 'fleek', 'routing.js'),
    remotePath: 'function',
    fleekSdk,
  });

  const url = `https://${result.slug}.functions.stg.on-fleek-test.app`;

  if (!props.dryRun) {
    output.success(t('functionCreated', { name: 'routing' }));
  } else {
    output.success(t('functionCreatedDryRun', { name: 'routing' }));
  }

  return { name: 'routing', type: 'functions', url };
}

function escapeRegex(str: string) {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}
