import * as fs from 'node:fs';

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
