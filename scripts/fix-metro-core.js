#!/usr/bin/env node
/**
 * fix-metro-core.js
 *
 * metro-core@0.83.x is published with an incomplete src/ directory — the
 * prepared build files (index.js, Logger.js, Terminal.js, errors.js, etc.)
 * are missing. This script re-extracts them from the published tarball so
 * `npm install` leaves the package in a working state.
 *
 * Runs as part of postinstall: "patch-package && node scripts/fix-metro-core.js"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const METRO_CORE_SRC = path.join(__dirname, '..', 'node_modules', 'metro-core', 'src');
const INDEX_JS = path.join(METRO_CORE_SRC, 'index.js');

// Already healthy — nothing to do
if (fs.existsSync(INDEX_JS)) {
  process.exit(0);
}

console.log('[fix-metro-core] metro-core/src/index.js missing — re-extracting from tarball...');

try {
  const tmp = require('os').tmpdir();
  const pkg = require('../node_modules/metro-core/package.json');
  const version = pkg.version;
  execSync(`npm pack metro-core@${version}`, { cwd: tmp, stdio: 'ignore' });
  const tgz = path.join(tmp, `metro-core-${version}.tgz`);
  execSync(`tar -xzf "${tgz}" package/src/`, { cwd: tmp, stdio: 'ignore' });
  const extracted = path.join(tmp, 'package', 'src');
  // Copy everything extracted into node_modules/metro-core/src/
  const files = fs.readdirSync(extracted, { recursive: true });
  for (const file of files) {
    const src = path.join(extracted, file);
    const dest = path.join(METRO_CORE_SRC, file);
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  console.log('[fix-metro-core] Done.');
} catch (err) {
  console.error('[fix-metro-core] Failed:', err.message);
  process.exit(1);
}
