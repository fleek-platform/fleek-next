import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { OpenNextOutput } from './open-next/types';
import { MiddlewareManifest } from './next/types';

export async function copyDir(props: { src: string; dest: string }) {
  const { src, dest } = props;
  const entries = await fs.readdir(src, { withFileTypes: true });

  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir({ src: srcPath, dest: destPath });
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export function getBuildEnvVars(opts: { environment?: Record<string, string> }) {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v) {
      env[k] = v;
    }
  }
  for (const [k, v] of Object.entries(opts.environment || {})) {
    // don't replace server only env vars for static assets
    if (k.startsWith('NEXT_PUBLIC_')) {
      env[k] = getSubstitutionValue(k);
    } else {
      env[k] = v;
    }
  }
  return env;
}

export function getSubstitutionValue(v: string): string {
  return `{{ ${v} }}`;
}

export function readMiddlewareManifest(openNextPath: string): MiddlewareManifest {
  return JSON.parse(
    readFileSync(path.join(openNextPath, '.next', 'server', 'middleware-manifest.json'), 'utf-8'),
  ) as MiddlewareManifest;
}

export function readOpenNextOutput(openNextPath: string): OpenNextOutput {
  return JSON.parse(
    readFileSync(path.join(openNextPath, '.open-next', 'open-next.output.json'), 'utf-8'),
  ) as OpenNextOutput;
}

export function printHeader(header: string) {
  header = `FleekNext — ${header}`;
  console.info(
    [
      '',
      '┌' + '─'.repeat(header.length + 2) + '┐',
      `│ ${header} │`,
      '└' + '─'.repeat(header.length + 2) + '┘',
      '',
    ].join('\n'),
  );
}
