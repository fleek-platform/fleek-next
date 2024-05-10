import { loadJSONFromPackageRoot } from './json.js';
const en: Record<string, string> = loadJSONFromPackageRoot('locales/en.json');
import chalk from 'chalk';

import type { En } from '../../locales/en.js';

type AnsiOptions = {
  bold: boolean;
};

type Values = Record<string, string | AnsiOptions> & {
  options?: AnsiOptions;
};

// TODO: Refactor the color system to be stricter to a small amount of well defined colours and meanings. See `Output.ts`, `update-notifier.ts` and wherever its applied

// Ansi escape code handlers
// these are ansi level, so do not confuse with the
// cli `Output.ts`
const _b = (text: string) => chalk['bold'](text);

const _t = (key: string, values?: Values) => {
  const txt = (en as Record<string, string>)[key];

  if (!txt) {
    console.error(`Missing ${key}`);

    return `[ERROR: Missing ${key}]`;
  }

  const matches = [...txt.matchAll(/{(.*?)}/g)];

  let transl = txt;

  if (matches.length && values) {
    transl = matches.reduce((acc, curr) => {
      const txt = values[curr[1]];

      // Skip non-matches
      // e.g. the update-notifier uses the same placeholder
      // convention as the localization as {placeholder}
      if (typeof txt !== 'string') {
        return acc;
      }

      const val = values?.options?.bold ? _b(txt) : txt;
      acc = acc.replace(curr[0], val);

      return acc;
    }, txt);
  }

  return transl;
};

// TODO: create util for plural e.g. project -> projects
export const t = (key: En, values?: Values) => _t(key as string, values);
