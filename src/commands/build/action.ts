import { output } from '../../cli.js';

import { readMiddlewareManifest, readOpenNextOutput, rmDir } from '../../utils.js';
import { findPackageManager, getBuildCommand, getInstallCommand } from '../../utils/packageManager.js';
import { t } from '../../utils/translation.js';
import { createOrigins, createProxyFunction } from './fleek/index.js';
import { buildApp as buildNextjsApp, installApp } from './next/index.js';
import { buildOpenNextConfig, bundleApp as executeOpenNext } from './open-next/index.js';
import { UnauthenticatedError } from '../../errors/UnauthenticatedError.js';
import { getProjectPathOrPrompt } from './prompts/getProjectPathOrPrompt.js';
import { getSdkClient } from '../../fleek/sdk.js';
import { loadJSONFromPath } from '../../utils/json.js';
import path from 'path';

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
  output.spinner(`${t('fleekSdkAuth')}`);
  const sdk = await getSdkClient({ path: path });
  if (!sdk) {
    output.error(t('fleekSdkAuthError'));
    throw new UnauthenticatedError();
  }
  output.success(t('fleekSdkAuthSuccess'));
  return sdk;
}

export async function cleanBuildArtifacts(projectPath: string) {
  output.spinner(`${t('cleaning')}`);
  rmDir({ dirPath: path.join(projectPath, '.next') });
  rmDir({ dirPath: path.join(projectPath, '.open-next') });
  output.success(t('cleaningSuccess'));
}

export async function install(opts: { projectPath: string; installCommand: string }) {
  const { projectPath, installCommand } = opts;
  output.box([t('installingDependencies')]);
  output.log(t('projectPath', { projectPath }));
  output.log(t('installCommand', { installCommand }));
  installApp({ projectPath, installCommand });
}

export async function build(opts: { projectPath: string; buildCommand: string }) {
  const { projectPath, buildCommand } = opts;
  output.box([t('buildingApp')]);
  output.log(t('projectPath', { projectPath }));
  output.log(t('buildCommand', { buildCommand }));
  buildNextjsApp({ projectPath, buildCommand });
}

export async function bundle(opts: { projectPath: string; openNextConfigPath: string }) {
  const { projectPath, openNextConfigPath } = opts;
  output.box([t('bundlingApp')]);
  await executeOpenNext({ openNextConfigPath });
  const openNextOutput = readOpenNextOutput(projectPath);
  return openNextOutput;
}

export const buildAction = async (args: BuildArgs) => {
  const { dryRun, skipBuild, skipInstallation, clean } = args;

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

  if (!skipInstallation) {
    await install({ projectPath, installCommand });
  }

  // Build the Next.js app
  if (!skipBuild) {
    await build({ projectPath, buildCommand });
  }

  // Read Next.js middleware manifest
  output.debug('Reading middleware manifest');
  const middlewareManifest = readMiddlewareManifest(projectPath);

  // Build open-next configuration file
  output.debug('Building open-next configuration file');
  const openNextConfigPath = buildOpenNextConfig({ projectPath, middlewareManifest, buildCommand });

  // Bundle the Next.js app
  const openNextOutput = await bundle({ projectPath, openNextConfigPath });

  const origins = await createOrigins({
    projectName: packageJson.name,
    projectPath,
    openNextOutput,
    fleekSdk: sdk,
    dryRun: dryRun ?? false,
  });

  const routingOrigin = await createProxyFunction({
    projectName: packageJson.name,
    projectPath,
    middlewareManifest,
    origins,
    fleekSdk: sdk,
    dryRun: dryRun ?? false,
  });

  origins['routing'] = routingOrigin;

  output.box([t('deployedHeader')]);
  output.table(Object.values(origins));

  output.success(t('appBuildSuccess'));
  output.log(t('visitYourApp', { url: routingOrigin.url }));
};
