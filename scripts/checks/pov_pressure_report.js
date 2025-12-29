#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null,
    jsonOnly: args.includes('--json')
  };
}

function computeMetrics(scenes) {
  const povMap = {};
  scenes.forEach(scene => {
    const pov = scene.data.pov || 'unknown';
    if (!povMap[pov]) {
      povMap[pov] = { word_count: 0, scenes: 0, decisions: 0, consequence_density: 0 };
    }
    povMap[pov].word_count += scene.wordCount;
    povMap[pov].scenes += 1;
    povMap[pov].decisions += scene.data.pov_pressure?.decisions || 0;
    const stakesLevel = scene.data.stakes?.level;
    if (stakesLevel) {
      const levels = { low: 1, medium: 2, high: 3, existential: 4 };
      povMap[pov].consequence_density += levels[stakesLevel] || 0;
    }
  });
  Object.values(povMap).forEach(entry => {
    if (entry.scenes > 0) {
      entry.avg_decisions = entry.decisions / entry.scenes;
      entry.agency_index = (entry.consequence_density + entry.decisions) / entry.scenes;
    } else {
      entry.avg_decisions = 0;
      entry.agency_index = 0;
    }
  });
  return povMap;
}

function main() {
  const args = parseArgs();
  const scenes = collectScenes({ work: args.work });
  const metrics = computeMetrics(scenes);
  const scopeLabel = args.work || 'all';
  const jsonPath = writeJsonReport(`pov_pressure_${scopeLabel}.json`, { scope: scopeLabel, metrics });
  const mdLines = ['# POV Pressure', '', '| POV | Scenes | Words | Avg decisions | Agency index |', '| --- | --- | --- | --- | --- |'];
  Object.entries(metrics).forEach(([pov, data]) => {
    mdLines.push(`| ${pov} | ${data.scenes} | ${data.word_count} | ${data.avg_decisions?.toFixed(2) || 0} | ${data.agency_index?.toFixed(2) || 0} |`);
  });
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`pov_pressure_${scopeLabel}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`POV pressure report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }

  // graph-friendly copy
  const graphDir = path.join(process.cwd(), 'out', 'graphs');
  fs.mkdirSync(graphDir, { recursive: true });
  const graphPath = path.join(graphDir, 'pov_pressure.json');
  fs.writeFileSync(graphPath, JSON.stringify({ scope: scopeLabel, metrics }, null, 2));
}

main();
