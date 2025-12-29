#!/usr/bin/env node
const path = require('path');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null,
    jsonOnly: args.includes('--json'),
    warnOnly: args.includes('--warn-only')
  };
}

function lintMoral(scenes) {
  const totals = {};
  const findings = [];
  scenes.forEach(scene => {
    const actions = scene.data.moral_actions || [];
    actions.forEach(action => {
      const actor = action.actor || 'unknown';
      totals[actor] = (totals[actor] || 0) + (action.weight || 0);
      if (action.weight === undefined) {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), scene.path),
          message: `Moral action missing weight for actor ${actor}`
        });
      }
    });
  });
  Object.entries(totals).forEach(([actor, score]) => {
    if (Math.abs(score) > 10) {
      findings.push({
        severity: 'warning',
        file: null,
        message: `Accumulated moral weight for ${actor} (${score}) exceeds balance threshold`
      });
    }
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const scenes = collectScenes({ work: args.work });
  const findings = lintMoral(scenes);
  const scopeLabel = args.work || 'all';
  const jsonPath = writeJsonReport(`moral_physics_${scopeLabel}.json`, { scope: scopeLabel, findings });
  const mdLines = renderFindings(`Moral Physics (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`moral_physics_${scopeLabel}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`Moral physics report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }
  const errorCount = findings.filter(f => f.severity === 'error').length;
  if (errorCount > 0 && !args.warnOnly) {
    process.exit(1);
  }
}

main();
