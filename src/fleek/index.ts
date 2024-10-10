import { FleekFunction, FleekSdk } from '@fleek-platform/sdk';
import { filesFromPaths } from 'files-from-path';
import { output } from '../cli.js';
import { t } from '../utils/translation.js';

export async function uploadDirectory(props: { path: string; fleekSdk: FleekSdk }): Promise<string> {
  const result = await props.fleekSdk.storage().uploadDirectory({
    path: props.path,
  });

  return result.pin.cid;
}

export async function uploadFunction(props: {
  filePath: string;
  fileName: string;
  name: string;
  fleekFunction: FleekFunction;
  fleekSdk: FleekSdk;
}): Promise<FleekFunction> {
  const files = await filesFromPaths([props.filePath]);

  output.spinner(`${t('uploadFunction', { name: props.name })}...`);
  const uploadFileResult = await props.fleekSdk.storage().uploadFile({
    file: files[0],
  });
  output.spinner(`${t('functionUploaded', { name: props.name })}...`);

  output.spinner(`${t('deployingFunction', { name: props.name })}...`);
  await props.fleekSdk.functions().deploy({
    functionId: props.fleekFunction.id,
    cid: uploadFileResult.pin.cid,
  });
  output.success(`${t('functionDeployed', { name: props.name })}...`);

  return props.fleekFunction;
}
