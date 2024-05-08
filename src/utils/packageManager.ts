import { existsSync } from 'node:fs';
import path from 'node:path';

export enum PackageManager {
  npm = 'npm',
  yarn = 'yarn',
  pnpm = 'pnpm',
  bun = 'bun',
}

const packageManagers = [
  { file: 'package-lock.json', packager: PackageManager.npm },
  { file: 'yarn.lock', packager: PackageManager.yarn },
  { file: 'pnpm-lock.yaml', packager: PackageManager.pnpm },
  { file: 'bun.lockb', packager: PackageManager.bun },
];

export function findPackageManager(appPath: string) {
  const found = packageManagers.find((packageManager) => existsSync(path.join(appPath, packageManager.file)));

  return found?.packager ?? PackageManager.npm;
}
