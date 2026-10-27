#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

const DEFAULT_CONFIG = {
  recall_half_life_scenes: 3,
  entity_confusion_threshold: 5,
  reinforcement_window: 2,
  max_new_entities_per_scene: 4
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null,
    jsonOnly: args.includes('--json'),
    warnOnly: args.includes('--warn-only')
  };
}

function loadConfig(rootDir = process.cwd()) {
  const configPath = path.join(rootDir, 'docs', 'reader_model.json');
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Could not parse ${configPath}: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid ${configPath}: expected a JSON object`);
  }
  const config = { ...DEFAULT_CONFIG, ...parsed };
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    if (!Number.isInteger(config[key]) || config[key] < 0) {
      throw new Error(`Invalid ${configPath}: ${key} must be a non-negative integer`);
    }
  }
  return config;
}

function readerLint(scenes, config) {
  const findings = [];
  const byWork = new Map();
  scenes.forEach(scene => {
    const key = `${scene.workKind || '(unknown kind)'}\0${scene.workId || '(unknown work)'}`;
    if (!byWork.has(key)) byWork.set(key, []);
    byWork.get(key).push(scene);
  });

  for (const workScenes of byWork.values()) {
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
  }
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

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { loadConfig, readerLint };
