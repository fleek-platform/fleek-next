import { FleekRequest, FleekResponse } from '../types';
import { InternalResult } from './types';

async function convertFrom(event: FleekRequest) {
  return {
    type: 'core',
    method: 'GET',
    rawPath: event.path,
    url: event.path,
    body: Buffer.from(event.body ?? '', 'utf8'),
    headers: { host: '', ...event.headers },
    query: event.query,
    cookies: {},
    remoteAddress: '0.0.0.0',
  };
}

async function convertTo(result: InternalResult): Promise<FleekResponse> {
  return {
    status: result.statusCode,
    headers: convertHeaders(result.headers),
    body: result.body,
  };
}

function convertHeaders(headers: Record<string, string | string[]>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return result;
}

export const converter = {
  convertFrom,
  convertTo,
  name: 'fleek',
};
