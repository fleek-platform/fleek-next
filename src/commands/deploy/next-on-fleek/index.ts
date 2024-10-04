import { runNextOnPages } from '@fleek-platform/next-on-fleek';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { NextjsBundleError } from '../../../errors/NextjsBundleError.js';
import { bundle } from './bundle.js';
import path from 'path';

export async function executeNextOnFleek({ projectPath }: { projectPath: string }) {
  output.log(t('buildingNextjsApp'));
  // output.spinner(`${t('building')}`);
  try {
    await runNextOnPages({
      outdir: path.join(projectPath, '.vercel', 'output', 'static'),
    });

    output.success(t('nextjsBuildSuccess'));
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('nextjsBuildErrorIncludeError', { error: error.message }));
      throw new NextjsBundleError({ error });
    }
    output.error(t('nextjsBuildError'));
    throw new NextjsBundleError({});
  }
}

export async function bundleNextOnFleekOutput(opts: { projectPath: string }) {
  await bundle({ projectPath: opts.projectPath });
}
