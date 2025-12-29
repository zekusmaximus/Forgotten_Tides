#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadFrontmatter, ensureDir } = require('./lib/file_loader');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
  });
  return out;
}

function collectScreenplayScenes(workId) {
  const base = path.join(process.cwd(), 'stories', 'screenplay', workId, 'scenes');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(base, file))
    .sort()
    .map(file => loadFrontmatter(file));
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run compile:screenplay -- --work "<name>"');
    process.exit(1);
  }
  const scenes = collectScreenplayScenes(args.work);
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
  const outDir = path.join(process.cwd(), 'out', 'compiled');
  ensureDir(outDir);
  const target = path.join(outDir, `${args.work}.fountain`);
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  console.log(`Screenplay compiled to ${target}`);
}

main();
