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

export async function bundle(opts: { projectPath: string }) {
  const { projectPath } = opts;
  output.box([t('bundlingApp')]);
  await executeNextOnFleek({ projectPath });
  await bundleNextOnFleekOutput({ projectPath });
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

  // Bundle the Next.js app
  await bundle({ projectPath });

  const deployedFunction = await createFunction({
    projectName: packageJson.name ?? path.basename(projectPath),
    projectPath,
    fleekSdk: sdk,
    dryRun: dryRun ?? false,
  });

  output.box([t('deployedHeader')]);
  output.table(Object.values([deployedFunction]));

  output.success(t('appBuildSuccess'));
  output.log(t('visitYourApp', { url: deployedFunction.url }));
};
