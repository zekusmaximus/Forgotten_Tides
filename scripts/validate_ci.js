#!/usr/bin/env node

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
  runNpmScript('lint');
  runNpmScript('check');
  runNpmScript('test:dashboard');
  runNpmScript('test:upgrades');
  runNpmScript('test:coverage');
  runNpmScript('test:canon-policy');
  runNpmScript('test:prompt-pack');
  runNpmScript('test:timeline-events');
  console.log('CI-parity validation passed.');
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
