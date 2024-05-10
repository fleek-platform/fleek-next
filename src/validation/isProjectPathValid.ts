import { statSync } from 'fs';
import * as path from 'path';
import { ProjectInvalidPathError } from '../errors/ProjectInvalidPathError.js';
import { ProjectPathUnknownError } from '../errors/ProjectPathUnknownError.js';
import { ProjectInvalidDirError } from '../errors/ProjectInvalidDirError.js';
import { ProjectPathMissingAccessError } from '../errors/ProjectPathMissingAccessError.js';
import { PackageJsonInvalidPathError } from '../errors/PackageJsonInvalidPathError.js';
import { PackageJsonMissingAccessError } from '../errors/PackageJsonMissingAccessError.js';
import { PackageJsonUnknownError } from '../errors/PackageJsonUnknownError.js';
import { PackageJsonInvalidFileError } from '../errors/PackageJsonInvalidFileError.js';

type IsProjectPathValidArgs = {
  projectPath: string;
};

export const validateProjectPath = ({ projectPath }: IsProjectPathValidArgs) => {
  const packageJsonPath = path.join(projectPath, 'package.json');

  let projectPathStat;
  try {
    projectPathStat = statSync(projectPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ProjectInvalidPathError({ name: projectPath });
    }

    if ((err as NodeJS.ErrnoException).code === 'EACCES') {
      throw new ProjectPathMissingAccessError({ name: projectPath });
    }

    throw new ProjectPathUnknownError({ name: projectPath, code: (err as NodeJS.ErrnoException).code });
  }

  if (!projectPathStat.isDirectory()) {
    throw new ProjectInvalidDirError({ name: projectPath });
  }

  let packageJsonStat;
  try {
    packageJsonStat = statSync(packageJsonPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new PackageJsonInvalidPathError({ name: projectPath });
    }

    if ((err as NodeJS.ErrnoException).code === 'EACCES') {
      throw new PackageJsonMissingAccessError({ name: projectPath });
    }

    throw new PackageJsonUnknownError({ name: projectPath, code: (err as NodeJS.ErrnoException).code });
  }

  if (!packageJsonStat.isFile()) {
    throw new PackageJsonInvalidFileError({ name: projectPath });
  }

  return true;
};
