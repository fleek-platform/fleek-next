import { FleekFunction, FleekSdk } from '@fleek-platform/sdk';
import path from 'node:path';
import * as fs from 'node:fs/promises';

import { Origin } from './types.js';
import { output } from '../../../cli.js';
import { t } from '../../../utils/translation.js';
import { uploadFunction } from '../../../fleek/index.js';
import { FleekFileUploadError } from '../../../errors/FleekFileUploadError.js';

export async function uploadFunctionFile(props: {
  functionName: string;
  filePath: string;
  remotePath: string;
  fleekSdk: FleekSdk;
  fleekFunction: FleekFunction;
  dryRun?: boolean;
}): Promise<FleekFunction> {
  const { functionName, filePath, remotePath, fleekSdk, fleekFunction, dryRun } = props;

  let data = await fs.readFile(filePath, 'utf8');

  if (remotePath === 'function') {
    // TODO: Look into Next.js's bad bundling instead of doing this hack
    data = data.replaceAll(/([\w\d]{1,3}).socket/g, '$1?.socket');
    fs.writeFile(filePath, data);
  }

  if (dryRun) {
    return {
      id: 'dry-run',
      name: 'dry-run',
      slug: 'dry-run',
    };
  }

  try {
    return uploadFunction({ filePath, fileName: path.basename(filePath), name: functionName, fleekFunction, fleekSdk });
  } catch (error) {
    if (error instanceof Error) {
      output.error(t('fleekFileUploadErrorIncludeError', { error: error.message }));
      throw new FleekFileUploadError({ error });
    }
    output.error(t('fleekFileUploadError'));
    throw new FleekFileUploadError({});
  }
}

export async function createFunction(props: {
  projectName: string;
  projectPath: string;
  fleekSdk: FleekSdk;
  fleekFunction: FleekFunction;
  dryRun?: boolean;
}): Promise<Origin> {
  const filename = 'index.js';

  const filePath = path.join(props.projectPath, '.fleek', 'dist', filename);
  const functionName = props.projectName;

  const result = await uploadFunctionFile({
    functionName,
    filePath,
    remotePath: 'function',
    fleekSdk: props.fleekSdk,
    fleekFunction: props.fleekFunction,
    dryRun: props.dryRun,
  });

  const response: Origin = {
    url: `https://${result.slug}.functions.on-fleek.app`,
    type: 'functions',
  };

  if (props.dryRun) {
    output.success(t('functionCreatedDryRun', { name: functionName }));
  }

  return response;
}
