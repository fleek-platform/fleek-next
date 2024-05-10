import { FleekError } from './FleekError.js';

type MissingProjectIdErrorOptions = Record<string, never>;

export class MissingProjectIdError extends FleekError<MissingProjectIdErrorOptions> {
  public name = 'MissingProjectIdError';

  constructor() {
    super({});
  }

  toString = () => `Your Fleek project ID is missing.`;
}
