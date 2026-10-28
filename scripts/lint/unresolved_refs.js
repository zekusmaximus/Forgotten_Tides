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
  event: 'events',
  term: 'terms'
};
const APPROVED_BIBLE_SOURCES = new Set(['bible/ARCHIVISTS_WAKE_STORY_BIBLE.md']);

function emptyIndex() {
  return {
    characters: new Set(),
    locations: new Set(),
    factions: new Set(),
    mechanics: new Set(),
    stories: new Set(),
    events: new Set(),
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
  if (/^event-(?:[a-z0-9]+-)*\d{3,}$/i.test(id.trim())) return 'events';
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

function indexTimelineEvents(index, rootDir = ROOT_DIR) {
  const timelinePath = path.join(rootDir, 'data/timeline/events.yaml');
  const events = new Map();
  if (!fs.existsSync(timelinePath)) return events;
  try {
    const data = yaml.load(fs.readFileSync(timelinePath, 'utf8')) || {};
    if (!Array.isArray(data.events)) throw new Error('events must be an array');
    for (const event of data.events) {
      if (!event || bucketForId(event.id) !== 'events') {
        throw new Error(`invalid event ID: ${String(event?.id)}`);
      }
      const id = event.id.trim().toLowerCase();
      if (events.has(id)) throw new Error(`duplicate event ID: ${id}`);
      events.set(id, { tier: event.canon_tier || 'draft', source: event.source });
      index.events.add(id);
    }
    for (const event of data.events) {
      for (const relationship of event.relationships || []) {
        if (!relationship || !['before', 'after'].includes(relationship.type) ||
            bucketForId(relationship.target) !== 'events' ||
            !events.has(relationship.target.trim().toLowerCase())) {
          throw new Error(`invalid relationship on ${event.id}`);
        }
      }
    }
  } catch (error) {
    throw new Error(`${relativePath(timelinePath, rootDir)}: ${error.message}`);
  }
  return events;
}

function buildIdIndex(rootDir = ROOT_DIR) {
  const index = emptyIndex();
  const storyTiers = new Map();
  const storiesByPath = new Map();

  for (const root of SOURCE_ROOTS) {
    const files = walkFiles(path.join(rootDir, root));
    for (const filePath of files) {
      try {
        const data = parseStructuredFile(filePath);
        if (data && data.id) addId(index, data.id);
        if (data && bucketForId(data.id) === 'stories' && data.type === 'story' &&
            path.basename(filePath).toLowerCase() === 'manuscript.md') {
          const id = data.id.trim().toLowerCase();
          const tier = data.canon_tier || 'draft';
          const sourcePath = relativePath(filePath, rootDir);
          if (storyTiers.has(id)) throw new Error(`duplicate story ID: ${id}`);
          storyTiers.set(id, tier);
          storiesByPath.set(sourcePath, { id, tier });
        }
      } catch (error) {
        throw new Error(`${relativePath(filePath, rootDir)}: ${error.message}`);
      }
    }
  }

  const terms = indexLexiconTerms(index, rootDir);
  const events = indexTimelineEvents(index, rootDir);
  return { index, terms, events, storyTiers, storiesByPath };
}

function approvedEventSource(source, storiesByPath, rootDir) {
  if (typeof source !== 'string' || !source.trim()) return { approved: false, detail: 'missing source' };
  const normalized = source.replace(/\\/g, '/');
  if (normalized !== path.posix.normalize(normalized) || normalized.startsWith('/') ||
      normalized === '..' || normalized.startsWith('../')) {
    return { approved: false, detail: `invalid source ${source}` };
  }
  const story = storiesByPath.get(normalized);
  if (story) {
    return story.tier === 'primary_canon'
      ? { approved: true }
      : { approved: false, detail: `source story ${story.id} is ${story.tier}` };
  }
  if (APPROVED_BIBLE_SOURCES.has(normalized)) {
    let current = rootDir;
    const parts = normalized.split('/');
    try {
      for (const [index, part] of parts.entries()) {
        current = path.join(current, part);
        const stat = fs.lstatSync(current);
        if (stat.isSymbolicLink()) break;
        if (index === parts.length - 1 && stat.isFile()) return { approved: true };
        if (index < parts.length - 1 && !stat.isDirectory()) break;
      }
    } catch (_) {
      // A missing or unreadable source cannot establish a primary event.
    }
  }
  return { approved: false, detail: `source ${source} is not a primary story or approved story bible` };
}

function checkReferencesInFile(filePath, index, rootDir = ROOT_DIR, context = {}) {
  const failures = [];
  const data = parseStructuredFile(filePath);
  if (!data) return failures;

  for (const id of collectReferencedIds(data)) {
    const bucket = bucketForId(id);
    if (bucket && (!index[bucket] || !index[bucket].has(id))) {
      failures.push(`${relativePath(filePath, rootDir)}: unresolved reference to ${id}`);
    }
  }

  const sourcePath = relativePath(filePath, rootDir);
  if (sourcePath.startsWith('stories/short_story/') &&
      path.posix.basename(sourcePath).toLowerCase() === 'manuscript.md' &&
      data.canon_tier === 'primary_canon') {
    const { storyTiers = new Map(), storiesByPath = new Map(), events = new Map() } = context;
    const storyRefs = Array.isArray(data.references?.stories) ? data.references.stories : [];
    const eventRefs = Array.isArray(data.references?.events) ? data.references.events : [];
    for (const rawId of storyRefs) {
      const id = String(rawId).trim().toLowerCase();
      if (!index.stories.has(id)) continue; // The existence check above reports this.
      const tier = storyTiers.get(id);
      if (tier !== 'primary_canon') {
        failures.push(`${relativePath(filePath, rootDir)}: primary-canon story depends on non-primary story ${id} (${tier || 'unknown'})`);
      }
    }
    for (const rawId of eventRefs) {
      const id = String(rawId).trim().toLowerCase();
      const event = events.get(id);
      if (!event) continue; // The existence check above reports this.
      if (event.tier !== 'primary_canon') {
        failures.push(`${relativePath(filePath, rootDir)}: primary-canon story depends on non-primary event ${id} (${event.tier})`);
        continue;
      }
      const source = approvedEventSource(event.source, storiesByPath, rootDir);
      if (!source.approved) {
        failures.push(`${relativePath(filePath, rootDir)}: primary-canon story depends on event ${id} with ${source.detail}`);
      }
    }
  }

  return failures;
}

function analyzeReferences(rootDir = ROOT_DIR) {
  const { index, terms, events, storyTiers, storiesByPath } = buildIdIndex(rootDir);
  const failures = [];
  let filesChecked = 0;

  for (const root of SOURCE_ROOTS) {
    const files = walkFiles(path.join(rootDir, root));
    for (const filePath of files) {
      try {
        const fileFailures = checkReferencesInFile(filePath, index, rootDir,
          { events, storyTiers, storiesByPath });
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
