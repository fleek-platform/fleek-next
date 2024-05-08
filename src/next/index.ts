import { execSync } from 'child_process';
import { getBuildEnvVars } from '../utils';
import { PackageManager } from '../utils/packageManager';

export function buildApp(opts: {
  openNextPath: string;
  environment?: Record<string, string>;
  packageManager: PackageManager;
}) {
  const buildPath = opts.openNextPath;
  const buildCommand = `${opts.packageManager} build`;

  // will throw if build fails - which is desired
  execSync(buildCommand, {
    cwd: buildPath,
    env: getBuildEnvVars(opts),
    stdio: 'inherit',
  });
}
