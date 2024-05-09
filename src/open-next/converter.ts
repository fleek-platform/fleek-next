import { FleekRequest, FleekResponse } from '../types';
import { InternalResult } from './types';

async function convertFrom(event: FleekRequest) {
  const url = new URL(event.path, 'http://0.0.0.0');
  return {
    type: 'core',
    method: event.method,
    rawPath: event.path,
    url: event.headers?.host ? event.headers.host : url.toString(),
    body: event.body ? Buffer.from(event.body, 'utf8') : null,
    headers: { host: url.toString(), ...event.headers },
    query: event.query ?? {},
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
