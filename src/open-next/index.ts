import * as path from 'path';
import { execSync } from 'child_process';
import { getBuildEnvVars } from '../utils';

export function bundleApp(opts: { openNextPath: string; environment?: Record<string, string> }) {
  const buildPath = opts.openNextPath;
  const openNextConfigPath = path.join(opts.openNextPath, 'open-next.config.ts');
  const localBinPath = path.join(__dirname, '..', '..', 'node_modules', '.bin');
  const bin = path.join(localBinPath, 'open-next');

  try {
    execSync(`${bin} build --config-path=${openNextConfigPath} --skip-build=true --standalone-mode=false`, {
      cwd: buildPath,
      env: getBuildEnvVars(opts),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run open-next build:', error);
    throw error;
  }
}
