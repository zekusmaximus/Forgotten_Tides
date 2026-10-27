#!/usr/bin/env node

/**
 * ids_next.js — Get the next available canonical ID for a given entity type.
 *
 * Usage:
 *   node scripts/ids_next.js --type story
 *   node scripts/ids_next.js --type char
 *   node scripts/ids_next.js --type loc
 *   node scripts/ids_next.js --type fact
 *   node scripts/ids_next.js --type mech
 *   node scripts/ids_next.js --type term
 *
 * Reads both CANONICAL_INDEX.md and source files. A partially stale generated
 * index must not cause an ID already present in source to be issued again.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');

const TYPE_CONFIG = {
  story:  { prefix: 'story',  dirs: ['stories'] },
  char:   { prefix: 'char',   dirs: ['characters'] },
  loc:    { prefix: 'loc',    dirs: ['atlas'] },
  fact:   { prefix: 'fact',   dirs: ['factions'] },
  mech:   { prefix: 'mech',   dirs: ['mechanics'] },
  term:   { prefix: 'term',   dirs: ['data/lexicon'] },
  lore:   { prefix: 'lore',   dirs: ['lore'] },
};

function getTypeArg() {
  const idx = process.argv.indexOf('--type');
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error('Usage: node scripts/ids_next.js --type <type>');
    console.error('Available types: ' + Object.keys(TYPE_CONFIG).join(', '));
    process.exit(1);
  }
  return process.argv[idx + 1].toLowerCase();
}

function parseIndexFile(root, prefix) {
  const indexPath = path.join(root, 'CANONICAL_INDEX.md');
  if (!fs.existsSync(indexPath)) return [];

  const content = fs.readFileSync(indexPath, 'utf8');
  const pattern = new RegExp('`(' + prefix + '-\\d{4,})`', 'g');
  const matches = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

function scanDirectories(root, dirs, prefix) {
  const pattern = new RegExp('^' + prefix + '-\\d{4,}$');
  const ids = [];

  for (const dir of dirs) {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) continue;

    const scan = (dirPath) => {
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile() && /\.(md|ya?ml)$/i.test(entry.name) && !/_backup_/i.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const isMarkdown = entry.name.toLowerCase().endsWith('.md');
          const frontmatter = isMarkdown && content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
          if (isMarkdown && !frontmatter) {
            if (/^---\r?\n/.test(content)) {
              throw new Error(`Could not parse ${path.relative(root, fullPath)}: missing frontmatter closing delimiter`);
            }
            continue;
          }

          let data;
          try {
            data = yaml.load(frontmatter ? frontmatter[1] : content) || {};
          } catch (error) {
            throw new Error(`Could not parse ${path.relative(root, fullPath)}: ${error.message}`);
          }

          const candidates = [data.id];
          if (Array.isArray(data.terms)) {
            candidates.push(...data.terms.map(term => term && term.id));
          }
          for (const id of candidates) {
            if (typeof id === 'string' && pattern.test(id)) ids.push(id);
          }
        }
      }
    };

    scan(fullDir);
  }

  return ids;
}

function extractNumber(id) {
  const m = id.match(/(\d{4,})$/);
  return m ? parseInt(m[1], 10) : 0;
}

function nextId(root, type) {
  if (!TYPE_CONFIG[type]) {
    throw new Error(`Unknown type: "${type}". Available types: ${Object.keys(TYPE_CONFIG).join(', ')}`);
  }

  const { prefix, dirs } = TYPE_CONFIG[type];
  const ids = [...parseIndexFile(root, prefix), ...scanDirectories(root, dirs, prefix)];

  const maxNum = ids.reduce((max, id) => Math.max(max, extractNumber(id)), 0);
  const next = maxNum + 1;
  const candidate = `${prefix}-${String(next).padStart(4, '0')}`;

  return candidate;
}

function main() {
  try {
    console.log(nextId(ROOT, getTypeArg()));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { nextId };
