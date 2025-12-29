#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');
const { safeJsonParse } = require('../lib/file_loader');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null,
    jsonOnly: args.includes('--json'),
    warnOnly: args.includes('--warn-only')
  };
}

function loadConfig() {
  const configPath = path.join(process.cwd(), 'docs', 'reader_model.json');
  if (!fs.existsSync(configPath)) {
    return { recall_half_life_scenes: 3, entity_confusion_threshold: 5, reinforcement_window: 2, max_new_entities_per_scene: 4 };
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  return safeJsonParse(raw) || {};
}

function readerLint(scenes, config) {
  const findings = [];
  const byWork = {};
  scenes.forEach(scene => {
    const key = scene.workId || 'unknown';
    if (!byWork[key]) byWork[key] = [];
    byWork[key].push(scene);
  });

  Object.entries(byWork).forEach(([workId, workScenes]) => {
    const introduced = {};
    workScenes.forEach((scene, idx) => {
      const deltas = scene.data.knowledge_delta || [];
      const newEntities = deltas.filter(d => d.change === 'reveal').map(d => d.entity);
      if (config.max_new_entities_per_scene && newEntities.length > config.max_new_entities_per_scene) {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), scene.path),
          message: `Introduces ${newEntities.length} entities; above threshold ${config.max_new_entities_per_scene}`
        });
      }
      newEntities.forEach(entity => {
        introduced[entity] = idx;
      });
      Object.entries(introduced).forEach(([entity, seenAt]) => {
        const distance = idx - seenAt;
        if (distance > config.reinforcement_window && !newEntities.includes(entity)) {
          findings.push({
            severity: 'warning',
            file: path.relative(process.cwd(), scene.path),
            message: `Entity ${entity} not reinforced within ${config.reinforcement_window} scenes of introduction`
          });
          introduced[entity] = idx; // reset after warning to avoid spam
        }
      });
    });
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const config = loadConfig();
  const scenes = collectScenes({ work: args.work });
  const findings = readerLint(scenes, config);
  const scopeLabel = args.work || 'all';
  const jsonPath = writeJsonReport(`reader_model_${scopeLabel}.json`, {
    scope: scopeLabel,
    config,
    findings
  });
  const mdLines = renderFindings(`Reader Model (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`reader_model_${scopeLabel}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`Reader model report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }

  // Warnings only; do not fail by default.
}

main();
