#!/usr/bin/env node

/**
 * promote_story.js
 *
 * Promote a short story to primary_canon (or another explicit canon tier).
 *
 * Usage:
 *   node scripts/promote_story.js --id story-0007
 *   node scripts/promote_story.js --id story-0007 --tier primary_canon
 *   node scripts/promote_story.js --id story-0007 --dry-run
 *   node scripts/promote_story.js --id story-0007 --skip-build
 *
 * What it changes:
 *   - Manuscript frontmatter: canon_tier, status, metadata.status,
 *     retrieval_role (when the tier has a known role), every
 *     events[].canon_tier, and metadata.modified when that field exists
 *   - data/timeline/events.yaml: canon_tier on every event that belongs to
 *     the story (id prefixed `event-<story-id>-`, or source pointing at the
 *     manuscript). Edited line by line so formatting is preserved.
 *   - Regenerated link map artifacts via `npm run linkmap:build`
 *     (skipped with --skip-build or --dry-run)
 *
 * What it does not change, and prints as a manual checklist instead:
 *   - metadata.status on entity files the story references
 *   - status on lexicon terms the story introduced
 *   - prose in entity, lore, and docs files that still calls the story a draft
 *   - manuscript events[] ids with no entry in data/timeline/events.yaml
 *     (the tool edits existing timeline entries only; shared events are
 *     added by hand)
 *
 * The module exports its functions so scripts/tests/test_promote_story.js can
 * exercise them against a fixture repository.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const { execFileSync } = require('child_process');

const DEFAULT_ROOT = path.join(__dirname, '..');
const CANON_TIERS = ['primary_canon', 'working_canon', 'draft', 'speculative', 'sandbox', 'test', 'deprecated'];
const ENTITY_DIRS = ['characters', 'atlas', 'factions'];
const DRAFT_MENTION_DIRS = ['characters', 'atlas', 'factions', 'lore', 'docs'];
// Generated artifacts and review output legitimately pair story ids with "draft".
const DRAFT_MENTION_EXCLUDE = [/^docs\/link_map\//, /^docs\/reviews\//, /^docs\/reports\//, /^docs\/session\//];
const DRAFT_MENTION_LIMIT = 25;

const STATUS_FOR_TIER = {
  primary_canon: 'canonical',
  working_canon: 'canonical',
  speculative: 'speculative',
  deprecated: 'deprecated',
  draft: 'draft',
  sandbox: 'draft',
  test: 'draft'
};

const RETRIEVAL_ROLE_FOR_TIER = {
  primary_canon: 'authoritative',
  draft: 'active_draft'
};

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function usage() {
  return 'Usage: node scripts/promote_story.js --id story-#### [--tier primary_canon] [--dry-run] [--skip-build]';
}

function parseArgs(argv) {
  const out = { tier: 'primary_canon', dryRun: false, skipBuild: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--id' && argv[i + 1]) {
      out.id = argv[++i];
    } else if (arg === '--tier' && argv[i + 1]) {
      out.tier = argv[++i];
    } else if (arg === '--dry-run') {
      out.dryRun = true;
    } else if (arg === '--skip-build') {
      out.skipBuild = true;
    } else if (arg === '--help' || arg === '-h') {
      out.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}\n${usage()}`);
    }
  }
  return out;
}

function listMarkdownFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'out') continue;
        walk(full);
      } else if (entry.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

// gray-matter caches parses keyed by content and hands back a shallow copy whose
// `data` object is shared. Passing an options object bypasses the cache, so the
// in-place edits below never leak into another parse of identical content.
const MATTER_OPTIONS = {};

function readFrontmatter(filePath) {
  try {
    return matter(fs.readFileSync(filePath, 'utf8'), MATTER_OPTIONS).data || {};
  } catch (_) {
    return null;
  }
}

/**
 * Locate the manuscript whose frontmatter id matches. Only short stories are
 * handled; novellas and novels keep their own metadata layout.
 */
function findManuscriptById(root, id) {
  const storiesDir = path.join(root, 'stories', 'short_story');
  if (!fs.existsSync(storiesDir)) {
    throw new Error(`Short story directory not found: ${storiesDir}`);
  }
  for (const file of listMarkdownFiles(storiesDir)) {
    if (path.basename(file).toLowerCase() !== 'manuscript.md') continue;
    const data = readFrontmatter(file);
    if (data && data.id === id) return file;
  }
  return null;
}

/**
 * Mutate parsed frontmatter in place so every tier-bearing field agrees with
 * the target tier. Returns the list of changes made.
 */
function applyManuscriptChanges(data, tier, options = {}) {
  if (!CANON_TIERS.includes(tier)) {
    throw new Error(`Unknown canon tier "${tier}". Allowed: ${CANON_TIERS.join(', ')}`);
  }
  const changes = [];
  const set = (field, current, assign, value) => {
    if (current === value) return;
    assign(value);
    changes.push({ field, from: current === undefined ? '(none)' : current, to: value });
  };

  set('canon_tier', data.canon_tier, v => { data.canon_tier = v; }, tier);

  const status = STATUS_FOR_TIER[tier];
  if (status) {
    set('status', data.status, v => { data.status = v; }, status);
    if (!data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      data.metadata = {};
    }
    set('metadata.status', data.metadata.status, v => { data.metadata.status = v; }, status);
  }

  const role = RETRIEVAL_ROLE_FOR_TIER[tier];
  if (role) {
    set('retrieval_role', data.retrieval_role, v => { data.retrieval_role = v; }, role);
  }

  if (Array.isArray(data.events)) {
    data.events.forEach((event, index) => {
      if (!event || typeof event !== 'object') return;
      set(`events[${index}].canon_tier`, event.canon_tier, v => { event.canon_tier = v; }, tier);
    });
  }

  if (changes.length > 0 && data.metadata && Object.prototype.hasOwnProperty.call(data.metadata, 'modified')) {
    const stamp = options.now || new Date().toISOString();
    set('metadata.modified', data.metadata.modified, v => { data.metadata.modified = v; }, stamp);
  }

  return changes;
}

function updateManuscript(filePath, tier, options = {}) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw, MATTER_OPTIONS);
  const data = parsed.data || {};
  const changes = applyManuscriptChanges(data, tier, options);
  if (!options.dryRun && changes.length > 0) {
    fs.writeFileSync(filePath, matter.stringify(parsed.content, data, { lineWidth: -1 }), 'utf8');
  }
  return { data, changes };
}

function stripYamlScalar(value) {
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Rewrite canon_tier on the story's events in data/timeline/events.yaml with a
 * line-level edit, so comments, quoting, and ordering are untouched. An event
 * belongs to the story when its id starts with `event-<story-id>-` or its
 * source is the manuscript path.
 */
function updateTimelineEvents(root, storyId, manuscriptRelPath, tier, options = {}) {
  const timelinePath = path.join(root, 'data', 'timeline', 'events.yaml');
  if (!fs.existsSync(timelinePath)) {
    return { path: null, changes: [] };
  }
  const raw = fs.readFileSync(timelinePath, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);

  const blocks = [];
  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)-\s+id:\s*(.+)$/);
    if (!match) return;
    if (blocks.length) blocks[blocks.length - 1].end = index;
    blocks.push({ start: index, end: lines.length, id: stripYamlScalar(match[2]), indent: match[1].length });
  });

  const prefix = `event-${storyId}-`;
  const changes = [];
  // Reverse order keeps earlier indices valid when a canon_tier line is inserted.
  for (const block of blocks.slice().reverse()) {
    const blockLines = lines.slice(block.start, block.end);
    const sourceLine = blockLines.find(line => /^\s+source:\s*\S/.test(line));
    const source = sourceLine ? stripYamlScalar(sourceLine.replace(/^\s+source:\s*/, '')) : null;
    const belongs = block.id.startsWith(prefix) || (source !== null && source === manuscriptRelPath);
    if (!belongs) continue;

    const fieldIndent = ' '.repeat(block.indent + 2);
    const tierOffset = blockLines.findIndex(line => /^\s+canon_tier:\s*/.test(line));
    if (tierOffset >= 0) {
      const current = stripYamlScalar(blockLines[tierOffset].replace(/^\s+canon_tier:\s*/, ''));
      if (current === tier) continue;
      lines[block.start + tierOffset] = `${fieldIndent}canon_tier: ${tier}`;
      changes.push({ id: block.id, from: current, to: tier });
    } else {
      lines.splice(block.start + 1, 0, `${fieldIndent}canon_tier: ${tier}`);
      changes.push({ id: block.id, from: '(none)', to: tier });
    }
  }
  changes.reverse();

  if (changes.length > 0) {
    const updated = lines.join(eol);
    const parsed = yaml.load(updated);
    const events = (parsed && Array.isArray(parsed.events)) ? parsed.events : [];
    for (const change of changes) {
      const event = events.find(e => e && e.id === change.id);
      if (!event || event.canon_tier !== tier) {
        throw new Error(`Timeline rewrite failed verification for ${change.id}; data/timeline/events.yaml was not written.`);
      }
    }
    if (!options.dryRun) {
      fs.writeFileSync(timelinePath, updated, 'utf8');
    }
  }

  return { path: toPosix(path.relative(root, timelinePath)), changes };
}

function loadEntityIndex(root) {
  const index = new Map();
  for (const dir of ENTITY_DIRS) {
    for (const file of listMarkdownFiles(path.join(root, dir))) {
      if (path.basename(file).toLowerCase() === 'readme.md') continue;
      const data = readFrontmatter(file);
      if (!data || !data.id) continue;
      const status = (data.metadata && data.metadata.status) || data.status || '(none)';
      index.set(data.id, { id: data.id, name: data.name || path.basename(file, '.md'), path: toPosix(path.relative(root, file)), status });
    }
  }
  return index;
}

function collectReferencedEntityIds(data) {
  const ids = new Set();
  for (const group of [data.cross_refs, data.references]) {
    if (!group || typeof group !== 'object') continue;
    for (const key of ['characters', 'locations', 'factions']) {
      for (const id of group[key] || []) {
        if (typeof id === 'string') ids.add(id);
      }
    }
  }
  return [...ids].sort();
}

function loadLexiconTerms(root) {
  const lexiconPath = path.join(root, 'data', 'lexicon', 'terms.yaml');
  if (!fs.existsSync(lexiconPath)) return [];
  try {
    const parsed = yaml.load(fs.readFileSync(lexiconPath, 'utf8'));
    return (parsed && Array.isArray(parsed.terms)) ? parsed.terms : [];
  } catch (_) {
    return [];
  }
}

/**
 * Ids of the manuscript's events[] entries that have no entry with the same id
 * in data/timeline/events.yaml. The tool never adds timeline entries, so these
 * are the author's to add by hand when other stories depend on them. A missing
 * or unparsable timeline file leaves every manuscript event unmatched.
 */
function findTimelineGaps(root, data) {
  if (!Array.isArray(data.events)) return [];
  const manuscriptIds = data.events
    .filter(event => event && typeof event === 'object' && typeof event.id === 'string')
    .map(event => event.id);
  if (manuscriptIds.length === 0) return [];

  const timelineIds = new Set();
  const timelinePath = path.join(root, 'data', 'timeline', 'events.yaml');
  if (fs.existsSync(timelinePath)) {
    try {
      const parsed = yaml.load(fs.readFileSync(timelinePath, 'utf8'));
      for (const event of (parsed && Array.isArray(parsed.events)) ? parsed.events : []) {
        if (event && typeof event.id === 'string') timelineIds.add(event.id);
      }
    } catch (_) {
      // Unparsable timeline: report every manuscript event as a gap.
    }
  }
  return manuscriptIds.filter(id => !timelineIds.has(id));
}

function findDraftMentions(root, storyId) {
  const hits = [];
  const idPattern = new RegExp(storyId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  for (const dir of DRAFT_MENTION_DIRS) {
    for (const file of listMarkdownFiles(path.join(root, dir))) {
      const rel = toPosix(path.relative(root, file));
      if (DRAFT_MENTION_EXCLUDE.some(pattern => pattern.test(rel))) continue;
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch (_) {
        continue;
      }
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (idPattern.test(line) && /\bdraft\b/i.test(line)) {
          hits.push({ path: rel, line: index + 1, text: line.trim() });
        }
      });
      if (hits.length >= DRAFT_MENTION_LIMIT) return hits.slice(0, DRAFT_MENTION_LIMIT);
    }
  }
  return hits;
}

/**
 * Everything a promotion needs that the tool should not decide on its own.
 */
function collectManualChecklist(root, data, manuscriptRelPath, tier) {
  const expectedStatus = STATUS_FOR_TIER[tier];
  const checklist = { entities: [], terms: [], draftMentions: [], timelineGaps: findTimelineGaps(root, data) };
  if (tier !== 'primary_canon') return checklist;

  const index = loadEntityIndex(root);
  for (const id of collectReferencedEntityIds(data)) {
    const entity = index.get(id);
    if (!entity) {
      checklist.entities.push({ id, name: '(no entity file found)', path: '(missing)', status: '(none)', expected: expectedStatus });
    } else if (entity.status !== expectedStatus) {
      checklist.entities.push({ ...entity, expected: expectedStatus });
    }
  }

  const title = typeof data.title === 'string' ? data.title.trim().toLowerCase() : null;
  for (const term of loadLexiconTerms(root)) {
    if (!term || typeof term !== 'object') continue;
    const firstAppearance = typeof term.first_appearance === 'string' ? term.first_appearance.trim().toLowerCase() : null;
    const introducedHere = (title && firstAppearance === title) || term.canonical_source === manuscriptRelPath;
    if (introducedHere && term.status !== expectedStatus) {
      checklist.terms.push({ id: term.id, term: term.term, status: term.status || '(none)', expected: expectedStatus });
    }
  }

  checklist.draftMentions = findDraftMentions(root, data.id);
  return checklist;
}

function runBuild(root, log) {
  log(`> npm run linkmap:build`);
  execFileSync('npm', ['run', 'linkmap:build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
}

/**
 * Promote one story. Returns a result object describing every change made or
 * planned, plus the manual checklist.
 */
function promoteStory(options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const { id } = options;
  const tier = options.tier || 'primary_canon';
  const dryRun = Boolean(options.dryRun);
  const skipBuild = Boolean(options.skipBuild);
  const log = options.log || (() => {});

  if (!id) throw new Error(usage());
  if (!CANON_TIERS.includes(tier)) {
    throw new Error(`Unknown canon tier "${tier}". Allowed: ${CANON_TIERS.join(', ')}`);
  }

  const manuscript = findManuscriptById(root, id);
  if (!manuscript) {
    throw new Error(`Could not find manuscript for ${id} under stories/short_story`);
  }
  const manuscriptRelPath = toPosix(path.relative(root, manuscript));

  const { data, changes: manuscriptChanges } = updateManuscript(manuscript, tier, { dryRun, now: options.now });
  const timeline = updateTimelineEvents(root, id, manuscriptRelPath, tier, { dryRun });
  const checklist = collectManualChecklist(root, data, manuscriptRelPath, tier);

  let built = false;
  const changedSomething = manuscriptChanges.length > 0 || timeline.changes.length > 0;
  if (!dryRun && !skipBuild && changedSomething) {
    runBuild(root, log);
    built = true;
  }

  return {
    id,
    tier,
    dryRun,
    manuscript: manuscriptRelPath,
    manuscriptChanges,
    timeline,
    checklist,
    built
  };
}

function printResult(result) {
  const verb = result.dryRun ? 'Would update' : 'Updated';
  console.log(`\n${result.dryRun ? 'Dry run: ' : ''}${result.id} at ${result.manuscript}`);

  if (result.manuscriptChanges.length === 0) {
    console.log(`Manuscript frontmatter already at ${result.tier}; nothing to change.`);
  } else {
    console.log(`${verb} manuscript frontmatter:`);
    for (const change of result.manuscriptChanges) {
      console.log(`  - ${change.field}: ${change.from} -> ${change.to}`);
    }
  }

  if (!result.timeline.path) {
    console.log('No data/timeline/events.yaml found; skipped timeline events.');
  } else if (result.timeline.changes.length === 0) {
    console.log(`No ${result.timeline.path} entries needed changing.`);
  } else {
    console.log(`${verb} ${result.timeline.path}:`);
    for (const change of result.timeline.changes) {
      console.log(`  - ${change.id}: canon_tier ${change.from} -> ${change.to}`);
    }
  }

  const { entities, terms, draftMentions, timelineGaps } = result.checklist;
  console.log('\nManual checklist (the tool does not decide these):');
  if (entities.length === 0 && terms.length === 0 && draftMentions.length === 0 && timelineGaps.length === 0) {
    console.log('  - Referenced entities and introduced lexicon terms already match the target status; no draft wording found next to the story id; every manuscript event has a timeline entry.');
  }
  if (entities.length > 0) {
    console.log(`  - Referenced entity files whose metadata.status is not "${entities[0].expected}" (set it, or decide deliberately to leave it):`);
    for (const entity of entities) {
      console.log(`      ${entity.id}  ${entity.name}  ${entity.path}  (currently ${entity.status})`);
    }
  }
  if (terms.length > 0) {
    console.log(`  - Lexicon terms introduced by this story whose status is not "${terms[0].expected}" (data/lexicon/terms.yaml):`);
    for (const term of terms) {
      console.log(`      ${term.id}  ${term.term}  (currently ${term.status})`);
    }
  }
  if (draftMentions.length > 0) {
    console.log('  - Lines that name this story next to the word "draft"; read each and reword if it describes the story\'s tier:');
    for (const hit of draftMentions) {
      console.log(`      ${hit.path}:${hit.line}  ${hit.text}`);
    }
  }
  if (timelineGaps.length > 0) {
    console.log('  - Manuscript events with no data/timeline/events.yaml entry (add by hand if shared):');
    for (const id of timelineGaps) {
      console.log(`      ${id}`);
    }
  }

  console.log('\nNext steps:');
  let step = 1;
  if (result.dryRun) {
    console.log(`  ${step++}. Re-run without --dry-run to apply the changes above.`);
  } else {
    if (!result.built) {
      console.log(`  ${step++}. Run: npm run linkmap:build`);
    }
    console.log(`  ${step++}. Review the diff on the manuscript, data/timeline/events.yaml, and the generated files (CANONICAL_INDEX.md, REFERENCE_MAP.json, docs/link_map/LINK_MAP.md)`);
    console.log(`  ${step++}. Work through the manual checklist above`);
    console.log(`  ${step++}. Commit, then run: npm run validate:ci  (it diffs generated artifacts against the last commit, so run it after committing)`);
    console.log(`  ${step++}. Commit message: canon(story): promote ${result.id} to ${result.tier}`);
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (args.help || !args.id) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }
  try {
    const result = promoteStory({
      root: DEFAULT_ROOT,
      id: args.id,
      tier: args.tier,
      dryRun: args.dryRun,
      skipBuild: args.skipBuild,
      log: message => console.log(message)
    });
    printResult(result);
  } catch (error) {
    console.error(`Promotion failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_ROOT,
  CANON_TIERS,
  STATUS_FOR_TIER,
  RETRIEVAL_ROLE_FOR_TIER,
  parseArgs,
  findManuscriptById,
  applyManuscriptChanges,
  updateManuscript,
  updateTimelineEvents,
  collectManualChecklist,
  findTimelineGaps,
  promoteStory,
  printResult
};

if (require.main === module) {
  main();
}
