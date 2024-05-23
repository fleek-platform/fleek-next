import { execSync } from 'child_process';
import { getBuildEnvVars } from '../../../utils.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { NextjsBuildError } from '../../../errors/NextjsBuildError.js';

export function installApp(opts: {
  projectPath: string;
  installCommand: string;
  environment?: Record<string, string>;
}) {
  const { projectPath, installCommand } = opts;

  output.log(t('installingDependencies'));
  output.spinner(`${t('installing')}`);
  try {
    // will throw if build fails - which is desired
    execSync(installCommand, {
      cwd: projectPath,
      env: getBuildEnvVars(opts),
      stdio: 'inherit',
    });

    output.success(t('installingSuccess'));
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('installingErrorIncludeError', { error: error.message }));
      throw new NextjsBuildError({ error });
    }
    output.error(t('installingError'));
    throw new NextjsBuildError({});
  }
}

export function buildApp(opts: { projectPath: string; buildCommand: string; environment?: Record<string, string> }) {
  const { projectPath, buildCommand } = opts;

  output.log(t('buildingNextjsApp'));
  output.spinner(`${t('building')}`);
  try {
    // will throw if build fails - which is desired
    execSync(buildCommand, {
      cwd: projectPath,
      env: getBuildEnvVars(opts),
      stdio: 'inherit',
    });

    output.success(t('nextjsBuildSuccess'));
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('nextjsBuildErrorIncludeError', { error: error.message }));
      throw new NextjsBuildError({ error });
    }
    output.error(t('nextjsBuildError'));
    throw new NextjsBuildError({});
  }
}
