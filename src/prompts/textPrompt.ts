import { prompt, PromptArgs } from './prompt.js';

type TextPromptArgs = Omit<PromptArgs, 'type'> & {
  initial?: string;
};

export const textPrompt = async ({ message, initial, validate, onCancel }: TextPromptArgs): Promise<string> => {
  return prompt<string>({ type: 'text', message, initial, validate, onCancel });
};
