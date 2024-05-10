import { FleekError } from './FleekError.js';

type FleekFileUploadErrorOptions = {
  error?: Error;
};

export class FleekFileUploadError extends FleekError<FleekFileUploadErrorOptions> {
  public name = 'FleekFileUploadError';

  toString = () =>
    this.data.error ? `Failed to upload file to Fleek: ${this.data.error}` : `Failed to upload file to Fleek.`;
}
