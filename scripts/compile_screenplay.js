#!/usr/bin/env node
const fs = require('fs');
const { loadFrontmatter, ensureDir } = require('./lib/file_loader');
const { resolveExistingWork, resolveWithin } = require('./lib/path_safety');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
  });
  return out;
}

function collectScreenplayScenes(workPath) {
  const base = resolveWithin(workPath, 'scenes');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base)
    .filter(file => file.endsWith('.md') && !/_backup_/i.test(file))
    .map(file => resolveWithin(base, file))
    .sort()
    .map(file => loadFrontmatter(file));
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run compile:screenplay -- --work "<name>"');
    process.exit(1);
  }
  const root = process.cwd();
  const work = resolveExistingWork(root, args.work, 'screenplay');
  const scenes = collectScreenplayScenes(work.path);
  if (scenes.length === 0) {
    console.error(`No screenplay scenes found for work "${args.work}".`);
    process.exit(1);
  }
  const lines = [];
  scenes.forEach(scene => {
    const heading = (scene.data.scene_heading || scene.data.slug || scene.data.title || scene.data.id || '').toUpperCase();
    lines.push(heading);
    lines.push('');
    lines.push(scene.content.trim());
    lines.push('');
  });
  const outDir = resolveWithin(root, 'out', 'compiled');
  const target = resolveWithin(root, 'out', 'compiled', `${args.work}.fountain`);
  ensureDir(outDir);
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  console.log(`Screenplay compiled to ${target}`);
}

main();
