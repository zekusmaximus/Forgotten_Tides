#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd, env = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
}

function expectFile(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Expected file not found: ${p}`);
  }
}

function main() {
  const reportsDir = path.join(process.cwd(), 'out', 'reports');
  const compiledDir = path.join(process.cwd(), 'out', 'compiled');
  const work = 'SCREENPLAY_SAMPLE';
  run(`node scripts/checks/promise_payoff_linter.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `promise_payoff_${work}.json`));

  run(`node scripts/checks/stakes_drift_check.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `stakes_drift_${work}.json`));

  run(`node scripts/checks/knowledge_state_check.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `knowledge_state_${work}.json`));

  run(`node scripts/checks/scene_failure_modes_linter.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `scene_failure_${work}.json`));

  run(`node scripts/checks/moral_physics_linter.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `moral_physics_${work}.json`));

  run(`node scripts/checks/reader_model_linter.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `reader_model_${work}.json`));

  run(`node scripts/checks/pov_pressure_report.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `pov_pressure_${work}.json`));

  run(`node scripts/checks/screenplay_format_linter.js --work ${work} --json`);
  expectFile(path.join(reportsDir, `screenplay_lint_${work}.json`));

  run(`node scripts/compile_screenplay.js --work ${work}`);
  expectFile(path.join(compiledDir, `${work}.fountain`));

  run(`node scripts/compile_edit_packet.js --work ${work}`);
  expectFile(path.join(compiledDir, `${work}_edit_packet.md`));

  run(`node scripts/sandbox/lint_sandbox.js`);
  expectFile(path.join(reportsDir, `sandbox_lint.json`));

  const scenePath = path.join(process.cwd(), 'stories', 'screenplay', work, 'scenes', 'SCENE_SCREENPLAY_SAMPLE_001.md');
  const prevPath = path.join(process.cwd(), 'out', 'tmp_previous_scene.md');
  fs.mkdirSync(path.join(process.cwd(), 'out'), { recursive: true });
  const prior = fs.readFileSync(scenePath, 'utf8').replace('Hold steady.', 'Hold steady. (previous)');
  fs.writeFileSync(prevPath, prior, 'utf8');
  run(`node scripts/prompt/scene_diff.js --scene ${scenePath} --previous ${prevPath}`);
  expectFile(path.join(reportsDir, `scene_diff_SCENE_SCREENPLAY_SAMPLE_001.json`));

  console.log('All upgrade checks passed.');
}

main();
