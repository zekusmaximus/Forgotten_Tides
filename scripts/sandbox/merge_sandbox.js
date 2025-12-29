#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { lintSandbox } = require('./lint_sandbox');
const { ensureDir, loadFrontmatter, readYamlFile } = require('../lib/file_loader');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    into: args.includes('--into') ? args[args.indexOf('--into') + 1] : 'canonical',
    requireClean: args.includes('--if') ? args[args.indexOf('--if') + 1] === 'clean' : false
  };
}

function copyFile(source, targetRoot) {
  const relative = path.relative(path.join(process.cwd(), 'sandbox'), source);
  const dest = path.join(targetRoot, relative);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(source, dest);
}

function runMerge() {
  const args = parseArgs();
  const { files, findings } = lintSandbox();
  const errors = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity !== 'error');
  if (args.requireClean && (errors.length > 0 || warnings.length > 0)) {
    console.error('Sandbox merge blocked: findings present. Run npm run sandbox:lint.');
    process.exit(1);
  }
  if (errors.length > 0) {
    console.error('Sandbox merge blocked due to errors.');
    process.exit(1);
  }

  const targetRoot = path.join(process.cwd(), 'out', 'sandbox', 'merged');
  ensureDir(targetRoot);
  files.forEach(file => copyFile(file, targetRoot));
  console.log(`Sandbox content copied to ${targetRoot}. Review and manually promote into ${args.into}/.`);
}

if (require.main === module) {
  runMerge();
}
