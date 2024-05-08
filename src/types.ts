export interface FleekNextOutput {
  origins: Record<string, { url: string }>;
}

export type HttpMethod = 'Get' | 'Head' | 'Post' | 'Put' | 'Delete' | 'Connect' | 'Options' | 'Trace' | 'Patch';

export type FleekRequest = {
  method: HttpMethod;
  headers?: Record<string, string>;
  path: string;
  query?: Record<string, string>;
  body: string;
};

export type FleekResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};
