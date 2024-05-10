import * as path from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { getBuildEnvVars } from '../../../utils.js';
import { MiddlewareManifest } from '../next/types.js';
import { templateOpenNextConfig } from './open-next.config.js';
import { NextjsBundleError } from '../../../errors/NextjsBundleError.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';

export function bundleApp(opts: {
  projectPath: string;
  openNextConfigPath: string;
  environment?: Record<string, string>;
}) {
  const { projectPath, openNextConfigPath } = opts;
  output.log(`${t('bundlingNextjsApp')}`);
  output.spinner(`${t('bundling')}`);

  // TODO: update the open-next fork to export the build function
  const localBinPath = path.join(projectPath, 'node_modules', '@fleekxyz', 'next', 'node_modules', '.bin');
  const bin = path.join(localBinPath, 'open-next');

  try {
    execSync(`${bin} build --config-path=${openNextConfigPath} --skip-build=true --standalone-mode=false`, {
      cwd: projectPath,
      env: getBuildEnvVars(opts),
    });
    output.success(t('bundlingSuccess'));
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('bundlingErrorIncludeError', { error: error.message }));
      throw new NextjsBundleError({ error });
    }
    output.error(t('bundlingError'));
    throw new NextjsBundleError({});
  }
}

export function buildOpenNextConfig(opts: {
  projectPath: string;
  middlewareManifest: MiddlewareManifest;
  buildCommand: string;
}) {
  const { projectPath, middlewareManifest, buildCommand } = opts;

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

  const openNextConfig = templateOpenNextConfig({ functionConfigs, buildCommand });
  const openNextConfigPath = path.join(projectPath, 'open-next.config.ts');

  writeFileSync(path.join(projectPath, 'open-next.config.ts'), openNextConfig);

  return openNextConfigPath;
}
