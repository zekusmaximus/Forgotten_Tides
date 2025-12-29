#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { collectScenes } = require('./lib/scene_indexer');
const { ensureDir, loadFrontmatter } = require('./lib/file_loader');
const { modeTag } = require('./lib/mode');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null, mode: null };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
    if (arg === '--mode') out.mode = args[idx + 1];
  });
  return out;
}

function findWorkNotes(workId) {
  const candidates = [
    path.join(process.cwd(), 'stories', 'novel', workId, 'notes.md'),
    path.join(process.cwd(), 'stories', 'novella', workId, 'notes.md'),
    path.join(process.cwd(), 'stories', 'short', workId, 'notes.md'),
    path.join(process.cwd(), 'stories', 'screenplay', workId, 'notes.md')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const parsed = loadFrontmatter(candidate);
      return parsed;
    }
  }
  return null;
}

function buildTable(scenes) {
  const rows = ['| Scene | POV | Stakes | Knowledge Δ | Moral Δ | Words |', '| --- | --- | --- | --- | --- | --- |'];
  scenes.forEach(scene => {
    const stakes = scene.data.stakes?.summary || scene.data.stakes?.risk || '';
    const knowledge = (scene.data.knowledge_delta || []).map(d => `${d.change}:${d.entity}`).join('; ');
    const moral = (scene.data.moral_actions || []).map(a => `${a.actor || 'actor'}:${a.direction || ''}${a.weight !== undefined ? `(${a.weight})` : ''}`).join('; ');
    rows.push(`| ${scene.data.title || scene.id} | ${scene.data.pov || ''} | ${stakes} | ${knowledge} | ${moral} | ${scene.wordCount} |`);
  });
  return rows;
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run compile:edit -- --work "<name>"');
    process.exit(1);
  }
  const scenes = collectScenes({ work: args.work });
  const compiledDir = path.join(process.cwd(), 'out', 'compiled');
  ensureDir(compiledDir);
  const target = path.join(compiledDir, `${args.work}_edit_packet.md`);
  const lines = [`# Edit Packet — ${args.work}`, '', `Mode: ${args.mode || modeTag()}`, ''];
  lines.push(...buildTable(scenes));
  const notes = findWorkNotes(args.work);
  if (notes) {
    lines.push('', '## Notes', '', notes.content.trim());
  }
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  console.log(`Edit packet written to ${target}`);
}

main();
