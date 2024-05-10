import { execSync } from 'child_process';
import { getBuildEnvVars } from '../../../utils.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { NextjsBuildError } from '../../../errors/NextjsBuildError.js';

export function buildApp(opts: { projectPath: string; buildCommand: string; environment?: Record<string, string> }) {
  const { projectPath, buildCommand } = opts;

  output.log(t('buildingNextjsApp'));
  output.spinner(`${t('building')}`);
  try {
    // will throw if build fails - which is desired
    execSync(buildCommand, {
      cwd: projectPath,
      env: getBuildEnvVars(opts),
    });

    output.success('Next.js app successfully built.');
  } catch (error) {
    if (error instanceof Error) {
      output.error(`Failed to build Next.js app: ${error.message}`);
      throw new NextjsBuildError({ error });
    }
    output.error(`Failed to build Next.js app`);
    throw new NextjsBuildError({});
  }
}
