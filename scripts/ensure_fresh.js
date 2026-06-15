#!/usr/bin/env node

/**
 * ensure-fresh.js
 * Rebuilds generated canon artifacts and verifies they are committed
 * (identical to the first half of validate:ci, but reusable as a guard).
 * Exit non-zero if artifacts would be dirty or any rebuild step fails.
 */

const { execFileSync } = require('child_process');

const npmCommand = 'npm';

function run(command, args, options = {}) {
  console.log(`> ${[command, ...args].join(' ')}`);
  execFileSync(command, args, {
    stdio: 'inherit',
    shell: Boolean(options.shell)
  });
}

function runNpmScript(script) {
  run(npmCommand, ['run', script], { shell: process.platform === 'win32' });
}

function verifyGeneratedArtifacts() {
  run('git', [
    'diff',
    '--exit-code',
    '-I[Gg]enerated',
    '--',
    'CANONICAL_INDEX.md',
    'REFERENCE_MAP.json',
    'docs/link_map/LINK_MAP.md'
  ]);
}

function main() {
  runNpmScript('linkmap:build');
  verifyGeneratedArtifacts();
  console.log('✅ Generated canon artifacts are fresh and committed.');
}

try {
  main();
} catch (error) {
  if (error && error.status != null) {
    process.exit(error.status);
  }
  console.error(error.message || error);
  process.exit(1);
}
