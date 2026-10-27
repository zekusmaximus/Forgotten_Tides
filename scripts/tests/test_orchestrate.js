#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const matter = require('gray-matter');
const { orchestrate, exportPack, getBodyContentForAuthoring, runLints } = require('../prompt/orchestrate');

const scriptsRoot = path.join(__dirname, '..');
const goodChecks = () => [
  { step: 'schema', status: 0, required: true, output: '' },
  { step: 'refs', status: 0, required: true, output: '' },
  { step: 'glossary', status: 0, required: false, output: '' },
  { step: 'continuity', status: 0, required: true, output: '' }
];

async function withFixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-orchestrate-'));
  try {
    await run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function test(name, run) {
  try {
    await run();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

async function main() {
  await test('body reader waits for EOF beyond the former 100 ms timeout', async () => {
    const input = new PassThrough();
    const body = getBodyContentForAuthoring(input);
    setTimeout(() => {
      input.write('Scene body after delay.');
      input.end('\nLast line.\n');
    }, 150);
    assert.equal(await body, 'Scene body after delay.\nLast line.\n');
  });

  await test('prompt export uses the returned path even when an older pack has a later mtime', () => withFixture(root => {
    const out = path.join(root, 'out', 'prompts');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'stale_pack.json'), '{}');
    fs.utimesSync(path.join(out, 'stale_pack.json'), new Date('2030-01-01'), new Date('2030-01-01'));
    const selected = exportPack(['char-0001'], { root, execute: () => {
      fs.writeFileSync(path.join(out, 'selected_pack.json'), '{}');
      fs.writeFileSync(path.join(out, 'selected_pack.md'), '# Selected\n');
      return 'out/prompts/selected_pack.json';
    } });
    assert.equal(selected, 'out/prompts/selected_pack.json');
    assert.throws(() => exportPack(['char-0001'], { root, execute: () => 'out/prompts/stale_pack.json' }),
      /did not create the reported JSON and Markdown files/);
  }));

  await test('first-run start_work, scene, and notes use the actual authoring subprocess', () => withFixture(async root => {
    fs.symlinkSync(scriptsRoot, path.join(root, 'scripts'), 'junction');
    const base = { root, services: { runLints: goodChecks } };
    const started = await orchestrate('start a new novella titled "Fixture"', base);
    assert.equal(started.intent, 'start_work');
    const workDir = path.join(root, 'stories', 'novella', 'NOVELLA_FIXTURE');
    assert(fs.existsSync(path.join(workDir, 'manuscript.md')));
    assert(fs.existsSync(path.join(root, 'out', 'session', 'state.json')));
    assert(started.report.startsWith('out/session/reports/'));
    assert(!fs.existsSync(path.join(root, 'docs', 'session')));

    const scene = await orchestrate('save this as a scene "Arrival" in NOVELLA_FIXTURE', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Scene body.\n' }
    });
    assert.equal(scene.intent, 'save_scene');
    assert.equal(fs.readdirSync(path.join(workDir, 'scenes')).filter(file => file.endsWith('.md')).length, 1);

    const placed = await orchestrate('place this as a scene "Prequel" in NOVELLA_FIXTURE at index 1', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Earlier scene body.\n' }
    });
    assert.equal(placed.intent, 'save_scene');
    const manuscriptOrder = matter(fs.readFileSync(path.join(workDir, 'manuscript.md'), 'utf8')).data.scenes;
    assert.equal(manuscriptOrder.length, 2);
    assert.equal(path.basename(manuscriptOrder[0].file), path.basename(placed.artifacts[0]));

    const replacement = await orchestrate('replace the scene "Arrival" in NOVELLA_FIXTURE', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Replaced scene body.\n' }
    });
    assert.equal(replacement.intent, 'replace_scene');
    assert.equal(fs.readdirSync(path.join(workDir, '.backups', 'scenes')).length, 1);

    const outline = await orchestrate('update outline for NOVELLA_FIXTURE in act one', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Updated outline.\n' }
    });
    assert.equal(outline.intent, 'update_outline');
    assert.match(fs.readFileSync(path.join(workDir, 'outline.md'), 'utf8'), /Updated outline/);

    const notes = await orchestrate('save notes "Fixture Notes"', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Notes body.\n' }
    });
    assert.equal(notes.intent, 'save_notes');
    assert.equal(fs.readdirSync(path.join(root, 'lore', 'notes')).length, 1);

    const statePath = path.join(root, 'out', 'session', 'state.json');
    const historyBefore = JSON.parse(fs.readFileSync(statePath, 'utf8')).history.length;
    await assert.rejects(orchestrate('save this as a scene "Lost" in NOVELLA_MISSING_WORK', {
      root, services: { runLints: goodChecks, getBodyContentForAuthoring: async () => 'Body.\n' }
    }), /Authoring operation failed: .*Work not found/);
    assert.equal(JSON.parse(fs.readFileSync(statePath, 'utf8')).history.length, historyBefore);
  }));

  await test('new title containing an existing title creates the requested work', () => withFixture(async root => {
    fs.symlinkSync(scriptsRoot, path.join(root, 'scripts'), 'junction');
    const existing = path.join(root, 'stories', 'novella', 'NOVELLA_FIRST_CORRIDOR');
    fs.mkdirSync(existing, { recursive: true });
    fs.writeFileSync(path.join(existing, 'manuscript.md'),
      '---\nid: story-0001\ntitle: First Corridor\ntype: story\n---\n');
    const result = await orchestrate('start a new novella titled "First Corridor Revisited"', {
      root, services: { runLints: goodChecks }
    });
    assert.equal(result.intent, 'start_work');
    assert(fs.existsSync(path.join(root, 'stories', 'novella', 'NOVELLA_FIRST_CORRIDOR_REVISITED', 'manuscript.md')));
  }));

  await test('empty required body and failed authoring stop before a success report', () => withFixture(async root => {
    fs.mkdirSync(path.join(root, 'out', 'prompts'), { recursive: true });
    const runNode = () => {
      const relative = 'out/prompts/fixture_context.json';
      fs.writeFileSync(path.join(root, relative), JSON.stringify({ order: [] }));
      return relative;
    };
    const base = { root, services: { runNode, runLints: goodChecks, extract: () => ({ work: null }) } };
    await assert.rejects(orchestrate('save notes "Empty"', {
      ...base, services: { ...base.services, getBodyContentForAuthoring: async () => '   \n' }
    }), /requires non-empty body content/);
    assert(!fs.existsSync(path.join(root, 'out', 'session', 'state.json')));

    await assert.rejects(orchestrate('save notes "Broken"', {
      ...base, services: { ...base.services, getBodyContentForAuthoring: async () => 'Body.',
        runAuthoringOperation: async () => { throw new Error('injected failure'); } }
    }), /Authoring operation failed: injected failure/);
    assert(!fs.existsSync(path.join(root, 'out', 'session', 'state.json')));
  }));

  await test('context and required check failures propagate with real statuses', () => withFixture(async root => {
    await assert.rejects(orchestrate('export pack', {
      root, services: { runNode: () => { throw new Error('context failed'); } }
    }), /context failed/);
    assert(!fs.existsSync(path.join(root, 'out', 'session', 'state.json')));

    const runNode = () => {
      const relative = 'out/prompts/fixture_context.json';
      fs.writeFileSync(path.join(root, relative), JSON.stringify({ order: [] }));
      return relative;
    };
    await assert.rejects(orchestrate('export pack', {
      root, services: { runNode, runLints: () => [{ step: 'schema', status: 7, required: true, output: 'bad schema' }] }
    }), /schema \(exit 7\)/);
    assert(!fs.existsSync(path.join(root, 'out', 'session', 'state.json')));
    const reports = fs.readdirSync(path.join(root, 'out', 'session', 'reports'));
    assert.equal(reports.length, 1);
    assert.match(fs.readFileSync(path.join(root, 'out', 'session', 'reports', reports[0]), 'utf8'),
      /schema: exit 7 \(required\)/);
  }));

  await test('failed prompt export cannot reuse an older pack', () => withFixture(async root => {
    const out = path.join(root, 'out', 'prompts');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'stale_pack.json'), '{}');
    fs.writeFileSync(path.join(out, 'stale_pack.md'), '# Stale\n');
    await assert.rejects(orchestrate('export pack', {
      root,
      services: { runNode: script => {
        if (script.includes('context_builder')) {
          fs.writeFileSync(path.join(out, 'fixture_context.json'), JSON.stringify({ order: ['char-0001'] }));
          return 'out/prompts/fixture_context.json';
        }
        throw new Error('injected exporter failure');
      }, runLints: goodChecks }
    }), /injected exporter failure/);
    assert(!fs.existsSync(path.join(root, 'out', 'session', 'state.json')));
  }));

  await test('compile intent writes the supported story Markdown artifact', () => withFixture(async root => {
    const runNode = () => {
      const relative = 'out/prompts/fixture_context.json';
      fs.writeFileSync(path.join(root, relative), JSON.stringify({ order: [] }));
      return relative;
    };
    const manuscript = path.join(root, 'stories', 'short_story', 'FIXTURE', 'manuscript.md');
    fs.mkdirSync(path.dirname(manuscript), { recursive: true });
    fs.writeFileSync(manuscript, '# Fixture\n\nPublishable fixture text.\n');
    const result = await orchestrate('compile all artifacts', {
      root, services: { runNode, runLints: goodChecks }
    });
    const output = path.join(root, 'out', 'compiled', 'forgotten_tides_stories.md');
    assert.deepEqual(result.artifacts, ['out/compiled/forgotten_tides_stories.md']);
    assert.match(fs.readFileSync(output, 'utf8'), /Publishable fixture text\./);

    await assert.rejects(orchestrate('build bible pdf', {
      root, services: { runNode, runLints: goodChecks }
    }), /compiles story Markdown only/);

    fs.writeFileSync(manuscript, '# Fixture\n\n<!-- include: scenes/MISSING.md -->\n');
    const prior = fs.readFileSync(output, 'utf8');
    await assert.rejects(orchestrate('compile all artifacts', {
      root, services: { runNode, runLints: goodChecks }
    }), /Scene referenced.*does not exist/);
    assert.equal(fs.readFileSync(output, 'utf8'), prior);
  }));

  await test('malformed prior session state is preserved and fails clearly', () => withFixture(async root => {
    const statePath = path.join(root, 'out', 'session', 'state.json');
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const original = '{broken';
    fs.writeFileSync(statePath, original);
    await assert.rejects(orchestrate('export pack', { root }), SyntaxError);
    assert.equal(fs.readFileSync(statePath, 'utf8'), original);
  }));

  await test('check runner records subprocess status and advisory scope', () => {
    const results = runLints({ execute: (_binary, argv) => {
      if (argv[0].endsWith('schema_validate.js')) throw { status: 3, stderr: 'schema failed' };
      if (argv[0].endsWith('glossary_enforcer.js')) throw { status: 4, stderr: 'advisory failed' };
      return 'ok';
    } });
    assert.deepEqual(results.map(result => [result.step, result.status, result.required]), [
      ['schema', 3, true], ['refs', 0, true], ['glossary', 4, false], ['continuity', 0, true]
    ]);
  });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
