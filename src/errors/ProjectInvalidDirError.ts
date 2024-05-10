import { FleekError } from './FleekError.js';

type ProjectInvalidDirErrorOptions = {
  name: string;
};

export class ProjectInvalidDirError extends FleekError<ProjectInvalidDirErrorOptions> {
  public name = 'ProjectInvalidPathError';

  toString = () => `The project path ${this.data.name} is not a directory.`;
}
