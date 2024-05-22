type Secrets = {
  FLEEK_TOKEN?: string;
  FLEEK_PROJECT_ID?: string;
};

export const secrets: Secrets = {
  FLEEK_TOKEN: process.env.FLEEK_PAT,
  FLEEK_PROJECT_ID: process.env.FLEEK_PROJECT_ID,
};
