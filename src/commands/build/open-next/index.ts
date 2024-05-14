import * as path from 'path';
import { writeFileSync } from 'fs';
import { MiddlewareManifest } from '../next/types.js';
import { templateOpenNextConfig } from './open-next.config.js';
import { NextjsBundleError } from '../../../errors/NextjsBundleError.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { build } from '@fleekxyz/open-next/build.js';

export async function bundleApp(opts: { openNextConfigPath: string }) {
  const { openNextConfigPath } = opts;
  // output.log(`${t('bundlingNextjsApp')}`);
  output.spinner(`${t('bundling')}`);

  try {
    await build({
      openNextConfigPath,
      skipBuild: true,
      standaloneMode: false,
      logLevel: 'error',
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

  output.debug(t('openNextConfigOutputPath', { outputPath: openNextConfigPath }));
  writeFileSync(path.join(projectPath, 'open-next.config.ts'), openNextConfig);

  return openNextConfigPath;
}
