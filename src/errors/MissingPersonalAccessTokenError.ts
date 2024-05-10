import { FleekError } from './FleekError.js';

type MissingPersonalAccessTokenErrorOptions = Record<string, never>;

export class MissingPersonalAccessTokenError extends FleekError<MissingPersonalAccessTokenErrorOptions> {
  public name = 'MissingPersonalAccessTokenError';

  constructor() {
    super({});
  }

  toString = () => `Your Fleek personal access token is missing.`;
}
