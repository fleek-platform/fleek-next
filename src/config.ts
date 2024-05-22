import { loadJSONFromPackageRoot } from './utils/json.js';
const cfg: Record<string, string> = loadJSONFromPackageRoot('fleek.json');

type Config = {
  FLEEK_PROJECT_ID?: string;
};

export const config: Config = {
  FLEEK_PROJECT_ID: cfg.FLEEK_PROJECT_ID,
};
