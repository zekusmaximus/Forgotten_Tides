#!/usr/bin/env node
/**
 * Tests for scripts/checks/continuity.js.
 *
 * Unit-tests the matchers, then runs the whole check against a fixture
 * repository in a temporary directory: a character named Hael (alias Brother
 * Hael) with a `Species: Human (Mid-Gravity)` invariant, and stories that
 * exercise embedded names, ordinary use of the property word, a matching
 * declaration, a declaration in a different paragraph, and a real
 * contradiction.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const continuity = require('../checks/continuity');

const CHARACTER = `---
id: char-9901
type: character
name: Hael
aliases:
  - Brother Hael
continuity:
  invariants:
    - 'Species: Human (Mid-Gravity)'
    - Memory physics rules apply
    - Anchor burn consequences are permanent
  watchlist: []
metadata:
  status: canonical
---

# Hael
`;

const STORIES = {
  'stories/short_story/embedded_name/manuscript.md': `---
id: story-9901
---

Michael counted the species of lamp in the hall. No species is dying here, he said.

The Haelish quarter was quiet.
`,
  'stories/short_story/explicit_contradiction/manuscript.md': `---
id: story-9902
---

Brother Hael bowed to the cradle. His species is Vossari, the clerk wrote.
`,
  'stories/short_story/matching_declaration/manuscript.md': `---
id: story-9903
---

Hael entered the hall. Species: Human. He did not look up.
`,
  'stories/short_story/separate_paragraph/manuscript.md': `---
id: story-9904
---

Hael walked out without a word.

The species is dying, the clerk said, and no one argued.
`,
  'stories/short_story/possessive/manuscript.md': `---
id: story-9905
---

Hael's hands were steady on the tray.
`,
  'stories/short_story/README.md': `# Not a story

Hael's species is Vossari in this README, which the check must skip.
`
};

function write(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'continuity-test-'));
  write(root, 'characters/Hael.md', CHARACTER);
  for (const [rel, content] of Object.entries(STORIES)) {
    write(root, rel, content);
  }
  return root;
}

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        () => console.log(`PASS: ${name}`),
        err => {
          console.error(`FAIL: ${name}`);
          console.error(err.stack || err.message);
          process.exitCode = 1;
        }
      );
    }
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
  return Promise.resolve();
}

(async () => {
  await test('name matcher binds on whole words and allows possessives', () => {
    const matcher = continuity.buildNameMatcher(['Hael', 'Brother Hael']);
    assert(matcher.test('Hael stood.'), 'plain name');
    assert(matcher.test("Hael's hands"), 'possessive');
    assert(matcher.test('said brother hael quietly'), 'alias, case-insensitive');
    assert(matcher.test('(Hael)'), 'punctuation boundaries');
    assert(!matcher.test('Michael stood.'), 'embedded at end of a word');
    assert(!matcher.test('The Haelish quarter'), 'embedded at start of a word');
    assert(!matcher.test('Hael2 is a callsign'), 'digit boundary');
    assert.strictEqual(continuity.buildNameMatcher([]), null, 'no names, no matcher');
    assert.strictEqual(continuity.buildNameMatcher(['  ', null]), null, 'blank names ignored');
  });

  await test('name matcher escapes regex metacharacters in names', () => {
    const matcher = continuity.buildNameMatcher(['Skather-Ait pod', 'Yaret Ivo-Senn']);
    assert(matcher.test('the Skather-Ait pod drifted'));
    assert(matcher.test('Yaret Ivo-Senn signed'));
    assert(!matcher.test('Skather Ait pod'), 'hyphen is literal');
  });

  await test('invariant parsing extracts the core value and skips generic rules', () => {
    const parsed = continuity.parseInvariant('Species: Human (Mid-Gravity)');
    assert.deepStrictEqual(parsed, { raw: 'Species: Human (Mid-Gravity)', property: 'Species', expected: 'Human (Mid-Gravity)', core: 'human' });
    assert.strictEqual(continuity.parseInvariant('Memory physics rules apply'), null);
    assert.strictEqual(continuity.parseInvariant('Anchor burn consequences are permanent'), null);
    assert.strictEqual(continuity.parseInvariant('Senior Reliquarist of the Tessarine Vault as of story-0008'), null, 'no colon, no property');
    assert.strictEqual(continuity.parseInvariant(42), null);
  });

  await test('property declarations require an explicit assignment form', () => {
    assert.deepStrictEqual(continuity.findPropertyDeclarations('Species: Human. He sat.', 'Species'), ['Human']);
    assert.deepStrictEqual(continuity.findPropertyDeclarations('species = vossari', 'Species'), ['vossari']);
    assert.deepStrictEqual(continuity.findPropertyDeclarations('His species is Vossari, the clerk wrote.', 'Species'), ['Vossari, the clerk wrote'], 'value runs to the end of the sentence');
    assert.deepStrictEqual(continuity.findPropertyDeclarations('the species of lamp in the hall', 'Species'), [], 'ordinary use is not a declaration');
    assert.deepStrictEqual(continuity.findPropertyDeclarations('subspecies is irrelevant', 'Species'), [], 'word boundary on the property');
  });

  await test('paragraph splitting treats blank and whitespace-only lines as breaks', () => {
    assert.deepStrictEqual(continuity.splitParagraphs('a\n\nb\n  \nc'), ['a', 'b', 'c']);
    assert.deepStrictEqual(continuity.splitParagraphs('a\r\n\r\nb'), ['a', 'b']);
  });

  await test('fixture repository yields exactly one hard failure, on the explicit contradiction', async () => {
    const root = makeFixtureRoot();
    try {
      const outputDir = path.join(root, 'out', 'reports');
      const report = await continuity.runContinuityCheck({ root, outputDir });

      assert.strictEqual(report.summary.total_characters, 1);
      assert.strictEqual(report.summary.hard_failures, 1, `expected one hard failure, got ${JSON.stringify(report.issues.hard, null, 2)}`);
      const [issue] = report.issues.hard;
      assert.strictEqual(issue.character, 'Hael');
      assert.strictEqual(issue.story, 'stories/short_story/explicit_contradiction/manuscript');
      assert.match(issue.found, /^Vossari/);
      assert.strictEqual(issue.invariant, 'Species: Human (Mid-Gravity)');

      const mentioned = report.characters.Hael.stories;
      assert(mentioned.includes('stories/short_story/explicit_contradiction/manuscript'));
      assert(mentioned.includes('stories/short_story/matching_declaration/manuscript'));
      assert(mentioned.includes('stories/short_story/separate_paragraph/manuscript'));
      assert(mentioned.includes('stories/short_story/possessive/manuscript'), 'possessive counts as a mention');
      assert(!mentioned.includes('stories/short_story/embedded_name/manuscript'), 'Michael and Haelish are not mentions of Hael');
      assert(!mentioned.some(s => /README$/i.test(s)), 'README files are skipped');

      assert(fs.existsSync(path.join(outputDir, 'continuity.json')), 'report written to outputDir');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await test('an empty characters directory is itself a hard failure', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'continuity-empty-'));
    try {
      fs.mkdirSync(path.join(root, 'characters'));
      fs.mkdirSync(path.join(root, 'stories'));
      const report = await continuity.runContinuityCheck({ root, write: false });
      assert.strictEqual(report.summary.hard_failures, 1);
      assert.match(report.issues.hard[0].issue, /no character files/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  if (process.exitCode) {
    console.error('\nContinuity check tests: FAILED');
  } else {
    console.log('\nContinuity check tests: all passed');
  }
})();
