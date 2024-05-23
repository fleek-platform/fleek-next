import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as fs from 'node:fs';

import { MiddlewareManifest } from './commands/deploy/next/types.js';
import { OpenNextOutput } from './commands/deploy/open-next/types.js';

export async function copyDir(props: { src: string; dest: string }) {
  const { src, dest } = props;
  const entries = await fs.readdirSync(src, { withFileTypes: true });

  await fs.mkdirSync(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir({ src: srcPath, dest: destPath });
    } else {
      await fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function rmDir(props: { dirPath: string }) {
  const { dirPath } = props;
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
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

export function readMiddlewareManifest(projectPath: string): MiddlewareManifest {
  return JSON.parse(
    readFileSync(path.join(projectPath, '.next', 'server', 'middleware-manifest.json'), 'utf-8'),
  ) as MiddlewareManifest;
}

export function readOpenNextOutput(projectPath: string): OpenNextOutput {
  return JSON.parse(
    readFileSync(path.join(projectPath, '.open-next', 'open-next.output.json'), 'utf-8'),
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
