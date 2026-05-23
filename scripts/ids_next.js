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
 * Reads CANONICAL_INDEX.md to find the highest existing ID for the given prefix,
 * then outputs the next one. Falls back to scanning entity directories if the
 * index is stale.
 */

const fs = require('fs');
const path = require('path');

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

function parseIndexFile(prefix) {
  const indexPath = path.join(ROOT, 'CANONICAL_INDEX.md');
  if (!fs.existsSync(indexPath)) return [];

  const content = fs.readFileSync(indexPath, 'utf8');
  const pattern = new RegExp('`(' + prefix + '-\\d{4})`', 'g');
  const matches = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

function scanDirectories(dirs, prefix) {
  const pattern = new RegExp('^' + prefix + '-\\d{4}$');
  const ids = [];

  for (const dir of dirs) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    const scan = (dirPath) => {
      for (const entry of fs.readdirSync(dirPath)) {
        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (entry.endsWith('.md') || entry.endsWith('.yaml') || entry.endsWith('.yml')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fm = content.match(/^---\s*([\s\S]*?)\s*---/);
            if (fm) {
              const idMatch = fm[1].match(/^id:\s*(.+)$/m);
              if (idMatch) {
                const id = idMatch[1].trim().replace(/['"]/g, '');
                if (pattern.test(id)) ids.push(id);
              }
            }
          } catch (_) {}
        }
      }
    };

    scan(fullDir);
  }

  return ids;
}

function extractNumber(id) {
  const m = id.match(/(\d{4})$/);
  return m ? parseInt(m[1], 10) : 0;
}

function main() {
  const type = getTypeArg();

  if (!TYPE_CONFIG[type]) {
    console.error(`Unknown type: "${type}". Available types: ${Object.keys(TYPE_CONFIG).join(', ')}`);
    process.exit(1);
  }

  const { prefix, dirs } = TYPE_CONFIG[type];

  // Try canonical index first, fall back to directory scan
  let ids = parseIndexFile(prefix);
  if (ids.length === 0) {
    ids = scanDirectories(dirs, prefix);
  }

  const maxNum = ids.reduce((max, id) => Math.max(max, extractNumber(id)), 0);
  const next = maxNum + 1;
  const nextId = `${prefix}-${String(next).padStart(4, '0')}`;

  console.log(nextId);
}

main();
