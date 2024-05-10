import { FleekFunction, FleekSdk } from '@fleekxyz/sdk';
import { filesFromPaths } from 'files-from-path';

export async function uploadDirectory(props: { path: string; fleekSdk: FleekSdk }): Promise<string> {
  const result = await props.fleekSdk.storage().uploadDirectory({ path: props.path });

  return result.pin.cid;
}

export async function uploadFunction(props: {
  filePath: string;
  fileName: string;
  name: string;
  fleekSdk: FleekSdk;
}): Promise<FleekFunction> {
  const files = await filesFromPaths([props.filePath]);

  const uploadFileResult = await props.fleekSdk.storage().uploadFile({
    file: files[0],
  });

  let fleekFunction: FleekFunction;
  try {
    fleekFunction = await props.fleekSdk.functions().get({ name: props.name });
  } catch (error) {
    fleekFunction = await props.fleekSdk.functions().create({
      name: props.name,
    });
  }

  await props.fleekSdk.functions().deploy({
    functionId: fleekFunction.id,
    cid: uploadFileResult.pin.cid,
  });

  return fleekFunction;
}
