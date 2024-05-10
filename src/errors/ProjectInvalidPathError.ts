import { FleekError } from './FleekError.js';

type ProjectInvalidPathErrorOptions = {
  name: string;
};

export class ProjectInvalidPathError extends FleekError<ProjectInvalidPathErrorOptions> {
  public name = 'ProjectInvalidPathError';

  toString = () => `The project path ${this.data.name} is invalid.`;
}
