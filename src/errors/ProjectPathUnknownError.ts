import { FleekError } from './FleekError.js';

type ProjectPathUnknownErrorOptions = {
  name: string;
  code?: string;
};

export class ProjectPathUnknownError extends FleekError<ProjectPathUnknownErrorOptions> {
  public name = 'ProjectPathUnknownError';

  toString = () => `Failed to access project at path ${this.data.name} with error code ${this.data.code}.`;
}
