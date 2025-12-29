#!/usr/bin/env node
const { execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null
  };
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run validate:work -- --work "<name>"');
    process.exit(1);
  }
  const work = args.work;
  run(`node scripts/checks/promise_payoff_linter.js --work ${work} --json`);
  run(`node scripts/checks/stakes_drift_check.js --work ${work} --json`);
  run(`node scripts/checks/knowledge_state_check.js --work ${work} --json`);
  run(`node scripts/checks/scene_failure_modes_linter.js --work ${work} --json`);
  run(`node scripts/checks/moral_physics_linter.js --work ${work} --json`);
  run(`node scripts/checks/reader_model_linter.js --work ${work} --json`);
  run(`node scripts/checks/pov_pressure_report.js --work ${work} --json`);
  console.log('Validation reports generated under out/reports/.');
}

main();
