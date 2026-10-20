#!/usr/bin/env node
/**
 * Smoke and behavior tests for scripts/promote_story.js.
 *
 * Runs the promotion against a fixture repository built in a temporary
 * directory, so no real manuscript is touched. Also checks that the tool's
 * default root resolves to this repository (the regression that once made the
 * tool unable to find any manuscript).
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const promote = require('../promote_story');

const FIXED_NOW = '2030-01-01T00:00:00.000Z';
const STORY_ID = 'story-9901';
const MANUSCRIPT_REL = 'stories/short_story/fixture_promotion_story/manuscript.md';

const MANUSCRIPT = `---
id: ${STORY_ID}
schema_version: v1.0.0
contract_version: v1.0.0
type: story
title: Fixture Promotion Story
story_type: short-story
status: draft
canon_tier: draft
retrieval_role: active_draft
summary_50: Fixture story used by the promotion tool test.
summary_200: A longer fixture summary that must survive promotion byte for byte.
themes:
  - memory-as-cost
cross_refs:
  characters:
    - char-9901
  locations:
    - loc-9901
  factions: []
  mechanics: []
  stories: []
references:
  characters:
    - char-9901
  locations:
    - loc-9901
  factions: []
  mechanics: []
  stories: []
events:
  - id: event-${STORY_ID}-001
    timestamp: T0+1h
    summary: First fixture event.
    canon_tier: draft
    source: ${MANUSCRIPT_REL}
    involved_entities:
      - ${STORY_ID}
  - id: event-${STORY_ID}-002
    timestamp: T0+2h
    summary: Second fixture event.
    canon_tier: draft
    source: ${MANUSCRIPT_REL}
    involved_entities:
      - ${STORY_ID}
metadata:
  status: draft
  created: '2026-01-01T00:00:00.000Z'
  modified: '2026-01-01T00:00:00.000Z'
---

# Fixture Promotion Story

Body text that must survive promotion unchanged.

A second paragraph, with *emphasis* and a trailing line.
`;

const TIMELINE = `schema_version: v1.0.0
tags: []
events:
  - id: event-0001
    timestamp: "Cycle 0"
    summary: "Unrelated primary event."
    canon_tier: primary_canon
    source: stories/short_story/other/manuscript.md
  - id: event-${STORY_ID}-001
    timestamp: "T0+1h"
    summary: "First fixture event."
    canon_tier: draft
    source: ${MANUSCRIPT_REL}
    involved_entities:
      - ${STORY_ID}
  - id: event-legacy-0042
    timestamp: "T0+2h"
    summary: "Legacy-named fixture event matched by source."
    canon_tier: draft
    source: ${MANUSCRIPT_REL}
  - id: event-0099
    timestamp: "T9"
    summary: "Unrelated draft event."
    canon_tier: draft
    source: stories/short_story/other/manuscript.md
`;

const CHARACTER = `---
id: char-9901
type: character
name: Fixture Character
metadata:
  status: speculative
---

# Fixture Character
`;

const LOCATION = `---
id: loc-9901
type: location
name: Fixture Location
metadata:
  status: canonical
---

# Fixture Location
`;

const LEXICON = `schema_version: v1.0.0
tags: []
terms:
  - id: term-9901
    term: Fixture Term
    definition: Introduced by the fixture story.
    first_appearance: Fixture Promotion Story
    status: draft
  - id: term-9902
    term: Unrelated Term
    definition: Belongs to another story.
    first_appearance: Some Other Story
    status: canonical
`;

const LORE_NOTE = `# Notes

The fixture story (${STORY_ID}) remains a draft until review.
Another line that mentions ${STORY_ID} without the d-word.
`;

function write(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promote-story-test-'));
  write(root, MANUSCRIPT_REL, MANUSCRIPT);
  write(root, 'data/timeline/events.yaml', TIMELINE);
  write(root, 'data/lexicon/terms.yaml', LEXICON);
  write(root, 'characters/Fixture_Character.md', CHARACTER);
  write(root, 'atlas/Fixture_Location.md', LOCATION);
  write(root, 'lore/notes.md', LORE_NOTE);
  return root;
}

function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

function withFixture(fn) {
  const root = makeFixtureRoot();
  try {
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('default root resolves to this repository', () => {
  assert(fs.existsSync(path.join(promote.DEFAULT_ROOT, 'package.json')), 'DEFAULT_ROOT contains package.json');
  assert(fs.existsSync(path.join(promote.DEFAULT_ROOT, 'stories', 'short_story')), 'DEFAULT_ROOT contains stories/short_story');
  const found = promote.findManuscriptById(promote.DEFAULT_ROOT, 'story-0001');
  assert(found && /the_archivists_wake[\\/]manuscript\.md$/.test(found), 'story-0001 resolves to the_archivists_wake/manuscript.md');
});

test('argument parsing accepts the documented flags and rejects unknown ones', () => {
  const parsed = promote.parseArgs(['--id', 'story-0007', '--tier', 'working_canon', '--dry-run', '--skip-build']);
  assert.deepStrictEqual(parsed, { id: 'story-0007', tier: 'working_canon', dryRun: true, skipBuild: true, help: false });
  assert.strictEqual(promote.parseArgs(['--id', 'story-0007']).tier, 'primary_canon');
  assert.throws(() => promote.parseArgs(['--bogus']), /Unknown argument/);
});

test('unknown story id and unknown tier are rejected', () => {
  withFixture(root => {
    assert.throws(() => promote.promoteStory({ root, id: 'story-9999', skipBuild: true }), /Could not find manuscript/);
    assert.throws(() => promote.promoteStory({ root, id: STORY_ID, tier: 'legendary', skipBuild: true }), /Unknown canon tier/);
  });
});

test('dry run reports every planned change and writes nothing', () => {
  withFixture(root => {
    const before = {
      manuscript: read(root, MANUSCRIPT_REL),
      timeline: read(root, 'data/timeline/events.yaml')
    };
    const result = promote.promoteStory({ root, id: STORY_ID, dryRun: true, now: FIXED_NOW });

    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.built, false);
    assert.strictEqual(read(root, MANUSCRIPT_REL), before.manuscript, 'manuscript untouched by dry run');
    assert.strictEqual(read(root, 'data/timeline/events.yaml'), before.timeline, 'timeline untouched by dry run');

    const fields = result.manuscriptChanges.map(c => c.field).sort();
    assert.deepStrictEqual(fields, [
      'canon_tier',
      'events[0].canon_tier',
      'events[1].canon_tier',
      'metadata.modified',
      'metadata.status',
      'retrieval_role',
      'status'
    ].sort());
    assert.deepStrictEqual(result.timeline.changes.map(c => c.id), [`event-${STORY_ID}-001`, 'event-legacy-0042']);
  });
});

test('promotion rewrites every tier-bearing manuscript field and nothing else', () => {
  withFixture(root => {
    const original = matter(read(root, MANUSCRIPT_REL));
    const result = promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });

    assert.strictEqual(result.built, false, 'skipBuild prevents linkmap rebuild');
    assert.strictEqual(result.manuscript, MANUSCRIPT_REL);

    const after = matter(read(root, MANUSCRIPT_REL));
    const data = after.data;
    assert.strictEqual(data.canon_tier, 'primary_canon');
    assert.strictEqual(data.status, 'canonical');
    assert.strictEqual(data.metadata.status, 'canonical');
    assert.strictEqual(data.retrieval_role, 'authoritative');
    assert.strictEqual(data.metadata.modified, FIXED_NOW);
    assert.deepStrictEqual(data.events.map(e => e.canon_tier), ['primary_canon', 'primary_canon']);

    assert.strictEqual(after.content, original.content, 'manuscript body is byte-identical');

    const untouched = ['id', 'schema_version', 'contract_version', 'type', 'title', 'story_type', 'summary_50', 'summary_200', 'themes', 'cross_refs', 'references'];
    for (const key of untouched) {
      assert.deepStrictEqual(data[key], original.data[key], `${key} unchanged`);
    }
    assert.strictEqual(data.metadata.created, original.data.metadata.created, 'metadata.created unchanged');
    original.data.events.forEach((event, index) => {
      for (const key of ['id', 'timestamp', 'summary', 'source', 'involved_entities']) {
        assert.deepStrictEqual(data.events[index][key], event[key], `events[${index}].${key} unchanged`);
      }
    });
    assert.deepStrictEqual(Object.keys(data).sort(), Object.keys(original.data).sort(), 'no frontmatter keys added or removed');
  });
});

test('timeline entries for the story move tier; unrelated entries and formatting stay put', () => {
  withFixture(root => {
    const beforeLines = read(root, 'data/timeline/events.yaml').split('\n');
    promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });
    const afterRaw = read(root, 'data/timeline/events.yaml');
    const afterLines = afterRaw.split('\n');

    assert.strictEqual(afterLines.length, beforeLines.length, 'line count unchanged');
    const changed = beforeLines.map((line, i) => (line === afterLines[i] ? null : i)).filter(i => i !== null);
    assert.strictEqual(changed.length, 2, 'exactly two lines changed');
    for (const i of changed) {
      assert.match(beforeLines[i], /^\s+canon_tier: draft$/);
      assert.match(afterLines[i], /^\s+canon_tier: primary_canon$/);
    }

    const parsed = yaml.load(afterRaw);
    const tierOf = id => parsed.events.find(e => e.id === id).canon_tier;
    assert.strictEqual(tierOf(`event-${STORY_ID}-001`), 'primary_canon');
    assert.strictEqual(tierOf('event-legacy-0042'), 'primary_canon', 'event matched by source path is promoted');
    assert.strictEqual(tierOf('event-0001'), 'primary_canon', 'unrelated primary event untouched');
    assert.strictEqual(tierOf('event-0099'), 'draft', 'unrelated draft event untouched');
  });
});

test('timeline events without a canon_tier line get one inserted', () => {
  withFixture(root => {
    const stripped = read(root, 'data/timeline/events.yaml').replace(
      `  - id: event-${STORY_ID}-001\n    timestamp: "T0+1h"\n    summary: "First fixture event."\n    canon_tier: draft\n`,
      `  - id: event-${STORY_ID}-001\n    timestamp: "T0+1h"\n    summary: "First fixture event."\n`
    );
    assert(!/event-story-9901-001\n[^-]*canon_tier/.test(stripped), 'fixture setup removed the canon_tier line');
    write(root, 'data/timeline/events.yaml', stripped);

    const result = promote.updateTimelineEvents(root, STORY_ID, MANUSCRIPT_REL, 'primary_canon');
    const inserted = result.changes.find(c => c.id === `event-${STORY_ID}-001`);
    assert(inserted && inserted.from === '(none)', 'reports insertion');
    const parsed = yaml.load(read(root, 'data/timeline/events.yaml'));
    assert.strictEqual(parsed.events.find(e => e.id === `event-${STORY_ID}-001`).canon_tier, 'primary_canon');
    assert.strictEqual(parsed.events.find(e => e.id === `event-${STORY_ID}-001`).summary, 'First fixture event.');
  });
});

test('manual checklist names non-canonical entities, introduced terms, and draft wording', () => {
  withFixture(root => {
    const result = promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });
    const { entities, terms, draftMentions } = result.checklist;

    assert.deepStrictEqual(entities.map(e => e.id), ['char-9901'], 'only the speculative character is listed');
    assert.strictEqual(entities[0].status, 'speculative');
    assert.strictEqual(entities[0].path, 'characters/Fixture_Character.md');

    assert.deepStrictEqual(terms.map(t => t.id), ['term-9901'], 'only the term introduced by this story is listed');
    assert.strictEqual(terms[0].status, 'draft');

    assert.strictEqual(draftMentions.length, 1, 'one line pairs the story id with the word draft');
    assert.strictEqual(draftMentions[0].path, 'lore/notes.md');
    assert.strictEqual(draftMentions[0].line, 3);
  });
});

test('missing entity files are reported rather than ignored', () => {
  withFixture(root => {
    fs.unlinkSync(path.join(root, 'characters/Fixture_Character.md'));
    const result = promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });
    const missing = result.checklist.entities.find(e => e.id === 'char-9901');
    assert(missing, 'missing entity appears in checklist');
    assert.strictEqual(missing.path, '(missing)');
  });
});

test('a second run is a no-op', () => {
  withFixture(root => {
    promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });
    const snapshot = { manuscript: read(root, MANUSCRIPT_REL), timeline: read(root, 'data/timeline/events.yaml') };
    const again = promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: '2031-01-01T00:00:00.000Z' });
    assert.deepStrictEqual(again.manuscriptChanges, [], 'no manuscript changes on rerun');
    assert.deepStrictEqual(again.timeline.changes, [], 'no timeline changes on rerun');
    assert.strictEqual(read(root, MANUSCRIPT_REL), snapshot.manuscript, 'manuscript stable (modified stamp not bumped)');
    assert.strictEqual(read(root, 'data/timeline/events.yaml'), snapshot.timeline, 'timeline stable');
  });
});

test('promoting to working_canon sets canonical status but leaves retrieval_role alone', () => {
  withFixture(root => {
    const result = promote.promoteStory({ root, id: STORY_ID, tier: 'working_canon', skipBuild: true, now: FIXED_NOW });
    const data = matter(read(root, MANUSCRIPT_REL)).data;
    assert.strictEqual(data.canon_tier, 'working_canon');
    assert.strictEqual(data.status, 'canonical');
    assert.strictEqual(data.metadata.status, 'canonical');
    assert.strictEqual(data.retrieval_role, 'active_draft', 'no retrieval_role mapping for working_canon');
    assert.deepStrictEqual(data.events.map(e => e.canon_tier), ['working_canon', 'working_canon']);
    assert.deepStrictEqual(result.checklist, { entities: [], terms: [], draftMentions: [] }, 'entity checklist only applies to primary_canon');
  });
});

test('a manuscript without a metadata block gains one instead of crashing', () => {
  withFixture(root => {
    const original = read(root, MANUSCRIPT_REL);
    const withoutMetadata = original.replace(/metadata:\n  status: draft\n  created: '[^']+'\n  modified: '[^']+'\n/, '');
    assert.notStrictEqual(withoutMetadata, original, 'fixture setup removed metadata');
    write(root, MANUSCRIPT_REL, withoutMetadata);

    const result = promote.promoteStory({ root, id: STORY_ID, skipBuild: true, now: FIXED_NOW });
    const data = matter(read(root, MANUSCRIPT_REL)).data;
    assert.deepStrictEqual(data.metadata, { status: 'canonical' });
    assert(!result.manuscriptChanges.some(c => c.field === 'metadata.modified'), 'no modified stamp invented');
  });
});

if (process.exitCode) {
  console.error('\nPromotion tool tests: FAILED');
} else {
  console.log('\nPromotion tool tests: all passed');
}
