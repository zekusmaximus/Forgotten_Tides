#!/usr/bin/env node
const fs = require('fs');
const yaml = require('js-yaml');
const { getMode } = require('../lib/mode');
const { resolveWithin, validatePathSegment } = require('../lib/path_safety');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null, mode: null };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
    if (arg === '--mode') out.mode = args[idx + 1];
  });
  return out;
}

function writeIfMissing(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: 'wx' });
    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return false;
  }
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run start:draft -- --work "<name>" [--mode fast|strict]');
    process.exit(1);
  }
  validatePathSegment(args.work, 'work ID');
  const mode = (args.mode || getMode()).toLowerCase();
  if (!['fast', 'strict'].includes(mode)) throw new Error(`Unknown draft mode: ${args.mode}`);
  const root = process.cwd();
  const novellaDir = resolveWithin(root, 'stories', 'novella');
  const workDir = resolveWithin(root, 'stories', 'novella', args.work);
  const scenesDir = resolveWithin(root, 'stories', 'novella', args.work, 'scenes');
  const metaPath = resolveWithin(root, 'stories', 'novella', args.work, 'meta.yaml');
  const manuscriptPath = resolveWithin(root, 'stories', 'novella', args.work, 'manuscript.md');
  const status = mode === 'fast' ? 'draft_unstable' : 'draft';
  const metaContent = yaml.dump({
    id: args.work,
    title: args.work.replace(/_/g, ' '),
    type: 'novella',
    status,
    metadata: { status, mode }
  });

  fs.mkdirSync(novellaDir, { recursive: true });
  let createdWork = false;
  const createdFiles = [];
  try {
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir);
      createdWork = true;
    }
    fs.mkdirSync(scenesDir, { recursive: true });
    if (writeIfMissing(metaPath, metaContent)) createdFiles.push(metaPath);
    if (writeIfMissing(manuscriptPath, `# ${args.work}\n\n<!-- include: scenes -->\n`)) createdFiles.push(manuscriptPath);
  } catch (error) {
    for (const filePath of createdFiles.reverse()) fs.unlinkSync(filePath);
    if (createdWork) {
      try { fs.rmdirSync(scenesDir); } catch { /* keep any unexpected files */ }
      try { fs.rmdirSync(workDir); } catch { /* keep any unexpected files */ }
    }
    throw error;
  }

  console.log(`Draft workspace ready at ${workDir} (mode=${mode})`);
}

main();
