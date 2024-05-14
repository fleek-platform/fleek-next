import { FleekFunction, FleekSdk } from '@fleekxyz/sdk';
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
  fleekSdk: FleekSdk;
}): Promise<FleekFunction> {
  const files = await filesFromPaths([props.filePath]);

  output.spinner(`${t('uploadFunction', { name: props.name })}...`);
  const uploadFileResult = await props.fleekSdk.storage().uploadFile({
    file: files[0],
  });
  output.spinner(`${t('functionUploaded', { name: props.name })}...`);

  let fleekFunction: FleekFunction;
  try {
    output.spinner(`${t('gettingFunction', { name: props.name })}...`);
    fleekFunction = await props.fleekSdk.functions().get({ name: props.name });
    output.spinner(`${t('functionFound', { name: props.name, slug: fleekFunction.slug })}...`);
  } catch (error) {
    output.spinner(`${t('creatingFunction', { name: props.name })}...`);
    fleekFunction = await props.fleekSdk.functions().create({
      name: props.name,
    });
    output.spinner(`${t('functionCreated', { name: props.name })}...`);
  }

  output.spinner(`${t('deployingFunction', { name: props.name })}...`);
  await props.fleekSdk.functions().deploy({
    functionId: fleekFunction.id,
    cid: uploadFileResult.pin.cid,
  });
  output.success(`${t('functionDeployed', { name: props.name })}...`);

  return fleekFunction;
}
