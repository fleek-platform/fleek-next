import { Command } from 'commander';

import { t } from '../../utils/translation.js';
import { buildAction } from './action.js';

export default (program: Command) => {
  const cmd = program
    .command('deploy')
    .option('-d, --dryRun', t('dryRun'))
    .option('-p, --projectPath <path>', t('path'))
    .option('-s, --skipBuild', t('skipBuild'))
    .option('-i, --skipInstallation', t('skipInstallation'))
    .option('-c, --clean', 'Clean previous build artifacts before building')
    .description(t('appBuildDescription'))
    .action(buildAction);

  cmd
    .command('help')
    .description(t('printHelp'))
    .action(() => cmd.help());
};
