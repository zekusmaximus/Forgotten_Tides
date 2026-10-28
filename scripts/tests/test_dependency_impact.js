#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { impactReport, loadReferenceMap } = require('../reports/dependency_impact');

const script = path.join(__dirname, '..', 'reports', 'dependency_impact.js');

function node(id, type = 'story') {
  return { canonical_id: id, name: id, type, path: `${type}/${id}.md`, canon_tier: 'draft' };
}

function fixtureMap() {
  return {
    generated: 'fixture',
    nodes: [
      node('story-0007'),
      node('event-story-0007-001', 'event'),
      node('story-0018'),
      node('story-0019'),
      node('story-0020'),
      node('story-0021'),
      node('story-0022'),
      node('fact-0001', 'faction'),
      node('story-0023')
    ],
    edges: [
      { from: 'event-story-0007-001', to: 'story-0007', type: 'source_story', fields: ['source'] },
      { from: 'story-0018', to: 'event-story-0007-001', type: 'events', fields: ['references'] },
      { from: 'story-0019', to: 'story-0018', type: 'stories', fields: ['references'] },
      { from: 'story-0020', to: 'story-0007', type: 'stories', fields: ['cross_refs'] },
      { from: 'story-0021', to: 'story-0007', type: 'stories', fields: ['cross_refs', 'references'] },
      { from: 'story-0022', to: 'event-story-0007-001', type: 'events', fields: ['cross_refs'] },
      { from: 'fact-0001', to: 'story-0007', type: 'stories', fields: ['references'] },
      { from: 'story-0023', to: 'fact-0001', type: 'factions', fields: ['references'] },
      { from: 'story-0007', to: 'story-0019', type: 'stories', fields: ['references'] }
    ]
  };
}

function withRoot(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-dependency-impact-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run(root, args = []) {
  const result = spawnSync(process.execPath, [script, '--root', root, ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

withRoot(root => {
  fs.writeFileSync(path.join(root, 'REFERENCE_MAP.json'), JSON.stringify(fixtureMap()));
  const report = impactReport(loadReferenceMap(root), 'STORY-0007');
  assert.deepEqual(report.direct.map(entry => entry.id), ['event-story-0007-001', 'fact-0001', 'story-0021']);
  assert.deepEqual(report.transitive.map(entry => entry.id), ['story-0018', 'story-0019']);
  assert(!report.transitive.some(entry => entry.id === 'story-0023'),
    'a generic faction link must not turn an unrelated story into a downstream dependent');
  assert.deepEqual(report.transitive.find(entry => entry.id === 'story-0018').trace.map(edge => edge.fields[0]),
    ['references', 'source']);
  assert.equal(report.summary.mention_candidates, 0);
  assert(!report.direct.some(entry => entry.id === 'story-0007'), 'a cycle must not report the target as its own dependent');

  const withMentions = impactReport(loadReferenceMap(root), 'story-0007', { includeMentions: true });
  assert.deepEqual(withMentions.mention_candidates.map(entry => entry.id), ['story-0020', 'story-0022']);
  assert.deepEqual(withMentions.mention_candidates.map(entry => entry.depth), [1, 2]);
  assert.equal(withMentions.direct.find(entry => entry.id === 'story-0021').trace[0].fields.includes('references'), true);

  const result = run(root, ['--id', 'story-0007', '--include-mentions', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.equal(json.summary.direct, 3);
  assert.equal(json.summary.transitive, 2);
  assert.equal(json.summary.mention_candidates, 2);
  const text = run(root, ['--id', 'story-0007']);
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /Direct dependents \(3\)/);
  assert.match(text.stdout, /story-0018 --references.events--> event-story-0007-001/);
  assert.doesNotMatch(text.stdout, /Mention candidates/);
});

withRoot(root => {
  const missing = run(root, ['--id', 'story-0007']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /REFERENCE_MAP.json is missing/);
  const stale = fixtureMap();
  delete stale.edges[0].fields;
  fs.writeFileSync(path.join(root, 'REFERENCE_MAP.json'), JSON.stringify(stale));
  assert.throws(() => loadReferenceMap(root), /edges need provenance fields/);
  const staleResult = run(root, ['--id', 'story-0007']);
  assert.equal(staleResult.status, 1);
  assert.match(staleResult.stderr, /run npm run linkmap:build/);
  fs.writeFileSync(path.join(root, 'REFERENCE_MAP.json'), JSON.stringify(fixtureMap()));
  const unknown = run(root, ['--id', 'story-9999']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown ID story-9999/);
});

console.log('Dependency impact CLI tests passed.');
