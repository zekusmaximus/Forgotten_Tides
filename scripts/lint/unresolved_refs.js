#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '../..');
const SOURCE_ROOTS = [
  'characters',
  'factions',
  'atlas',
  'mechanics',
  'stories/short_story',
  'stories/novella',
  'stories/novel',
  'stories/screenplay',
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

function relativePath(filePath, rootDir = ROOT_DIR) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
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
    } else if (entry.isFile() && shouldInspectFile(fullPath)) {
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

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match && /^---\r?\n/.test(content)) {
    throw new Error('missing frontmatter closing delimiter');
  }
  if (!match) return null;
  return yaml.load(match[1]) || {};
}

function bucketForId(id) {
  if (typeof id !== 'string') return null;
  const match = id.trim().toLowerCase().match(/^([a-z]+)-\d{4,}$/);
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

function indexLexiconTerms(index, rootDir = ROOT_DIR) {
  const lexiconPath = path.join(rootDir, 'data/lexicon/terms.yaml');
  if (!fs.existsSync(lexiconPath)) return [];

  try {
    const data = yaml.load(fs.readFileSync(lexiconPath, 'utf8')) || {};
    const terms = data.terms || [];
    if (!Array.isArray(terms)) throw new Error('terms must be an array');
    for (const term of terms) {
      if (term && term.id) addId(index, term.id);
    }
    return terms;
  } catch (error) {
    throw new Error(`${relativePath(lexiconPath, rootDir)}: ${error.message}`);
  }
}

function buildIdIndex(rootDir = ROOT_DIR) {
  const index = emptyIndex();

  for (const root of SOURCE_ROOTS) {
    const files = walkFiles(path.join(rootDir, root));
    for (const filePath of files) {
      try {
        const data = parseStructuredFile(filePath);
        if (data && data.id) addId(index, data.id);
      } catch (error) {
        throw new Error(`${relativePath(filePath, rootDir)}: ${error.message}`);
      }
    }
  }

  const terms = indexLexiconTerms(index, rootDir);
  return { index, terms };
}

function checkReferencesInFile(filePath, index, rootDir = ROOT_DIR) {
  const failures = [];
  const data = parseStructuredFile(filePath);
  if (!data) return failures;

  for (const id of collectReferencedIds(data)) {
    const bucket = bucketForId(id);
    if (bucket && (!index[bucket] || !index[bucket].has(id))) {
      failures.push(`${relativePath(filePath, rootDir)}: unresolved reference to ${id}`);
    }
  }

  return failures;
}

function analyzeReferences(rootDir = ROOT_DIR) {
  const { index, terms } = buildIdIndex(rootDir);
  const failures = [];
  let filesChecked = 0;

  for (const root of SOURCE_ROOTS) {
    const files = walkFiles(path.join(rootDir, root));
    for (const filePath of files) {
      try {
        const fileFailures = checkReferencesInFile(filePath, index, rootDir);
        filesChecked += 1;
        failures.push(...fileFailures);
      } catch (error) {
        failures.push(`${relativePath(filePath, rootDir)}: could not parse references: ${error.message}`);
      }
    }
  }

  // Lexicon terms are indexed as canonical sources, but each related_terms
  // entry is also a reference that must point at an existing term.
  terms.forEach((term, termIndex) => {
    for (const id of collectReferencedIds(term)) {
      const bucket = bucketForId(id);
      if (bucket && !index[bucket].has(id)) {
        failures.push(`data/lexicon/terms.yaml#terms[${termIndex}]: unresolved reference to ${id}`);
      }
    }
  });

  return { failures, filesChecked, termsChecked: terms.length };
}

function parseArgs(argv) {
  const options = { root: ROOT_DIR, warnOnly: false };
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--warn-only') {
      options.warnOnly = true;
    } else if (argv[index] === '--root' && argv[index + 1]) {
      options.root = path.resolve(argv[++index]);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
    }
  }
  return options;
}

function main() {
  console.log('Checking for unresolved references...');

  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const { warnOnly } = options;
  let report;
  try {
    report = analyzeReferences(options.root);
  } catch (error) {
    console.error(`${warnOnly ? 'WARN' : 'FAIL'} ${error.message}`);
    process.exitCode = warnOnly ? 0 : 1;
    return;
  }

  const { failures, filesChecked, termsChecked } = report;

  if (failures.length > 0) {
    failures.forEach(message => {
      const prefix = warnOnly ? 'WARN' : 'FAIL';
      console.error(`${prefix} ${message}`);
    });
    console.error(`Reference coverage: ${filesChecked} files checked, ${termsChecked} lexicon terms checked, ${failures.length} failures.`);
    process.exitCode = warnOnly ? 0 : 1;
    return;
  }

  console.log(`Reference coverage: ${filesChecked} files checked, ${termsChecked} lexicon terms checked, 0 failures.`);
  console.log('All references resolved');
}

if (require.main === module) main();

module.exports = { analyzeReferences, buildIdIndex, checkReferencesInFile, collectReferencedIds, parseArgs };
