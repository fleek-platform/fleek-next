export type BaseFunction = {
  handler: string;
  bundle: string;
};

export type OpenNextFunctionOrigin = {
  type: 'function';
  streaming?: boolean;
} & BaseFunction;

export type OpenNextS3Origin = {
  type: 's3';
  originPath: string;
  copy: {
    from: string;
    to: string;
    cached: boolean;
    versionedSubDir?: string;
  }[];
};

export type OpenNextOrigins = OpenNextFunctionOrigin | OpenNextS3Origin;

export interface OpenNextOutput {
  edgeFunctions: {
    [key: string]: BaseFunction;
  };
  origins: {
    s3: OpenNextS3Origin;
    default: OpenNextFunctionOrigin;
    imageOptimizer: OpenNextFunctionOrigin;
    [key: string]: OpenNextOrigins;
  };
  behaviors: {
    pattern: string;
    origin?: string;
    edgeFunction?: string;
  }[];
  additionalProps?: {
    disableIncrementalCache?: boolean;
    disableTagCache?: boolean;
    initializationFunction?: BaseFunction;
    warmer?: BaseFunction;
    revalidationFunction?: BaseFunction;
  };
}

export type BaseEventOrResult<T extends string = string> = {
  type: T;
};

export type InternalEvent = {
  readonly method: string;
  readonly rawPath: string;
  readonly url: string;
  readonly body?: Buffer;
  readonly headers: Record<string, string>;
  readonly query: Record<string, string | string[]>;
  readonly cookies: Record<string, string>;
  readonly remoteAddress: string;
} & BaseEventOrResult<'core'>;

export type InternalResult = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  isBase64Encoded: boolean;
} & BaseEventOrResult<'core'>;

export type BaseOverride = {
  name: string;
};

export type Converter<
  E extends BaseEventOrResult = InternalEvent,
  R extends BaseEventOrResult = InternalResult,
> = BaseOverride & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  convertFrom: (event: any) => Promise<E>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  convertTo: (result: R, originalRequest?: any) => any;
};
