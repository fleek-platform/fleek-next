import { output } from '../../cli.js';

import { rmDir } from '../../utils.js';
import { findPackageManager, getBuildCommand, getInstallCommand } from '../../utils/packageManager.js';
import { t } from '../../utils/translation.js';
import { createFunction } from './fleek/index.js';
import { UnauthenticatedError } from '../../errors/UnauthenticatedError.js';
import { getProjectPathOrPrompt } from './prompts/getProjectPathOrPrompt.js';
import { getSdkClient } from '../../fleek/sdk.js';
import { loadJSONFromPath } from '../../utils/json.js';
import path from 'path';
import { bundleNextOnFleekOutput, executeNextOnFleek } from './next-on-fleek/index.js';
import { uploadDirectory } from '../../fleek/index.js';
import { FleekFunction } from '@fleek-platform/sdk';

type BuildArgs = {
  dryRun?: boolean;
  projectPath?: string;
  skipBuild?: boolean;
  skipInstallation?: boolean;
  clean?: boolean;
};

type projectPath = {
  path?: string;
};

export async function sdkClient({ path }: projectPath) {
  const sdk = await getSdkClient({ path: path });
  if (!sdk) {
    output.spinner(`${t('fleekSdkAuth')}`);
    output.error(t('fleekSdkAuthError'));
    throw new UnauthenticatedError();
  }
  output.spinner(`${t('fleekSdkAuth')}`);
  output.success(t('fleekSdkAuthSuccess'));
  return sdk;
}

export async function cleanBuildArtifacts(projectPath: string) {
  output.spinner(`${t('cleaning')}`);
  rmDir({ dirPath: path.join(projectPath, '.next') });
  rmDir({ dirPath: path.join(projectPath, '.vercel') });
  rmDir({ dirPath: path.join(projectPath, '.fleek') });
  output.success(t('cleaningSuccess'));
}

export const buildAction = async (args: BuildArgs) => {
  const { dryRun, clean } = args;

  output.debug(`Args: ${JSON.stringify(args, null, 2)}`);

  const projectPath = await getProjectPathOrPrompt({ path: args?.projectPath });

  // Instantiate SDK client
  // Make sure we have the needed credentials
  const sdk = await sdkClient({ path: projectPath });

  // Clean previous build artifacts
  if (clean) {
    cleanBuildArtifacts(projectPath);
  }

  const packageManager = findPackageManager({ projectPath });
  output.debug(`Using package manager: '${packageManager}'`);
  const buildCommand = getBuildCommand({ packageManager });
  output.debug(`Using build command: '${buildCommand}'`);
  const installCommand = getInstallCommand({ packageManager });
  output.debug(`Using install command: '${installCommand}'`);
  output.debug('Loading package.json');
  const packageJson = loadJSONFromPath(path.join(projectPath, 'package.json'));

  await executeNextOnFleek({ projectPath });

  // Bundle the Next.js app
  let cid;
  output.spinner(t('creatingAssets'));
  if (dryRun) {
    cid = 'dry-run-cid';
    output.success(t('assetsCreatedDryRun'));
  } else {
    cid = await uploadDirectory({
      path: path.join(projectPath, '.vercel', 'output', 'static'),
      fleekSdk: sdk,
    });
    output.success(t('assetsCreated', { url: `https://${cid}.ipfs.flk-ipfs.xyz` }));
  }

  const projectName = packageJson.name ?? path.basename(projectPath);

  let fleekFunction: FleekFunction;
  try {
    output.spinner(`${t('gettingFunction', { name: projectName })}...`);
    fleekFunction = await sdk.functions().get({ name: projectName });
    output.spinner(`${t('functionFound', { name: projectName, slug: fleekFunction.slug })}...`);
  } catch (error) {
    output.spinner(`${t('creatingFunction', { name: projectName })}...`);
    fleekFunction = await sdk.functions().create({
      name: projectName,
    });
    output.spinner(`${t('functionCreated', { name: projectName })}...`);
  }

  await bundleNextOnFleekOutput({ staticAssetCid: cid, projectPath, fleekFunction });

  const deployedFunction = await createFunction({
    projectName,
    projectPath,
    fleekSdk: sdk,
    fleekFunction,
    dryRun: dryRun ?? false,
  });

  output.table(Object.values([deployedFunction]));

  output.success(t('appBuildSuccess'));
  output.log(t('visitYourApp', { url: deployedFunction.url }));
};
