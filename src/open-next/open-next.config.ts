export const templateOpenNextConfig = (opts: {
  functionConfigs: string;
}) => `export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';

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
  

const wrapperHandler = async (
  handler: (event: InternalEvent) => Promise<InternalResult>,
  converter: Converter<InternalEvent, InternalResult>,
) => {
  return async (event: FleekRequest): Promise<FleekResponse> => {
    const internalEvent = await converter.convertFrom(event);
    const response = await handler(internalEvent);
    return converter.convertTo(response);
  };
};

export const wrapper = {
  wrapper: wrapperHandler,
  supportStreaming: false,
  name: 'fleek',
};

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


const config = {
  default: {
    runtime: "edge",
    experimentalBundledNextServer: true,
    minify: true,
    placement: "global",
    override: {
      converter: async () => converter,
      wrapper: async () => wrapper,
    },
  },
  imageOptimization: {
    override: {
      converter: async () => converter,
      wrapper: async () => wrapper,
    },
  },
  middleware: {
    override: {
      converter: async () => converter,
      wrapper: async () => wrapper,
    },
  },
  buildCommand: "npm run build",
  dangerous: {
    disableIncrementalCache: true,
    disableTagCache: true,
  },
  functions: {
    ${opts.functionConfigs}
  },
};

export default config;`;
