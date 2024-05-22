import { textPrompt } from '../../../prompts/textPrompt.js';
import { t } from '../../../utils/translation.js';
import { secrets } from '../../../secrets.js';
import { getProjectPathOrPrompt } from '../prompts/getProjectPathOrPrompt.js';
import { loadJSONFromPath } from '../../../utils/json.js';
import nodePath from 'node:path';

type projectPath = {
  path?: string;
};

export const getProjectIdOrPrompt = async ({ path }: projectPath) => {
  const projectPath = await getProjectPathOrPrompt({ path: path });
  if (!projectPath) {
    return await textPrompt({
      message: `${t('enterProjectId')}:`,
    });
  }

  let configPath = nodePath.join(projectPath, 'fleek.json');
  const config: Record<string, string> = loadJSONFromPath(configPath);

  return config.FLEEK_PROJECT_ID;
};
