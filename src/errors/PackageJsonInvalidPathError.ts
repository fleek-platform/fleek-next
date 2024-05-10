import { FleekError } from './FleekError.js';

type PackageJsonInvalidPathErrorOptions = {
  name: string;
};

export class PackageJsonInvalidPathError extends FleekError<PackageJsonInvalidPathErrorOptions> {
  public name = 'PackageJsonInvalidPathError';

  toString = () => `package.json not found at ${this.data.name}.`;
}
