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

function detectInertScenes(scenes) {
  const findings = [];
  scenes.forEach(scene => {
    const stakes = scene.data.stakes || {};
    const knowledge = scene.data.knowledge_delta || [];
    const moral = scene.data.moral_actions || [];
    const promises = scene.data.promise_links || [];
    const meaningful = Boolean(stakes.summary || stakes.risk || knowledge.length || moral.length || promises.length);
    const location = path.relative(process.cwd(), scene.path);
    if (!meaningful) {
      findings.push({
        severity: 'warning',
        file: location,
        message: 'No stakes, knowledge change, moral action, or promise signal detected (possible inert scene)'
      });
    }
    if (scene.wordCount < 50) {
      findings.push({
        severity: 'info',
        file: location,
        message: `Very short scene (${scene.wordCount} words); verify it carries narrative weight`
      });
    }
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const scenes = collectScenes({ work: args.work });
  const findings = detectInertScenes(scenes);
  const scopeLabel = args.work || 'all';
  const jsonPath = writeJsonReport(`scene_failure_${scopeLabel}.json`, {
    scope: scopeLabel,
    total_scenes: scenes.length,
    findings
  });
  const mdLines = renderFindings(`Scene Failure Modes (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`scene_failure_${scopeLabel}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`Scene failure report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }

  // Warnings only; do not fail by default.
}

main();
