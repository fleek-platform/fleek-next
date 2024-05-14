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

export function findPackageManager(opts: { projectPath: string }) {
  const { projectPath } = opts;

  const found = packageManagers.find((packageManager) => existsSync(path.join(projectPath, packageManager.file)));

  return found?.packager ?? PackageManager.npm;
}

export function getBuildCommand(opts: { packageManager: string }) {
  const { packageManager } = opts;
  return `${packageManager} build`;
}

export function getInstallCommand(opts: { packageManager: string }) {
  const { packageManager } = opts;
  return packageManager === PackageManager.yarn ? packageManager : `${packageManager} install`;
}
