import { Command } from 'commander';
import { output } from '../../cli.js';

import { readMiddlewareManifest, readOpenNextOutput } from '../../utils.js';
import { getBuildCommand } from '../../utils/packageManager.js';
import { t } from '../../utils/translation.js';
import { createOrigins, createProxyFunction } from './fleek/index.js';
import { buildApp as buildNextjsApp } from './next/index.js';
import { buildOpenNextConfig, bundleApp as executeOpenNext } from './open-next/index.js';
import { UnauthenticatedError } from '../../errors/UnauthenticatedError.js';
import { getProjectPathOrPrompt } from './prompts/getProjectPathOrPrompt.js';
import { getSdkClient } from '../../fleek/sdk.js';
import { loadJSONFromPath } from '../../utils/json.js';
import path from 'path';

type BuildArgs = {
  projectPath?: string;
  dryRun?: boolean;
};

const buildAction = async (opts: { args?: BuildArgs }) => {
  const { args } = opts;

  const projectPath = await getProjectPathOrPrompt({ path: args?.projectPath });

  output.spinner(t('fleekSdkAuth'));
  const sdk = await getSdkClient();

  if (!sdk) {
    output.error(t('fleekSdkAuthError'));
    throw new UnauthenticatedError();
  }
  output.success(t('fleekSdkAuthSuccess'));

  output.box([t('buildingApp')]);

  const packageJson = loadJSONFromPath(path.join(projectPath, 'package.json'));
  const buildCommand = getBuildCommand({
    projectPath,
  });

  output.log(t('projectPath', { projectPath }));
  output.log(t('buildCommand', { buildCommand }));

  buildNextjsApp({ projectPath, buildCommand });

  output.box([t('bundlingApp')]);

  output.log('Reading middleware manifest');
  const middlewareManifest = readMiddlewareManifest(projectPath);
  output.log('Building open-next configuration file');
  const openNextConfigPath = buildOpenNextConfig({ projectPath, middlewareManifest, buildCommand });

  executeOpenNext({ projectPath, openNextConfigPath });

  const openNextOutput = readOpenNextOutput(projectPath);

  const origins = await createOrigins({
    projectName: packageJson.name,
    projectPath,
    openNextOutput,
    fleekSdk: sdk,
    dryRun: args?.dryRun ?? false,
  });

  const routingOrigin = await createProxyFunction({
    projectName: packageJson.name,
    projectPath,
    middlewareManifest,
    origins,
    fleekSdk: sdk,
    dryRun: args?.dryRun ?? false,
  });

  origins['routing'] = routingOrigin;

  output.table(Object.values(origins));

  output.success(t('appBuildSuccess'));
};

export default (program: Command) => {
  const cmd = program.command('build').description(t('appBuildDescription'));

  cmd.action(buildAction);

  cmd
    .command('help')
    .description(t('printHelp'))
    .action(() => program.help());
};
