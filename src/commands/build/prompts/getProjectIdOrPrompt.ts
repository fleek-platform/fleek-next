import { textPrompt } from '../../../prompts/textPrompt.js';
import { t } from '../../../utils/translation.js';
import { secrets } from '../../../secrets.js';

export const getProjectIdOrPrompt = async () => {
  let projectId = secrets.FLEEK_PROJECT_ID;

  if (!projectId) {
    projectId = await textPrompt({
      message: `${t('enterProjectId')}:`,
    });
  }

  return projectId;
};
