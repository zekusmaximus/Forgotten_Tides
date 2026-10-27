#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolveExistingWork } = require('./lib/path_safety');

const ROOT = path.join(__dirname, '..');
const CHECKS = [
  'promise_payoff_linter.js',
  'stakes_drift_check.js',
  'knowledge_state_check.js',
  'scene_failure_modes_linter.js',
  'moral_physics_linter.js',
  'reader_model_linter.js',
  'pov_pressure_report.js'
];

function parseArgs(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--work') {
    throw new Error('Usage: npm run validate:work -- --work <work-directory-id>');
  }
  return { work: argv[1] };
}

function findWork(root, work) {
  const { path: workDir } = resolveExistingWork(root, work);
  const scenesDir = path.join(workDir, 'scenes');
  const sceneFiles = fs.existsSync(scenesDir) && fs.lstatSync(scenesDir).isDirectory()
    ? fs.readdirSync(scenesDir, { withFileTypes: true }).filter(entry =>
        entry.isFile() && entry.name.endsWith('.md') &&
        entry.name.toLowerCase() !== 'readme.md' && !/_backup_/i.test(entry.name))
    : [];
  if (sceneFiles.length === 0) {
    throw new Error(`Work ${work} has no live scene files for work-level validation`);
  }
  return workDir;
}

function validateWork({ root = ROOT, work, execute = execFileSync } = {}) {
  findWork(root, work);
  for (const check of CHECKS) {
    const script = path.join(root, 'scripts', 'checks', check);
    const args = [script, '--work', work, '--json'];
    console.log(`> ${path.relative(root, script)} --work ${JSON.stringify(work)} --json`);
    execute(process.execPath, args, { cwd: root, stdio: 'inherit' });
  }
  console.log('Validation reports generated under out/reports/.');
}

if (require.main === module) {
  try {
    const { work } = parseArgs();
    validateWork({ work });
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, findWork, validateWork };
