#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const yaml = require('js-yaml');

const authoringScript = path.join(__dirname, '..', 'prompt', 'authoring.js');

function createWork(root, title) {
  const id = `NOVELLA_${title.toUpperCase()}`;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      authoringScript, '--intent', 'start_work', '--work', id,
      '--kind', 'novella', '--title', title
    ], { cwd: root });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`start_work ${title} exited ${code}: ${stderr}`));
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-id-reservation-'));
  try {
    fs.mkdirSync(path.join(root, 'stories', 'novella'), { recursive: true });
    const titles = ['Alpha', 'Beta', 'Gamma', 'Delta'];
    const results = await Promise.all(titles.map(title => createWork(root, title)));
    const ids = results.map(result => result.story_id);
    assert.equal(new Set(ids).size, titles.length, `concurrent creations reused an ID: ${ids}`);
    for (const result of results) {
      const manuscript = path.join(root, result.work_path, 'manuscript.md');
      const frontmatter = fs.readFileSync(manuscript, 'utf8').match(/^---\n([\s\S]*?)\n---\n/);
      assert(frontmatter, manuscript);
      assert.equal(yaml.load(frontmatter[1]).id, result.story_id);
    }
    assert.deepEqual(fs.readdirSync(path.join(root, 'out', 'id-reservations')), []);

    // A reservation left by an interrupted creator must not be reassigned.
    // Concurrent completion can leave harmless gaps, so derive this from the
    // highest ID actually issued rather than assuming a particular schedule.
    const reservedNumber = Math.max(...ids.map(id => Number(id.slice('story-'.length)))) + 1;
    const reservedId = `story-${String(reservedNumber).padStart(4, '0')}`;
    const laterId = `story-${String(reservedNumber + 1).padStart(4, '0')}`;
    fs.writeFileSync(path.join(root, 'out', 'id-reservations', `${reservedId}.lock`), 'interrupted\n');
    const later = await createWork(root, 'Epsilon');
    assert.equal(later.story_id, laterId);
    assert.deepEqual(fs.readdirSync(path.join(root, 'out', 'id-reservations')), [`${reservedId}.lock`]);
    console.log('Concurrent work creation reserves unique story IDs.');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
