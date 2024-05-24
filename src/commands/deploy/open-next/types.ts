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
