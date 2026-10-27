const fs = require('fs');
const path = require('path');

const WORK_KINDS = ['short_story', 'novella', 'novel', 'screenplay'];
const KIND_ALIASES = {
  short: 'short_story',
  shorts: 'short_story',
  novels: 'novel',
  novellas: 'novella'
};

function validatePathSegment(value, label = 'path segment') {
  if (typeof value !== 'string' || !value || value === '.' || value === '..' ||
      /[\\/\0\r\n:]/.test(value) || /[. ]$/.test(value) ||
      path.isAbsolute(value) || path.win32.isAbsolute(value)) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
  return value;
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function resolveWithin(repoRoot, ...segments) {
  const root = fs.realpathSync(repoRoot);
  for (const segment of segments) validatePathSegment(segment);
  const target = path.resolve(root, ...segments);
  if (!isWithin(root, target)) throw new Error(`Path escapes repository: ${target}`);

  // Reject existing symlinks that would lead a later write outside the root.
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Unsafe symlink in path: ${current}`);
  }
  return target;
}

function normalizeWorkKind(kind) {
  if (typeof kind !== 'string' || !kind) throw new Error('Work kind is required');
  const normalized = KIND_ALIASES[kind] || kind;
  if (!WORK_KINDS.includes(normalized)) throw new Error(`Unknown work kind: ${kind}`);
  return normalized;
}

function resolveExistingWork(repoRoot, work, kind = null) {
  validatePathSegment(work, 'work ID');
  const kinds = kind ? [normalizeWorkKind(kind)] : WORK_KINDS;
  const matches = kinds.map(workKind => ({
    kind: workKind,
    path: resolveWithin(repoRoot, 'stories', workKind, work)
  })).filter(candidate => fs.existsSync(candidate.path) && fs.statSync(candidate.path).isDirectory());

  if (matches.length === 0) throw new Error(`Work not found: ${work}`);
  if (matches.length > 1) throw new Error(`Ambiguous work ID ${work}; pass --kind`);
  return matches[0];
}

module.exports = {
  WORK_KINDS,
  validatePathSegment,
  resolveWithin,
  normalizeWorkKind,
  resolveExistingWork
};
