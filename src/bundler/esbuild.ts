import { BundleFn, BundleFnProps } from './types';
import { build as esbuild } from 'esbuild';

export const bundle: BundleFn = async (props: BundleFnProps) => {
  const { filePath, outputPath } = props;

  esbuild({
    entryPoints: [filePath],
    bundle: true,
    minify: true,
    outfile: outputPath,
  });
};
