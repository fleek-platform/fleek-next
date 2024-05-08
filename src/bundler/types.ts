export type BundleFnProps = {
  filePath: string;
  outputPath: string;
};

export type BundleFn = (props: BundleFnProps) => Promise<void>;
