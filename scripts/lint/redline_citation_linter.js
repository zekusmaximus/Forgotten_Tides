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
 * Requirement:
 *   If a short-story manuscript's cross_refs/references contain any locked ID,
 *   then frontmatter must contain either:
 *     - a `bible_refs` array with at least one entry containing "ARCHIVISTS_WAKE" or "bible"
 *     - or a `continuity_notes` array with at least one entry that mentions the bible / locked IDs / red lines
 *
 * The originating story (story-0001) is exempt.
 *
 * This linter is intentionally small and grep-oriented. It exits 0 on warnings only.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');

const ROOT = path.join(__dirname, '..', '..');
const BIBLE_PATH = 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md';

const LOCKED_IDS = [
  'char-0001', // Rell
  'char-0002', // Sutira
  'char-0003', // Estavan
  'char-0004', // Tari
  'loc-0001',  // Heliodrome
  'loc-0003'   // Lattice Gap
];

const ORIGINATING_STORY_ID = 'story-0001';

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
  return refs.some(r => LOCKED_IDS.includes(String(r).toLowerCase()));
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

function main() {
  console.log('🔒 Running red-line citation linter (locked bible elements)...');

  const shortStoryManuscripts = glob.sync('stories/short_story/**/manuscript.md', { cwd: ROOT, absolute: true });

  let issues = 0;
  let checked = 0;

  for (const filePath of shortStoryManuscripts) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const fm = matter(raw);
      const data = fm.data || {};
      const id = data.id || path.basename(path.dirname(filePath));

      if (id === ORIGINATING_STORY_ID) {
        continue; // source of the bible itself
      }

      if (hasLockedReference(data)) {
        checked++;
        if (!citesBible(data)) {
          issues++;
          console.log(JSON.stringify({
            level: 'error',
            file: path.relative(ROOT, filePath),
            id,
            message: 'References locked bible elements (Rell/Sutira/Estavan/Tari/Heliodrome/Lattice Gap) but has no explicit bible/red-line citation in continuity_notes or bible_refs'
          }));
        }
      }
    } catch (e) {
      console.log(JSON.stringify({
        level: 'warn',
        file: path.relative(ROOT, filePath),
        message: `Could not parse: ${e.message}`
      }));
    }
  }

  if (issues > 0) {
    console.log(`\n❌ Red-line citation linter found ${issues} violation(s). Stories touching locked canon must cite the bible.`);
    process.exit(1);
  } else {
    if (checked > 0) {
      console.log(`✅ All ${checked} stories referencing locked bible elements have explicit citations.`);
    } else {
      console.log('✅ No stories (besides the origin) currently reference locked bible elements, or all are properly cited.');
    }
    process.exit(0);
  }
}

main();
