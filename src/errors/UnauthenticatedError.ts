import { FleekError } from './FleekError.js';

type UnauthenticatedErrorOptions = Record<string, never>;

export class UnauthenticatedError extends FleekError<UnauthenticatedErrorOptions> {
  public name = 'UnauthenticatedError';

  constructor() {
    super({});
  }

  toString = () => `The request is not authenticated.`;
}
