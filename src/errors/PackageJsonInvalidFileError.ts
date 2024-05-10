import { FleekError } from './FleekError.js';

type PackageJsonInvalidFileErrorOptions = {
  name: string;
};

export class PackageJsonInvalidFileError extends FleekError<PackageJsonInvalidFileErrorOptions> {
  public name = 'PackageJsonInvalidDirError';

  toString = () => `The package.json at ${this.data.name} is not a file.`;
}
