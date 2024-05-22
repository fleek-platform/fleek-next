type Secrets = {
  FLEEK_TOKEN?: string;
};

export const secrets: Secrets = {
  FLEEK_TOKEN: process.env.FLEEK_PAT,
};
