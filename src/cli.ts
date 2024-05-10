#!/usr/bin/env node

import { Command } from 'commander';
import { t } from './utils/translation.js';
import { Output } from './output/Output.js';
import cmdBuild from './commands/build/index.js';

const isDebugging = process.argv.includes('--debug');
export const output = new Output({
  stream: process.stdout,
  debug: isDebugging,
});

type InitArgs = {
  version: string;
  parser: (program: Command) => void;
};

const logo = `
                                                
       ad88  88                          88         
      d8"    88                          88         
      88     88                          88         
    MM88MMM  88   ,adPPYba,   ,adPPYba,  88   ,d8   
      88     88  a8P_____88  a8P_____88  88 ,a8"    
      88     88  8PP"""""""  8PP"""""""  8888[      
      88     88  "8b,   ,aa  "8b,   ,aa  88'"Yba,   
      88     88   '"Ybbd8"    '"Ybbd8"   88   'Y8a  

    ⚡ ${t('aboutFleek')} ⚡
`;

export const init = ({ version, parser }: InitArgs) => {
  const program: Command = new Command()
    .name('fleek-next')
    .option('--debug', t('enableDebugMode'))
    .option('-h, --help', t('printHelp'))
    .action(() => program.outputHelp())
    .version(version, '-v, --version', t('printVersionDetails'));

  program.addHelpText('beforeAll', logo).showHelpAfterError();

  // Initialise commands
  const commands = [cmdBuild];

  for (const cmd of commands) {
    cmd(program);
  }

  // Init parser (unawaited)
  parser(program);

  return program;
};

export const asyncParser = async (program: Command) => {
  try {
    await program.parseAsync(process.argv);

    process.exit(0);
  } catch (err) {
    console.error((err as Error).message || err);

    if ((err as Error).stack) {
      console.error((err as Error).stack);
    }

    process.exit(1);
  }
};
