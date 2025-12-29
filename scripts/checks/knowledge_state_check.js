#!/usr/bin/env node
const path = require('path');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null, jsonOnly: false, warnOnly: false };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
    if (arg === '--json') out.jsonOnly = true;
    if (arg === '--warn-only') out.warnOnly = true;
  });
  return out;
}

function lintKnowledge(scenes) {
  const findings = [];
  const byWork = {};
  scenes.forEach(scene => {
    const key = scene.workId || 'unknown';
    if (!byWork[key]) byWork[key] = [];
    byWork[key].push(scene);
  });

  Object.values(byWork).forEach(workScenes => {
    const state = {};
    workScenes.forEach(scene => {
      const deltas = scene.data.knowledge_delta || [];
      deltas.forEach(delta => {
        const prev = state[delta.entity];
        const location = path.relative(process.cwd(), scene.path);
        if (delta.change === 'reveal' && prev === 'known') {
          findings.push({ severity: 'warning', file: location, message: `Redundant reveal for ${delta.entity}` });
        }
        if (delta.change === 'contradict' && prev && prev !== 'false') {
          findings.push({ severity: 'error', file: location, message: `Contradiction for ${delta.entity} (previously ${prev})` });
        }
        if (delta.change === 'reinforce' && !prev) {
          findings.push({ severity: 'warning', file: location, message: `Reinforcement without prior introduction for ${delta.entity}` });
        }
        if (delta.change === 'forget' && !prev) {
          findings.push({ severity: 'warning', file: location, message: `Forgetting unknown entity ${delta.entity}` });
        }
        state[delta.entity] = delta.change === 'forget' ? 'forgotten' :
          delta.change === 'contradict' ? 'false' :
          'known';
      });
      const declared = scene.data.knowledge_state || {};
      Object.entries(declared).forEach(([entity, value]) => {
        const current = state[entity];
        if (current && current !== value) {
          findings.push({
            severity: 'warning',
            file: path.relative(process.cwd(), scene.path),
            message: `Declared knowledge_state "${value}" for ${entity} differs from tracked "${current}"`
          });
        } else {
          state[entity] = value;
        }
      });
    });
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const scenes = collectScenes({ work: args.work });
  const findings = lintKnowledge(scenes);
  const scopeLabel = args.work || 'all';

  const jsonPath = writeJsonReport(`knowledge_state_${scopeLabel}.json`, {
    scope: scopeLabel,
    total_scenes: scenes.length,
    findings
  });
  const mdLines = renderFindings(`Knowledge State Report (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`knowledge_state_${scopeLabel}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`Knowledge report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }

  const errorCount = findings.filter(f => f.severity === 'error').length;
  if (errorCount > 0 && !args.warnOnly) {
    process.exit(1);
  }
}

main();
