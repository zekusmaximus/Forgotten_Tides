#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { loadFrontmatter, readYamlFile, ensureDir } = require('../lib/file_loader');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');

function listSandboxFiles() {
  const root = path.join(process.cwd(), 'sandbox');
  if (!fs.existsSync(root)) return [];
  const out = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (entry.name.endsWith('.md') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        out.push(full);
      }
    });
  }
  walk(root);
  return out;
}

function parseFile(filePath) {
  if (filePath.endsWith('.md')) {
    return loadFrontmatter(filePath).data;
  }
  return readYamlFile(filePath).data;
}

function lintSandbox() {
  const findings = [];
  const files = listSandboxFiles();
  files.forEach(file => {
    const data = parseFile(file) || {};
    if (data.canonical_lock === true) {
      findings.push({ severity: 'error', file: path.relative(process.cwd(), file), message: 'canonical_lock=true; cannot merge' });
    }
    if (!data.id) {
      findings.push({ severity: 'warning', file: path.relative(process.cwd(), file), message: 'Missing id' });
    }
  });
  return { files, findings };
}

function run() {
  const { files, findings } = lintSandbox();
  const jsonPath = writeJsonReport('sandbox_lint.json', { files: files.map(f => path.relative(process.cwd(), f)), findings });
  const mdLines = renderFindings('Sandbox Lint', findings);
  const mdPath = writeMarkdownReport('sandbox_lint.md', mdLines);
  console.log(`Sandbox lint wrote ${jsonPath} and ${mdPath}`);

  const hasError = findings.some(f => f.severity === 'error');
  if (hasError) {
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { lintSandbox };
