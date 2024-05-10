import { FleekError } from './FleekError.js';

type FleekDirUploadErrorOptions = {
  error?: Error;
};

export class FleekDirUploadError extends FleekError<FleekDirUploadErrorOptions> {
  public name = 'FleekDirUploadError';

  toString = () =>
    this.data.error
      ? `Failed to upload directory to Fleek: ${this.data.error}`
      : `Failed to upload directory to Fleek.`;
}
