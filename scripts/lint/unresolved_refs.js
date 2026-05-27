#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '../..');
const warnOnly = process.argv.includes('--warn-only');

const INDEXED_ROOTS = [
  'characters',
  'factions',
  'atlas',
  'mechanics',
  'stories/short_story',
  'lore'
];

const CHECKED_ROOTS = [
  'characters',
  'factions',
  'atlas',
  'mechanics',
  'stories/short_story',
  'lore'
];

const REFERENCE_FIELDS = [
  'cross_refs',
  'references',
  'appears_in',
  'rules_used',
  'relationships',
  'related_terms'
];

const PREFIX_TO_BUCKET = {
  char: 'characters',
  loc: 'locations',
  fact: 'factions',
  mech: 'mechanics',
  story: 'stories',
  term: 'terms'
};

function emptyIndex() {
  return {
    characters: new Set(),
    locations: new Set(),
    factions: new Set(),
    mechanics: new Set(),
    stories: new Set(),
    terms: new Set()
  };
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

function shouldInspectFile(filePath) {
  const file = path.basename(filePath);
  return (
    (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) &&
    !file.endsWith('README.md') &&
    !/_backup_/.test(file)
  );
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
    } else if (shouldInspectFile(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

function parseStructuredFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.load(content) || {};
  }

  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return null;
  return yaml.load(match[1]) || {};
}

function bucketForId(id) {
  if (typeof id !== 'string') return null;
  const match = id.trim().toLowerCase().match(/^([a-z]+)-\d{4}$/);
  if (!match) return null;
  return PREFIX_TO_BUCKET[match[1]] || null;
}

function addId(index, id) {
  const bucket = bucketForId(id);
  if (bucket && index[bucket]) {
    index[bucket].add(id.trim().toLowerCase());
  }
}

function collectIdsFromValue(value, ids) {
  if (value == null) return;

  if (typeof value === 'string') {
    if (bucketForId(value)) ids.push(value.trim().toLowerCase());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectIdsFromValue(item, ids));
    return;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach(item => collectIdsFromValue(item, ids));
  }
}

function collectReferencedIds(frontmatter) {
  const ids = [];
  for (const field of REFERENCE_FIELDS) {
    if (frontmatter && Object.prototype.hasOwnProperty.call(frontmatter, field)) {
      collectIdsFromValue(frontmatter[field], ids);
    }
  }
  return ids;
}

function indexLexiconTerms(index) {
  const lexiconPath = path.join(ROOT_DIR, 'data/lexicon/terms.yaml');
  if (!fs.existsSync(lexiconPath)) return;

  try {
    const data = yaml.load(fs.readFileSync(lexiconPath, 'utf8')) || {};
    for (const term of data.terms || []) {
      if (term && term.id) addId(index, term.id);
    }
  } catch (error) {
    throw new Error(`${relativePath(lexiconPath)}: ${error.message}`);
  }
}

function buildIdIndex() {
  const index = emptyIndex();

  for (const root of INDEXED_ROOTS) {
    const files = walkFiles(path.join(ROOT_DIR, root));
    for (const filePath of files) {
      try {
        const data = parseStructuredFile(filePath);
        if (data && data.id) addId(index, data.id);
      } catch (error) {
        throw new Error(`${relativePath(filePath)}: ${error.message}`);
      }
    }
  }

  indexLexiconTerms(index);
  return index;
}

function checkReferencesInFile(filePath, index) {
  const failures = [];
  const data = parseStructuredFile(filePath);
  if (!data) return failures;

  for (const id of collectReferencedIds(data)) {
    const bucket = bucketForId(id);
    if (bucket && (!index[bucket] || !index[bucket].has(id))) {
      failures.push(`${relativePath(filePath)}: unresolved reference to ${id}`);
    }
  }

  return failures;
}

function main() {
  console.log('Checking for unresolved references...');

  let index;
  try {
    index = buildIdIndex();
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exit(warnOnly ? 0 : 1);
  }

  const failures = [];
  let filesChecked = 0;

  for (const root of CHECKED_ROOTS) {
    const files = walkFiles(path.join(ROOT_DIR, root));
    for (const filePath of files) {
      try {
        const fileFailures = checkReferencesInFile(filePath, index);
        filesChecked += 1;
        failures.push(...fileFailures);
      } catch (error) {
        failures.push(`${relativePath(filePath)}: could not parse references: ${error.message}`);
      }
    }
  }

  if (failures.length > 0) {
    failures.forEach(message => {
      const prefix = warnOnly ? 'WARN' : 'FAIL';
      console.error(`${prefix} ${message}`);
    });
    console.error(`Reference coverage: ${filesChecked} files checked, ${failures.length} failures.`);
    process.exit(warnOnly ? 0 : 1);
  }

  console.log(`Reference coverage: ${filesChecked} files checked, 0 failures.`);
  console.log('All references resolved');
}

main();
