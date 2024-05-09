#!/usr/bin/env node
import { readMiddlewareManifest, readOpenNextOutput } from './utils';

import { FleekSdk, PersonalAccessTokenService } from '@fleekxyz/sdk';
import { findPackageManager } from './utils/packageManager';
import { buildApp } from './next';
import { buildOpenNextConfig, bundleApp } from './open-next';
import { createOrigins, createProxyFunction } from './fleek';

(async () => {
  const fleekSdk = new FleekSdk({
    projectId: process.env.FLEEK_PROJECT_ID!,
    accessTokenService: new PersonalAccessTokenService({
      personalAccessToken: process.env.FLEEK_PAT!,
      projectId: process.env.FLEEK_PROJECT_ID!,
    }),
  });

  const openNextPath = process.cwd();
  const packageManager = findPackageManager(openNextPath);

  buildApp({
    openNextPath,
    environment: {},
    packageManager,
  });

  const middlewareManifest = readMiddlewareManifest(openNextPath);

  buildOpenNextConfig({
    openNextPath,
    middlewareManifest,
  });

  bundleApp({
    openNextPath,
  });

  const openNextOutput = readOpenNextOutput(openNextPath);

  const props = {
    openNextPath,
    openNextOutput,
    fleekSdk,
  };

  const origins = await createOrigins(props);

  await createProxyFunction({
    openNextPath,
    middlewareManifest,
    origins,
    fleekSdk,
  });

  process.exit(0);
})();
