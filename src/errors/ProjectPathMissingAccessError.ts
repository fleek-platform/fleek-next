import { FleekError } from './FleekError.js';

type ProjectPathMissingAccessErrorOptions = {
  name: string;
};

export class ProjectPathMissingAccessError extends FleekError<ProjectPathMissingAccessErrorOptions> {
  public name = 'ProjectPathMissingAccessError';

  toString = () => `Missing permisisons to access the project path ${this.data.name}.`;
}
