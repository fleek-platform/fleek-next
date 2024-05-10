import { FleekError } from './FleekError.js';

type PackageJsonUnknownErrorOptions = {
  name: string;
  code?: string;
};

export class PackageJsonUnknownError extends FleekError<PackageJsonUnknownErrorOptions> {
  public name = 'PackageJsonUnknownError';

  toString = () => `Failed to access package.json at ${this.data.name} with error code ${this.data.code}.`;
}
