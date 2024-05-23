import { Routes } from '@fleek-platform/proxy';

export const proxyFunctionTemplate = (props: { routes: Routes; default: string }) => {
  return `import { FleekRequest, createProxy } from '@fleek-platform/proxy';

export function main(request: FleekRequest) {
  return createProxy({rules: ${JSON.stringify(props.routes)}, default: "${props.default}"}).proxyRequest(request);
}
`;
};
