import { FleekError } from './FleekError.js';

export class MissingExpectedDataError extends FleekError<void> {
  public name = 'MissingExpectedDataError';

  toString = () =>
    'Oops! This is embarassing but the app is missing important data. Please report this issue to the team.';
}
