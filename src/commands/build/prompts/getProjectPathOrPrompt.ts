import { textPrompt } from '../../../prompts/textPrompt.js';
import { t } from '../../../utils/translation.js';
import { validateProjectPath } from '../../../validation/isProjectPathValid.js';

type GetProjectPathOrPromptArgs = {
  path?: string;
};

export const getProjectPathOrPrompt = async ({ path }: GetProjectPathOrPromptArgs) => {
  let projectPath;
  if (!path) {
    projectPath = process.cwd();
    try {
      await validateProjectPath({ projectPath });
    } catch (err) {
      projectPath = await textPrompt({ message: `${t('enterProjectPath')}:` });
    }
  } else {
    projectPath = path;
    await validateProjectPath({ projectPath });
  }

  return projectPath;
};
