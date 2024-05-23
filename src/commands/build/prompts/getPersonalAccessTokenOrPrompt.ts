import { textPrompt } from '../../../prompts/textPrompt.js';
import { t } from '../../../utils/translation.js';
import { secrets } from '../../../secrets.js';

export const getPersonalAccessTokenOrPrompt = async () => {
  let personalAccessToken = secrets.FLEEK_PAT;

  if (!personalAccessToken) {
    personalAccessToken = await textPrompt({
      message: `${t('enterPersonalAccessToken')}:`,
    });
  }

  return personalAccessToken;
};
