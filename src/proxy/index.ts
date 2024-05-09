import { Routes } from '@fleekxyz/proxy';

export const proxyFunctionTemplate = (props: { routes: Routes; default: string }) => {
  return `import { FleekRequest, createProxy } from '@fleekxyz/proxy';

export function main(request: FleekRequest) {
  return createProxy({rules: ${JSON.stringify(props.routes)}, default: "${props.default}"}).proxyRequest(request);
}
`;
};
