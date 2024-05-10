import { FleekError } from './FleekError.js';

type NextjsBundleErrorOptions = {
  error?: Error;
};

export class NextjsBundleError extends FleekError<NextjsBundleErrorOptions> {
  public name = 'NextjsBundleError';

  toString = () =>
    this.data.error
      ? `Failed to bundle Next.js application: ${this.data.error}`
      : `Failed to bundle Next.js application.`;
}
