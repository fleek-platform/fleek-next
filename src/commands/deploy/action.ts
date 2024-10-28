import { output } from '../../cli.js';

import { rmDir } from '../../utils.js';
import { findPackageManager, getBuildCommand, getInstallCommand } from '../../utils/packageManager.js';
import { t } from '../../utils/translation.js';
import { getProjectPathOrPrompt } from './prompts/getProjectPathOrPrompt.js';
import path from 'path';
import fs from 'fs/promises';
import { bundleNextOnFleekOutput, executeNextOnFleek } from './next-on-fleek/index.js';

type BuildArgs = {
  projectPath?: string;
  skipBuild?: boolean;
  skipInstallation?: boolean;
  clean?: boolean;
};

export async function cleanBuildArtifacts(projectPath: string) {
  output.spinner(`${t('cleaning')}`);
  rmDir({ dirPath: path.join(projectPath, '.next') });
  rmDir({ dirPath: path.join(projectPath, '.vercel') });
  rmDir({ dirPath: path.join(projectPath, '.fleek') });
  output.success(t('cleaningSuccess'));
}

async function copyDirectory({ src, dest }: { src: string; dest: string }) {
  await fs.cp(src, dest, { recursive: true });
}

async function copyStaticAssets({ projectPath }: { projectPath: string }) {
  output.spinner(`${t('copyingStaticAssets')}`);
  await copyDirectory({
    src: path.join(projectPath, '.vercel', 'output', 'static'),
    dest: path.join(projectPath, '.fleek', 'static'),
  });
  output.success(t('copyingStaticAssetsSuccess'));
}

export const buildAction = async (args: BuildArgs) => {
  const { clean } = args;

  output.debug(`Args: ${JSON.stringify(args, null, 2)}`);

  const projectPath = await getProjectPathOrPrompt({ path: args?.projectPath });

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

  await executeNextOnFleek({ projectPath });

  // Bundle the Next.js app
  await bundleNextOnFleekOutput({ projectPath });

  // Copy the static assets to the .fleek directory
  await copyStaticAssets({ projectPath });

  output.ready(t('appBuildSuccess'));
  output.printNewLine();
  output.chore(t('deployInstructions'));
  output.box([t('deployCommand')]);
  output.hint('Make sure to create a function first using `fleek functions create`');
};
