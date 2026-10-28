#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { analyzeReferences } = require('../lint/unresolved_refs');
const { validateReferences } = require('../lint/canonical_reference_validator');

const script = path.join(__dirname, '..', 'lint', 'unresolved_refs.js');

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function run(root, args = []) {
  const result = spawnSync(process.execPath, [script, '--root', root, ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

function fixture(check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-reference-coverage-'));
  try {
    write(root, 'characters/Existing.md', '---\nid: char-0001\n---\n');
    write(root, 'atlas/Existing.md', '---\nid: loc-0001\n---\n');
    write(root, 'stories/novel/NOVEL/scenes/Scene.md',
      '---\nid: scene_novel\nreferences:\n  characters: [char-9999]\n---\n');
    write(root, 'stories/screenplay/SCREENPLAY/scenes/Scene.md',
      '---\nid: scene_screenplay\ncross_refs:\n  locations: [loc-9999]\n---\n');
    write(root, 'data/lexicon/terms.yaml',
      'terms:\n  - id: term-0001\n    related_terms: [term-9999]\n');
    check(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

fixture(root => {
  const report = analyzeReferences(root);
  assert.equal(report.failures.length, 3);
  assert(report.failures.some(message => message.includes('stories/novel/NOVEL/scenes/Scene.md: unresolved reference to char-9999')));
  assert(report.failures.some(message => message.includes('stories/screenplay/SCREENPLAY/scenes/Scene.md: unresolved reference to loc-9999')));
  assert(report.failures.some(message => message.includes('data/lexicon/terms.yaml#terms[0]: unresolved reference to term-9999')));
  assert.equal(report.filesChecked, 4);
  assert.equal(report.termsChecked, 1);
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /3 failures/);
  const advisory = run(root, ['--warn-only']);
  assert.equal(advisory.status, 0);
  assert.match(advisory.stderr, /3 failures/);
});

fixture(root => {
  write(root, 'characters/Other.md', '---\nid: char-9999\n---\n');
  write(root, 'atlas/Other.md', '---\nid: loc-9999\n---\n');
  write(root, 'data/lexicon/terms.yaml',
    'terms:\n  - id: term-0001\n    related_terms: [term-9999]\n  - id: term-9999\n    related_terms: [term-0001]\n');
  const report = analyzeReferences(root);
  assert.deepEqual(report.failures, []);
  assert.equal(report.termsChecked, 2);
  assert.equal(run(root).status, 0);
});

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-event-reference-'));
  try {
    write(root, 'data/timeline/events.yaml',
      'events:\n  - id: event-story-0001-001\n    canon_tier: primary_canon\n    source: stories/short_story/CANON/manuscript.md\n' +
      '  - id: event-story-0002-001\n    canon_tier: draft\n    source: stories/short_story/DRAFT/manuscript.md\n');
    const draft = 'stories/short_story/DRAFT/manuscript.md';
    const canon = 'stories/short_story/CANON/manuscript.md';
    write(root, draft,
      '---\nid: story-0002\ntype: story\nstory_type: short-story\ncanon_tier: draft\nreferences:\n  events: [event-story-0002-001]\n---\n');
    write(root, canon,
      '---\nid: story-0001\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\nreferences:\n  events: [event-story-0001-001, event-story-0002-001]\n---\n');
    const blocked = analyzeReferences(root);
    assert.equal(blocked.failures.length, 1);
    assert.match(blocked.failures[0], /primary-canon story depends on non-primary event event-story-0002-001/);
    write(root, canon,
      '---\nid: story-0001\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\nreferences:\n  events: [event-story-0001-001]\n---\n');
    assert.deepEqual(analyzeReferences(root).failures, []);
    write(root, canon,
      '---\nid: story-0001\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\nreferences:\n  events: [event-story-9999-001]\n---\n');
    assert.match(analyzeReferences(root).failures[0], /unresolved reference to event-story-9999-001/);
    write(root, 'CANONICAL_INDEX.md',
      '# Canonical Index\n- `event-story-0001-001` — First beat (`data/timeline/events.yaml`)\n' +
      '- `event-story-0002-001` — Draft beat (`data/timeline/events.yaml`)\n');
    assert(validateReferences(root).missing.some(item => item.id === 'event-story-9999-001'));
    write(root, canon,
      '---\nid: story-0001\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\nreferences:\n  events: [event-story-0001-001]\n---\n');
    assert.deepEqual(validateReferences(root).missing, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-canon-dependencies-'));
  try {
    const canon = 'stories/short_story/CANON/manuscript.md';
    const otherCanon = 'stories/short_story/OTHER_CANON/manuscript.md';
    const draft = 'stories/short_story/DRAFT/manuscript.md';
    const header = '---\nid: story-0001\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\n';
    write(root, otherCanon,
      '---\nid: story-0003\ntype: story\nstory_type: short-story\ncanon_tier: primary_canon\n---\n');
    write(root, draft,
      '---\nid: story-0002\ntype: story\nstory_type: short-story\ncanon_tier: draft\n' +
      'references:\n  stories: [story-0003]\n  events: [event-story-0002-001]\n---\n');
    write(root, 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md', '# Approved story bible\n');
    write(root, 'bible/README.md', '# Bible directory\n');
    write(root, 'data/timeline/events.yaml',
      'events:\n' +
      `  - id: event-story-0002-001\n    canon_tier: primary_canon\n    source: ${draft}\n` +
      '  - id: event-0001\n    canon_tier: primary_canon\n    source: bible/ARCHIVISTS_WAKE_STORY_BIBLE.md\n' +
      '  - id: event-0002\n    canon_tier: primary_canon\n' +
      '  - id: event-0003\n    canon_tier: primary_canon\n    source: bible/MISSING.md\n' +
      '  - id: event-0004\n    canon_tier: primary_canon\n    source: bible/../stories/short_story/DRAFT/manuscript.md\n' +
      '  - id: event-0005\n    canon_tier: primary_canon\n    source: bible/ARCHIVISTS_WAKE_STORY_BIBLE.md\n' +
      '  - id: event-0006\n    canon_tier: primary_canon\n    source: bible/README.md\n' +
      `  - id: event-story-0003-001\n    canon_tier: primary_canon\n    source: ${otherCanon}\n`);

    write(root, canon, header +
      'references:\n  stories: [story-0002]\n  events: [event-story-0002-001]\n---\n');
    const blocked = analyzeReferences(root).failures;
    assert.equal(blocked.length, 2);
    assert(blocked.some(message => /non-primary story story-0002 \(draft\)/.test(message)));
    assert(blocked.some(message => /event event-story-0002-001 with source story story-0002 is draft/.test(message)));

    write(root, canon, header.replace('story_type: short-story\n', '') +
      'references:\n  stories: [story-0002]\n---\n');
    assert(analyzeReferences(root).failures.some(message =>
      /non-primary story story-0002 \(draft\)/.test(message)),
    'omitting optional story_type must not bypass the primary manuscript gate');

    write(root, canon, header +
      'cross_refs:\n  stories: [story-0002]\n' +
      'references:\n  stories: [story-0003]\n  events: [event-0001, event-story-0003-001]\n---\n');
    assert.deepEqual(analyzeReferences(root).failures, [],
      'a mention of a draft is allowed, as are primary story and bible sources');

    for (const [eventId, expected] of [
      ['event-0002', /missing source/],
      ['event-0003', /source bible\/MISSING.md is not a primary story or approved story bible/],
      ['event-0004', /invalid source bible\/\.\.\/stories/]
    ]) {
      write(root, canon, header + `references:\n  events: [${eventId}]\n---\n`);
      assert(analyzeReferences(root).failures.some(message => expected.test(message)), eventId);
    }
    write(root, canon, header + 'references:\n  events: [event-0006]\n---\n');
    assert(analyzeReferences(root).failures.some(message =>
      /source bible\/README.md is not a primary story or approved story bible/.test(message)));
    if (process.platform !== 'win32') {
      fs.rmSync(path.join(root, 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md'));
      fs.symlinkSync(path.join(root, draft), path.join(root, 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md'));
      write(root, canon, header + 'references:\n  events: [event-0005]\n---\n');
      assert(analyzeReferences(root).failures.some(message =>
        /source bible\/ARCHIVISTS_WAKE_STORY_BIBLE.md is not a primary story or approved story bible/.test(message)));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log('Reference coverage includes novel, screenplay, and lexicon terms.');
