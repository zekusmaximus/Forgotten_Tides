#!/usr/bin/env node
const path = require('path');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null, warnOnly: false, jsonOnly: false };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
    if (arg === '--warn-only') out.warnOnly = true;
    if (arg === '--json') out.jsonOnly = true;
  });
  return out;
}

function levelToNumber(level) {
  const map = { low: 1, medium: 2, high: 3, existential: 4 };
  if (!level) return 0;
  return map[level] || 0;
}

function analyzeStakes(scenes) {
  const findings = [];
  const byWork = {};
  scenes.forEach(scene => {
    if (!byWork[scene.workId || 'unknown']) byWork[scene.workId || 'unknown'] = [];
    byWork[scene.workId || 'unknown'].push(scene);
  });

  Object.entries(byWork).forEach(([workId, workScenes]) => {
    let previousLevel = null;
    workScenes.forEach(scene => {
      const stakes = scene.data.stakes || {};
      const level = levelToNumber(stakes.level);
      if (!stakes.summary && !stakes.risk && !stakes.cost) {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), scene.path),
          message: 'Scene missing stakes summary; risk of inert pacing'
        });
      }
      if (previousLevel !== null && level > 0 && Math.abs(level - previousLevel) > 2) {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), scene.path),
          message: `Stakes drift detected: level jumps from ${previousLevel} to ${level}`
        });
      }
      previousLevel = level || previousLevel;
    });
  });

  return findings;
}

function main() {
  const args = parseArgs();
  const scenes = collectScenes({ work: args.work });
  const findings = analyzeStakes(scenes);
  const scopeLabel = args.work || 'all';

  const jsonPath = writeJsonReport(`stakes_drift_${scopeLabel}.json`, {
    scope: scopeLabel,
    total_scenes: scenes.length,
    findings
  });
  const mdLines = renderFindings(`Stakes Drift Report (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`stakes_drift_${scopeLabel}.md`, mdLines);

  if (!args.jsonOnly) {
    console.log(`Stakes report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }

  const errorCount = findings.filter(f => f.severity === 'error').length;
  if (errorCount > 0 && !args.warnOnly) {
    process.exit(1);
  }
}

main();
