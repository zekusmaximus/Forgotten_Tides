#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const references = require('../lint/canonical_reference_validator');
const { validateFile } = require('../lint/schema_validate');
const { loadConfig, readerLint } = require('../checks/reader_model_linter');
const { lintKnowledge } = require('../checks/knowledge_state_check');
const { analyzeStakes } = require('../checks/stakes_drift_check');

function withFixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-validation-gates-'));
  try {
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

withFixture(root => {
  write(root, 'CANONICAL_INDEX.md', '# Canonical Index\n\n- `char-0001` — Fixture (`characters/Fixture.md`)\n');
  write(root, 'characters/Fixture.md', '---\nid: char-0001\nreferences:\n  characters: [char-0001]\n---\n');
  const validReport = references.validateReferences(root);
  assert.strictEqual(validReport.canonical_ids_loaded, 1);
  assert.strictEqual(references.hasFailures(validReport), false);

  write(root, 'characters/Broken.md', '---\nid: char-0002\nreferences: [unterminated\n---\n');
  const invalidReport = references.validateReferences(root);
  assert.strictEqual(invalidReport.errors.length, 1);
  assert.strictEqual(invalidReport.errors[0].file, 'characters/Broken.md');
  assert.strictEqual(references.hasFailures(invalidReport), true);

  write(root, 'CANONICAL_INDEX.md', '# Canonical Index\n\n_none_\n');
  const emptyReport = references.validateReferences(root);
  assert.strictEqual(emptyReport.canonical_ids_loaded, 0);
  assert.strictEqual(references.hasFailures(emptyReport), true);
});

withFixture(root => {
  const malformed = write(root, 'optional.md', '---\ntitle: Optional\nreferences: [unterminated\n---\n');
  const parsed = validateFile(malformed, null, { required: false });
  assert.strictEqual(parsed.valid, false, 'malformed optional YAML must fail');
  assert.match(parsed.errors[0], /Could not parse YAML/);

  const noFrontmatter = write(root, 'plain.md', '# Intentionally unschematized\n');
  const skipped = validateFile(noFrontmatter, null, { required: false });
  assert.strictEqual(skipped.valid, true);
  assert.strictEqual(skipped.skipped, true);

  const noSchema = write(root, 'no-schema.md', '---\ntitle: Valid YAML without a schema\n---\n');
  const unschematized = validateFile(noSchema, null, { required: false });
  assert.strictEqual(unschematized.valid, true);
  assert.strictEqual(unschematized.skipped, true);
});

withFixture(root => {
  assert.strictEqual(loadConfig(root).max_new_entities_per_scene, 4);

  write(root, 'docs/reader_model.json', '{broken');
  assert.throws(() => loadConfig(root), /Could not parse/);

  write(root, 'docs/reader_model.json', '{}');
  assert.strictEqual(loadConfig(root).reinforcement_window, 2, 'missing values use explicit defaults');

  write(root, 'docs/reader_model.json', '{"reinforcement_window": -1}');
  assert.throws(() => loadConfig(root), /non-negative integer/);

  write(root, 'docs/reader_model.json', '{"reinforcement_window": 5}');
  assert.strictEqual(loadConfig(root).reinforcement_window, 5);
});

withFixture(root => {
  const config = { reinforcement_window: 0, max_new_entities_per_scene: 4 };
  const setup = {
    workKind: 'novel', workId: 'SHARED', path: path.join(root, 'novel-scene.md'),
    data: { knowledge_delta: [{ entity: 'char-0001', change: 'reveal' }] }
  };
  const unrelated = {
    workKind: 'novella', workId: 'SHARED', path: path.join(root, 'novella-scene.md'),
    data: { knowledge_delta: [] }
  };
  assert.deepStrictEqual(readerLint([setup, unrelated], config), [],
    'works with the same directory ID in different kinds must remain separate');
  const sameWork = { ...unrelated, workKind: 'novel' };
  assert.strictEqual(readerLint([setup, sameWork], config).length, 1,
    'successive scenes in the same work must still be checked');
});

withFixture(root => {
  const first = {
    workKind: 'novel', workId: 'SHARED', path: path.join(root, 'novel-scene.md'),
    data: {
      knowledge_delta: [{ entity: 'char-0001', change: 'reveal' }],
      stakes: { level: 'low', summary: 'Novel opening' }
    }
  };
  const otherKind = {
    workKind: 'novella', workId: 'SHARED', path: path.join(root, 'novella-scene.md'),
    data: {
      knowledge_delta: [{ entity: 'char-0001', change: 'reveal' }],
      stakes: { level: 'existential', summary: 'Novella climax' }
    }
  };
  assert.deepStrictEqual(lintKnowledge([first, otherKind]), [],
    'knowledge state must not carry between works of different kinds');
  assert.deepStrictEqual(analyzeStakes([first, otherKind]), [],
    'stakes level must not carry between works of different kinds');

  const sameWork = { ...otherKind, workKind: 'novel' };
  assert.strictEqual(lintKnowledge([first, sameWork]).length, 1,
    'a repeated reveal in the same work remains reportable');
  assert.strictEqual(analyzeStakes([first, sameWork]).length, 1,
    'a stakes jump in the same work remains reportable');
});

console.log('Validation gate regression tests passed.');
