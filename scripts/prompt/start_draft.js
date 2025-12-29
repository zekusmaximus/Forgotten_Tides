#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ensureDir } = require('../lib/file_loader');
const { modeTag } = require('../lib/mode');

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
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function main() {
  const args = parseArgs();
  if (!args.work) {
    console.error('Usage: npm run start:draft -- --work "<name>" [--mode fast|strict]');
    process.exit(1);
  }
  const mode = (args.mode || modeTag()).toLowerCase();
  const workDir = path.join(process.cwd(), 'stories', 'novella', args.work);
  ensureDir(path.join(workDir, 'scenes'));

  const metaPath = path.join(workDir, 'meta.yaml');
  const metaContent = [
    `id: ${args.work}`,
    `title: "${args.work.replace(/_/g, ' ')}"`,
    `type: novella`,
    `status: ${mode === 'fast' ? 'draft_unstable' : 'draft'}`,
    `metadata:`,
    `  status: ${mode === 'fast' ? 'draft_unstable' : 'draft'}`,
    `  mode: ${mode}`,
    ''
  ].join('\n');
  writeIfMissing(metaPath, metaContent);

  const manuscriptPath = path.join(workDir, 'manuscript.md');
  writeIfMissing(manuscriptPath, `# ${args.work}\n\n<!-- include: scenes -->\n`);

  console.log(`Draft workspace ready at ${workDir} (mode=${mode})`);
}

main();
