import { textPrompt } from '../../../prompts/textPrompt.js';
import { t } from '../../../utils/translation.js';
import { config } from '../../../config.js';

export const getProjectIdOrPrompt = async () => {
  let projectId = config.FLEEK_PROJECT_ID;

  if (!projectId) {
    projectId = await textPrompt({
      message: `${t('enterProjectId')}:`,
    });
  }

  return projectId;
};
