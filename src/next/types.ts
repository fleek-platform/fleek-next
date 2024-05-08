export type FunctionManifest = {
  files: string[];
  name: string;
  page: string;
  matchers: {
    regexp: string;
    originalSource: string;
  }[];
  wasm: string[];
  assets: string[];
  environments: {
    previewModeId: string;
    previewModeSigningKey: string;
    previewModeEncryptionKey: string;
  };
};

export interface MiddlewareManifest {
  version: number;
  middleware: Record<string, FunctionManifest>;
  functions: Record<string, FunctionManifest>;
  sortedMiddleware: string[];
}
