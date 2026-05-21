const path = require('path');
const { listFiles } = require('./file_loader');

const DEFAULT_EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'archive',
  'out'
]);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isSkippedMarkdown(filePath, rootDir, options = {}) {
  const excludedDirs = options.excludedDirs || DEFAULT_EXCLUDED_DIRS;
  const base = path.basename(filePath).toLowerCase();
  const rel = toPosixPath(path.relative(rootDir, filePath));
  const segments = rel.split('/');

  if (!filePath.toLowerCase().endsWith('.md')) {
    return { skipped: true, reason: 'not-markdown' };
  }
  if (base === 'readme.md' && options.skipReadme !== false) {
    return { skipped: true, reason: 'readme' };
  }
  if (/_backup_/i.test(filePath)) {
    return { skipped: true, reason: 'backup' };
  }
  if (segments.some(segment => excludedDirs.has(segment))) {
    return { skipped: true, reason: 'excluded-dir' };
  }
  if (options.exclude && options.exclude(filePath, rel)) {
    return { skipped: true, reason: 'custom-exclude' };
  }

  return { skipped: false, reason: null };
}

function discoverMarkdownFiles(rootDir, options = {}) {
  const coverage = {
    root: rootDir,
    files_seen: 0,
    files_scanned: 0,
    skipped_files: 0,
    skipped_by_reason: {},
    scanned_files: []
  };

  if (!rootDir || !require('fs').existsSync(rootDir)) {
    return { files: [], coverage };
  }

  const files = listFiles(rootDir, filePath => filePath.toLowerCase().endsWith('.md'));
  coverage.files_seen = files.length;

  const scanned = [];
  for (const filePath of files) {
    const skip = isSkippedMarkdown(filePath, rootDir, options);
    if (skip.skipped) {
      coverage.skipped_files++;
      coverage.skipped_by_reason[skip.reason] = (coverage.skipped_by_reason[skip.reason] || 0) + 1;
      continue;
    }
    scanned.push(filePath);
    coverage.scanned_files.push(toPosixPath(path.relative(rootDir, filePath)));
  }

  coverage.files_scanned = scanned.length;
  return { files: scanned, coverage };
}

module.exports = {
  discoverMarkdownFiles,
  isSkippedMarkdown,
  toPosixPath
};
