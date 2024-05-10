import { FleekError } from './FleekError.js';

type NextjsBuildErrorOptions = {
  error?: Error;
};

export class NextjsBuildError extends FleekError<NextjsBuildErrorOptions> {
  public name = 'NextjsBuildError';

  toString = () =>
    this.data.error
      ? `Failed to build Next.js application: ${this.data.error}`
      : 'Failed to build Next.js application.';
}
