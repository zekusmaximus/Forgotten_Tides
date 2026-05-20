#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '../..');
const REPORT_DIR = path.join(ROOT_DIR, 'out', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'canonical_reference_report.json');
const INDEX_PATH = path.join(ROOT_DIR, 'CANONICAL_INDEX.md');

function loadCanonicalIds() {
  const ids = new Set();

  if (!fs.existsSync(INDEX_PATH)) {
    console.warn(`⚠️  Canonical index not found at ${INDEX_PATH}`);
    return ids;
  }

  const content = fs.readFileSync(INDEX_PATH, 'utf8');
  // Match the leading backticked identifier on each list line:
  // `- \`<id>\` — Name (\`path\`)`. We use the line anchor and the ` — ` suffix
  // so the path token (also backticked) is not picked up as an ID.
  const matches = content.matchAll(/^- `([^`]+)` —/gm);
  for (const match of matches) {
    ids.add(match[1].trim().toLowerCase());
  }

  return ids;
}

function isCanonicalId(value) {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(value.trim());
}

function collectIdsFromValue(value, ids) {
  if (Array.isArray(value)) {
    value.forEach(item => collectIdsFromValue(item, ids));
    return;
  }

  if (value && typeof value === 'object') {
    if (value.target_id && isCanonicalId(value.target_id)) {
      ids.push(value.target_id);
    }
    Object.values(value).forEach(item => collectIdsFromValue(item, ids));
    return;
  }

  if (isCanonicalId(value)) {
    ids.push(value);
  }
}

function extractReferencedIds(frontmatter) {
  const ids = [];
  const referenceFields = ['cross_refs', 'references', 'appears_in', 'rules_used', 'relationships'];
  referenceFields.forEach(field => {
    if (frontmatter[field]) {
      collectIdsFromValue(frontmatter[field], ids);
    }
  });

  return ids;
}

function scanFile(filePath, canonicalIds, report) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) {
    return;
  }

  let data;
  try {
    data = yaml.load(match[1]);
  } catch (error) {
    report.errors.push({
      file: path.relative(ROOT_DIR, filePath),
      error: `Failed to parse YAML: ${error.message}`
    });
    return;
  }

  const referencedIds = extractReferencedIds(data);
  referencedIds.forEach(id => {
    const normalized = id.trim().toLowerCase();
    if (!canonicalIds.has(normalized)) {
      report.missing.push({
        file: path.relative(ROOT_DIR, filePath),
        id
      });
    }
  });
}

function walkDir(dir, canonicalIds, report) {
  const entries = fs.readdirSync(dir);

  entries.forEach(entry => {
    const entryPath = path.join(dir, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory()) {
      if (shouldSkipDir(entry)) {
        return;
      }
      walkDir(entryPath, canonicalIds, report);
    } else if (entry.endsWith('.md') && entry !== 'README.md') {
      scanFile(entryPath, canonicalIds, report);
    }
  });
}

function shouldSkipDir(dirName) {
  return ['.git', 'node_modules', 'out', 'scripts'].includes(dirName);
}

function writeReport(report) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

function main() {
  console.log('🔍 Validating canonical references...');

  const canonicalIds = loadCanonicalIds();
  const report = {
    generated_at: new Date().toISOString(),
    canonical_ids_loaded: canonicalIds.size,
    missing: [],
    errors: []
  };

  if (canonicalIds.size === 0) {
    console.warn('⚠️  No canonical IDs loaded; skipping reference validation.');
    writeReport(report);
    process.exit(0);
  }

  walkDir(ROOT_DIR, canonicalIds, report);
  writeReport(report);

  if (report.errors.length > 0) {
    console.error('❌ YAML parsing errors detected in reference validation.');
    report.errors.forEach(entry => {
      console.error(`  - ${entry.file}: ${entry.error}`);
    });
  }

  if (report.missing.length > 0) {
    console.error(`❌ Found ${report.missing.length} missing canonical references.`);
    report.missing.forEach(entry => {
      console.error(`  - ${entry.file}: ${entry.id}`);
    });
    console.log(`📄 Report written to ${path.relative(ROOT_DIR, REPORT_PATH)}`);
    process.exit(1);
  }

  console.log('✅ All canonical references resolved.');
  console.log(`📄 Report written to ${path.relative(ROOT_DIR, REPORT_PATH)}`);
  process.exit(0);
}

main();
