#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { loadFrontmatter } = require('../lib/file_loader');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    work: args.includes('--work') ? args[args.indexOf('--work') + 1] : null,
    jsonOnly: args.includes('--json')
  };
}

function collectScreenplayScenes(workId) {
  const base = workId
    ? path.join(process.cwd(), 'stories', 'screenplay', workId, 'scenes')
    : path.join(process.cwd(), 'stories', 'screenplay');
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (entry.name.endsWith('.md')) out.push(full);
    });
  }
  walk(base);
  return out.sort().map(loadFrontmatter);
}

function lintScenes(scenes) {
  const findings = [];
  scenes.forEach(scene => {
    const rel = path.relative(process.cwd(), scene.path);
    if (!scene.data.scene_heading && !scene.data.slug) {
      findings.push({ severity: 'warning', file: rel, message: 'Missing scene_heading/slug' });
    }
    if (!scene.content.trim()) {
      findings.push({ severity: 'warning', file: rel, message: 'Scene content empty' });
    }
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const scenes = collectScreenplayScenes(args.work);
  const findings = lintScenes(scenes);
  const scope = args.work || 'all';
  const jsonPath = writeJsonReport(`screenplay_lint_${scope}.json`, { scope, findings });
  const mdLines = renderFindings(`Screenplay Lint (${scope})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`screenplay_lint_${scope}.md`, mdLines);
  if (!args.jsonOnly) {
    console.log(`Screenplay lint written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
  }
  const hasErrors = findings.some(f => f.severity === 'error');
  if (hasErrors) process.exit(1);
}

main();
