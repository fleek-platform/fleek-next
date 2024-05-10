#!/usr/bin/env node
'use strict';

import * as semver from 'semver';

import { asyncParser, init } from './cli.js';
import { loadJSONFromPackageRoot } from './utils/json.js';
import { checkForPackageUpdates } from './utils/update-notifier.js';

const pkgJson = loadJSONFromPackageRoot('package.json');
const pkgVersion = pkgJson.version;
const requiredVersion = pkgJson.engines.node;

if (!semver.satisfies(process.version, requiredVersion)) {
  // TODO: Pick text from locales
  console.error(`⚠️ You are using Node ${process.version}. We require Node ${requiredVersion} or higher!`);
  process.exit(1);
}

// Inform users of updates in a non-blocking manner
checkForPackageUpdates(pkgJson);

// Catch uncaught exception(s)
process.once('uncaughtException', (error) => {
  throw error;
});

// Initialise
init({ version: pkgVersion, parser: asyncParser });
