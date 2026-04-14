const { existsSync, renameSync } = require('fs');
const { spawnSync } = require('child_process');

const patchTargets = [
  {
    packagePath: 'node_modules/@expo/config-plugins',
    patchFile: 'patches/@expo+config-plugins+55.0.7.patch',
  },
  {
    packagePath: 'node_modules/fbjs',
    patchFile: 'patches/fbjs+3.0.5.patch',
  },
];

const temporarilyDisabledPatches = [];

for (const target of patchTargets) {
  if (!existsSync(target.patchFile) || existsSync(target.packagePath)) {
    continue;
  }
  const disabledPath = `${target.patchFile}.disabled`;
  renameSync(target.patchFile, disabledPath);
  temporarilyDisabledPatches.push({ original: target.patchFile, disabled: disabledPath });
  console.log(`Temporarily disabled patch for missing package: ${target.patchFile}`);
}

let exitCode = 1;
try {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['patch-package'],
    { stdio: 'inherit' },
  );

  if (typeof result.status === 'number') {
    exitCode = result.status;
  } else {
    console.error('patch-package did not return a valid exit status.');
  }
} finally {
  for (const patch of temporarilyDisabledPatches) {
    renameSync(patch.disabled, patch.original);
  }
}

process.exit(exitCode);
