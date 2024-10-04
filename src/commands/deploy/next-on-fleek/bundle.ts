import { asyncLocalStoragePolyfill, createFleekBuildConfig } from '@fleek-platform/functions-esbuild-config';
import { build, BuildOptions, OnLoadArgs, OnLoadResult, Plugin } from 'esbuild';
import * as path from 'node:path';
import * as fs from 'node:fs';

const wasmPlugin: Plugin = {
  name: 'wasm',
  setup(build) {
    // Resolve ".wasm" files to a path with a namespace
    build.onResolve({ filter: /\.wasm$/ }, (args) => {
      // If this is the import inside the stub module, import the
      // binary itself. Put the path in the "wasm-binary" namespace
      // to tell our binary load callback to load the binary file.
      if (args.namespace === 'wasm-stub') {
        return {
          path: args.path,
          namespace: 'wasm-binary',
        };
      }

      // Otherwise, generate the JavaScript stub module for this
      // ".wasm" file. Put it in the "wasm-stub" namespace to tell
      // our stub load callback to fill it with JavaScript.
      //
      // Resolve relative paths to absolute paths here since this
      // resolve callback is given "resolveDir", the directory to
      // resolve imports against.
      if (args.resolveDir === '') {
        return; // Ignore unresolvable paths
      }
      return {
        path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
        namespace: 'wasm-stub',
      };
    });

    // Virtual modules in the "wasm-stub" namespace are filled with
    // the JavaScript code for compiling the WebAssembly binary. The
    // binary itself is imported from a second virtual module.
    build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => ({
      contents: `import wasm from ${JSON.stringify(args.path)}
          export default (imports) =>
            WebAssembly.instantiate(wasm, imports).then(
              result => result.instance.exports)`,
    }));

    // Virtual modules in the "wasm-binary" namespace contain the
    // actual bytes of the WebAssembly file. This uses esbuild's
    // built-in "binary" loader instead of manually embedding the
    // binary data inside JavaScript code ourselves.
    build.onLoad(
      { filter: /.*/, namespace: 'wasm-binary' },
      async (args: OnLoadArgs) =>
        ({
          contents: new Uint8Array((await fs.promises.readFile(args.path)).buffer),
          loader: 'binary',
        }) as OnLoadResult,
    );
  },
};

const replacePlugin: Plugin = {
  name: 'replace',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, 'utf8');

      // Perform the replacement
      contents = contents.replace(
        'return p.waitUntil(c.waitUntil), c.response;',
        'await c.waitUntil; return c.response;',
      );

      return { contents, loader: 'js' };
    });
  },
};

export async function bundle(opts: { projectPath: string }) {
  const asyncLocalStoragePolyfillPlugin = asyncLocalStoragePolyfill() as Plugin;

  const fleekConfig = createFleekBuildConfig({
    filePath: path.join(opts.projectPath, '.vercel', 'output', 'static', '_worker.js', 'index.js'),
    bundle: true,
    outFile: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
    },
  }) as BuildOptions;

  await build({
    ...fleekConfig,
    external: [...(fleekConfig.external || []), 'node:*', '@opentelemetry/api', 'critters'],
    treeShaking: true,
    loader: { '.ttf': 'file' },
    minify: true,
    plugins: [wasmPlugin, asyncLocalStoragePolyfillPlugin, replacePlugin],
    alias: {
      url: 'node:url',
      buffer: 'node:buffer',
      crypto: 'node:crypto',
      path: 'node:path',
      stream: 'node:stream',
      http: 'node:http',
      https: 'node:https',
      zlib: 'node:zlib',
      util: 'node:util',
      events: 'node:events',
    },
    define: {
      'process.env.VERCEL_ENV': '"production"',
      'process.env.VERCEL_BRANCH_URL': '""',
      'process.env.VERCEL_PROJECT_PRODUCTION_URL': '""',
      'process.env.PORT': '"80"',
      'process.env.NEXT_PRIVATE_TEST_PROXY': '"false"',
      'process.env.MAX_REVALIDATE_CONCURRENCY': '0',
      'process.env.NEXT_OTEL_FETCH_DISABLED': '"true"',
      'process.env.NEXT_OTEL_PERFORMANCE_PREFIX': '""',
      'process.env.NEXT_OTEL_VERBOSE': '0',
      'process.env.NEXT_PRIVATE_DEBUG_CACHE': '"false"',
      'process.env.SUSPENSE_CACHE_URL': '""',
      'process.env.SUSPENSE_CACHE_BASEPATH': '"/cache"',
      'process.env.SUSPENSE_CACHE_AUTH_TOKEN': '"foo"',
      'process.env.__NEXT_TEST_MAX_ISR_CACHE': '0',
      'process.env.__NEXT_INCREMENTAL_CACHE_IPC_PORT': '8080',
      'process.env.__NEXT_INCREMENTAL_CACHE_IPC_KEY': '"foo"',
      'process.env.__NEXT_PREVIEW_MODE_ID': '""',
      'process.env.__NEXT_PREVIEW_MODE_SIGNING_KEY': '""',
      'process.env.__NEXT_PREVIEW_MODE_ENCRYPTION_KEY': '""',
    },
  });
}
