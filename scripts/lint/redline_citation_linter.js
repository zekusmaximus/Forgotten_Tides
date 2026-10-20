#!/usr/bin/env node

/**
 * redline_citation_linter.js
 *
 * Tiny guardrail: stories that reference locked canon from the Archivist's Wake bible
 * must explicitly cite the bible (or the specific red lines) in frontmatter.
 *
 * Locked elements (from bible/ARCHIVISTS_WAKE_STORY_BIBLE.md):
 *   - Rell (char-0001), Sutira (char-0002), Estavan (char-0003), Tari (char-0004)
 *   - Heliodrome (loc-0001), Lattice Gap (loc-0003)
 *   - (Implicit) zero-anchoring, anchor burn permanence, eddy tracking, etc.
 *
 * A locked reference is detected two ways:
 *   1. cross_refs/references in the frontmatter carry a locked ID, or
 *   2. the manuscript body names a locked element in prose
 *      (LOCKED_PROSE_PATTERNS: Lattice Gap, Heliodrome, zero-anchoring, and the
 *      four crew names as whole words).
 *
 * Requirement:
 *   If either check fires, the frontmatter must contain either:
 *     - a `bible_refs` array with at least one entry containing "ARCHIVISTS_WAKE" or "bible"
 *     - or a `continuity_notes` array with at least one entry that mentions the bible / locked IDs / red lines
 *
 * Severity:
 *   - A frontmatter ID hit without a citation is an error, as before.
 *   - A prose-only hit without a citation is an error when the manuscript's
 *     canon_tier is primary_canon or working_canon, and a warning otherwise,
 *     so existing drafts do not turn the lint red.
 *   Any error exits 1; warnings alone exit 0.
 *
 * The originating story (story-0001) is exempt.
 *
 * Usage:
 *   node scripts/lint/redline_citation_linter.js [--root <dir>]
 *   --root defaults to the repository root; tests point it at a fixture tree.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const BIBLE_PATH = 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md';

const LOCKED_IDS = [
  'char-0001', // Rell
  'char-0002', // Sutira
  'char-0003', // Estavan
  'char-0004', // Tari
  'loc-0001',  // Heliodrome
  'loc-0003'   // Lattice Gap
];

const LOCKED_IDS_SET = new Set(LOCKED_IDS.map(id => id.toLowerCase()));

// Prose patterns for the same locked elements. Crew names are whole words so
// "Tari" does not match "Tariff" and "Rell" does not match "Rellis".
const LOCKED_PROSE_PATTERNS = [
  /\bLattice Gap\b/,
  /\bHeliodrome\b/,
  /\bzero[- ]anchor/i,
  /\bRell\b/,
  /\bSutira\b/,
  /\bEstavan\b/,
  /\bTari\b/
];

const ORIGINATING_STORY_ID = 'story-0001';
const ERROR_TIERS = new Set(['primary_canon', 'working_canon']);

function parseArgs(argv) {
  const out = { root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root' && argv[i + 1]) {
      out.root = path.resolve(argv[++i]);
    } else if (arg.startsWith('--root=')) {
      out.root = path.resolve(arg.slice('--root='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}\nUsage: node scripts/lint/redline_citation_linter.js [--root <dir>]`);
    }
  }
  return out;
}

function hasLockedReference(data) {
  const refs = [];
  if (data.cross_refs) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.cross_refs[k])) refs.push(...data.cross_refs[k]);
    });
  }
  if (data.references) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.references[k])) refs.push(...data.references[k]);
    });
  }
  return refs.some(r => LOCKED_IDS_SET.has(String(r).toLowerCase()));
}

/**
 * Find the line of the raw file where the body begins (the line after the
 * closing frontmatter delimiter), so prose hits report file line numbers.
 */
function bodyStartLine(raw) {
  const lines = raw.split(/\r?\n/);
  if (!lines.length || lines[0].trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return i + 1;
  }
  return 0;
}

/**
 * Scan the manuscript body for locked prose patterns. Returns one entry per
 * pattern that matched, with the first matching file line number.
 */
function findLockedProse(raw, content) {
  const offset = bodyStartLine(raw);
  const lines = content.split(/\r?\n/);
  const hits = [];
  for (const pattern of LOCKED_PROSE_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        hits.push({ pattern: pattern.toString(), line: offset + i + 1 });
        break;
      }
    }
  }
  return hits;
}

function citesBible(data) {
  // Check dedicated field if present
  if (Array.isArray(data.bible_refs)) {
    for (const entry of data.bible_refs) {
      if (typeof entry === 'string' && /ARCHIVISTS_WAKE|bible/i.test(entry)) return true;
    }
  }
  // Check continuity_notes
  if (Array.isArray(data.continuity_notes)) {
    for (const note of data.continuity_notes) {
      if (typeof note === 'string' && (/ARCHIVISTS_WAKE|bible\/|red.?line|locked.*canon/i.test(note) || LOCKED_IDS.some(id => note.includes(id)))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Lint every short-story manuscript under root. Returns findings; prints
 * nothing. `checked` counts manuscripts that reference locked elements.
 */
function lintRoot(root) {
  const shortStoryManuscripts = glob.sync('stories/short_story/**/manuscript.md', { cwd: root, absolute: true });
  const findings = [];
  let checked = 0;

  for (const filePath of shortStoryManuscripts) {
    const rel = path.relative(root, filePath).split(path.sep).join('/');
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const fm = matter(raw);
      const data = fm.data || {};
      const id = data.id || path.basename(path.dirname(filePath));

      if (id === ORIGINATING_STORY_ID) {
        continue; // source of the bible itself
      }

      const idHit = hasLockedReference(data);
      const proseHits = findLockedProse(raw, fm.content || '');
      if (!idHit && proseHits.length === 0) continue;

      checked++;
      if (citesBible(data)) continue;

      const tier = typeof data.canon_tier === 'string' ? data.canon_tier : '(none)';
      const level = (idHit || ERROR_TIERS.has(tier)) ? 'error' : 'warn';
      const via = [];
      if (idHit) via.push('frontmatter ids');
      if (proseHits.length) via.push(`prose: ${proseHits.map(h => `${h.pattern} at line ${h.line}`).join(', ')}`);
      findings.push({
        level,
        file: rel,
        id,
        canon_tier: tier,
        matched: via.join('; '),
        message: `References locked bible elements (Rell/Sutira/Estavan/Tari/Heliodrome/Lattice Gap/zero-anchoring) but has no explicit bible/red-line citation in continuity_notes or bible_refs (${BIBLE_PATH})`
      });
    } catch (e) {
      findings.push({
        level: 'warn',
        file: rel,
        message: `Could not parse: ${e.message}`
      });
    }
  }

  return { findings, checked };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log('🔒 Running red-line citation linter (locked bible elements)...');

  const { findings, checked } = lintRoot(args.root);
  for (const finding of findings) {
    console.log(JSON.stringify(finding));
  }

  const errors = findings.filter(f => f.level === 'error').length;
  const warnings = findings.filter(f => f.level === 'warn').length;

  if (errors > 0) {
    console.log(`\n❌ Red-line citation linter found ${errors} violation(s)${warnings ? ` and ${warnings} warning(s)` : ''}. Stories touching locked canon must cite the bible.`);
    process.exit(1);
  }
  if (warnings > 0) {
    console.log(`\n⚠️  Red-line citation linter found ${warnings} warning(s) on draft manuscripts (not blocking). Add bible_refs before promotion.`);
  } else if (checked > 0) {
    console.log(`✅ All ${checked} stories referencing locked bible elements have explicit citations.`);
  } else {
    console.log('✅ No stories (besides the origin) currently reference locked bible elements, or all are properly cited.');
  }
  process.exit(0);
}

module.exports = {
  DEFAULT_ROOT,
  LOCKED_IDS,
  LOCKED_PROSE_PATTERNS,
  parseArgs,
  hasLockedReference,
  findLockedProse,
  citesBible,
  lintRoot
};

if (require.main === module) {
  main();
}
