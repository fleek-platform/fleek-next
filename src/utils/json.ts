// Warning this file may be included from outside `/src`
// For example, see `/bin/index.js`
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// The build distribution target directory
const BUILD_DIST_PATHNAME = '/dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leadingSlash = (str: string) => (str.startsWith('/') ? str : '/' + str);

const resolvePath = (filename: string) => {
  return path.join(__dirname.split(BUILD_DIST_PATHNAME)[0], leadingSlash(filename));
};

// JSON files should live outside `src`
// help prevent tsc from generating the directory `/dist/src`
// as current setup prefers surface files from `/src` into `/dist`
export const loadJSONFromPackageRoot = (filename: string) => {
  const resolved = resolvePath(filename);

  return loadJSONFromPath(resolved);
};

export const loadJSONFromPath = (filePath: string) => {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};
