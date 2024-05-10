import { FleekSdk, PersonalAccessTokenService } from '@fleekxyz/sdk';
import { getPersonalAccessTokenOrPrompt } from '../commands/build/prompts/getPersonalAccessTokenOrPrompt.js';
import { getProjectIdOrPrompt } from '../commands/build/prompts/getProjectIdOrPrompt.js';
import { MissingPersonalAccessTokenError } from '../errors/MissingPersonalAccessTokenError.js';
import { MissingProjectIdError } from '../errors/MissingProjectIdError.js';

export async function getSdkClient(): Promise<FleekSdk> {
  const personalAccessToken = await getPersonalAccessTokenOrPrompt();

  if (!personalAccessToken) {
    throw new MissingPersonalAccessTokenError();
  }

  const projectId = await getProjectIdOrPrompt();

  if (!projectId) {
    throw new MissingProjectIdError();
  }

  const accessTokenService = new PersonalAccessTokenService({ projectId, personalAccessToken });
  const sdk = new FleekSdk({ accessTokenService });

  return sdk;
}
