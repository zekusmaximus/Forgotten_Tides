#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sync: globSync } = require('glob');
const { pack } = require('../prompt/export_prompt_pack');

const previousCwd = process.cwd();
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-prompt-index-'));

function write(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function countSourceReads(callback) {
  const originalRead = fs.readFileSync;
  const reads = { markdown: 0, lexicon: 0 };
  fs.readFileSync = function (filePath, ...args) {
    const normalized = String(filePath).replace(/\\/g, '/');
    if (normalized.endsWith('.md')) reads.markdown++;
    if (normalized.endsWith('data/lexicon/terms.yaml')) reads.lexicon++;
    return originalRead.call(this, filePath, ...args);
  };
  try {
    return { result: callback(), reads };
  } finally {
    fs.readFileSync = originalRead;
  }
}

try {
  // More files than the current repository, including a filtered duplicate ID.
  for (let i = 0; i < 160; i++) {
    const id = `char-${String(i).padStart(4, '0')}`;
    write(`characters/${id}.md`, `---\nid: ${id}\ntype: character\nname: Character ${i}\ncanon_tier: primary_canon\nsummary_50: Summary ${i}\n---\nBody ${i}\n`);
  }
  write('lore/test_duplicate.md', '---\nid: char-0001\ncanon_tier: test\nname: Test duplicate\n---\n');
  write('characters/README.md', 'No frontmatter');
  write('characters/char-0001_backup_old.md', '---\nid: char-0001\nname: Backup\n---\n');
  write('data/lexicon/terms.yaml', 'terms:\n  - id: term-0001\n    term: Passage\n    definition: A route.\n');

  process.chdir(root);
  const ids = ['char-0001', 'term-0001', 'char-0001', 'char-0159'];
  const { result, reads } = countSourceReads(() => pack(ids));
  assert.deepEqual(result.entries.map(entry => entry.id), ['char-0001', 'char-0001', 'char-0159', 'term-0001']);
  assert.deepEqual(result.entries.filter(entry => entry.id === 'char-0001').map(entry => entry.name), ['Character 1', 'Character 1']);
  assert.equal(result.entries.find(entry => entry.id === 'term-0001').summary_50, 'A route.');
  assert.equal(result.entries.find(entry => entry.id === 'char-0159').summary_50, 'Summary 159');
  assert.equal(reads.markdown, 161, 'each live Markdown source should be parsed once per pack');
  assert.equal(reads.lexicon, 1, 'the lexicon should be parsed once per pack');

  const absentIds = Array.from({ length: 16 }, (_, i) => `missing-${i}`);
  const missing = countSourceReads(() => pack(absentIds));
  assert.deepEqual(missing.result.entries, []);
  assert.equal(missing.reads.markdown, 161);
  assert.equal(missing.reads.lexicon, 1);
  console.log(`PASS: prompt-pack index reads 161 Markdown files once for ${absentIds.length} missing IDs`);
  console.log('PASS: prompt-pack index preserves selected entries, lexicon terms, and repeated IDs');

  const sourceOrder = globSync('{characters,factions,atlas,mechanics,stories,lore,data}/**/*.md', { nodir: true })
    .filter(file => !/readme\.md$/i.test(file) && !/_backup_/i.test(file));
  const earlySource = sourceOrder[0];
  const lateSource = sourceOrder[sourceOrder.length - 1];
  fs.writeFileSync(earlySource, '---\nid: char-early\nname: Early match\n---\n');
  const originalRead = fs.readFileSync;
  fs.readFileSync = function (filePath, ...args) {
    if (String(filePath) === lateSource) throw new Error('late source failure');
    return originalRead.call(this, filePath, ...args);
  };
  try {
    assert.equal(pack(['char-early']).entries[0].name, 'Early match');
    assert.throws(() => pack(['char-early', 'not-present']), /late source failure/);
  } finally {
    fs.readFileSync = originalRead;
  }
  console.log('PASS: resolved IDs stop before unrelated read failures; missing IDs still report them');
} finally {
  process.chdir(previousCwd);
  fs.rmSync(root, { recursive: true, force: true });
}
