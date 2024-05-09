import * as path from 'path';
import { execSync } from 'child_process';
import { getBuildEnvVars } from '../utils';
import { MiddlewareManifest } from '../next/types';
import { templateOpenNextConfig } from './open-next.config';
import { writeFileSync } from 'fs';

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

export function buildOpenNextConfig(opts: { openNextPath: string; middlewareManifest: MiddlewareManifest }) {
  const { openNextPath, middlewareManifest } = opts;

  const functionConfigs = Object.entries(middlewareManifest.functions)
    .map(([name, fn]) => {
      const key = name === '/page' ? '' : name.replace(/\/([\w\d-@/[\]]*)\/page/, '$1');
      return `
      "${key}": {
        runtime: 'edge',
        routes: ["${fn.name}"],
        patterns: ["${fn.page}"],
        minify: true,
        placement: 'global',
        override: {
          converter: async () => converter,
          wrapper: async () => wrapper,
        },
      },
      `;
    })
    .join('');

  const openNextConfig = templateOpenNextConfig({ functionConfigs });

  writeFileSync(path.join(openNextPath, 'open-next.config.ts'), openNextConfig);
}
