import { FleekError } from './FleekError.js';

type PackageJsonMissingAccessErrorOptions = {
  name: string;
};

export class PackageJsonMissingAccessError extends FleekError<PackageJsonMissingAccessErrorOptions> {
  public name = 'PackageJsonMissingAccessError';

  toString = () => `Missing permisisons to access the package.json at ${this.data.name}.`;
}
