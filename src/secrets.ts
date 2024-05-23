type Secrets = {
  FLEEK_PAT?: string;
  FLEEK_PROJECT_ID?: string;
};

export const secrets: Secrets = {
  FLEEK_PAT: process.env.FLEEK_PAT,
  FLEEK_PROJECT_ID: process.env.FLEEK_PROJECT_ID,
};
