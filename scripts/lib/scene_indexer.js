const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');
const { loadFrontmatter } = require('./file_loader');
const { WORK_KINDS, resolveExistingWork, resolveWithin } = require('./path_safety');

function normalizeSceneReference(entry) {
  const value = typeof entry === 'string' ? entry : entry && typeof entry === 'object'
    ? entry.file || entry.path || entry.id : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.length === 2 && parts[0].toLowerCase() === 'scenes') parts.shift();
  if (parts.length !== 1 || !parts[0] || parts[0] === '.' || parts[0] === '..') return null;
  const name = parts[0].endsWith('.md') ? parts[0] : `${parts[0]}.md`;
  if (!/^[^\x00-\x1f/:]+\.md$/i.test(name) || /_backup_/i.test(name)) return null;
  return `scenes/${name}`;
}

function parseManuscriptSceneReferences(rawMarkdown) {
  const parsed = matter(rawMarkdown);
  const data = parsed.data || {};
  const declared = Array.isArray(data.scenes) ? data.scenes : Array.isArray(data.include) ? data.include : null;
  const entries = declared || [...parsed.content.matchAll(/<!--\s*(?:include|scene):\s*([^>]+?)\s*-->/gi)]
    .map(match => match[1].trim())
    .filter(value => value.toLowerCase() !== 'scenes');
  const seen = new Set();
  const references = [];
  for (const entry of entries) {
    const reference = normalizeSceneReference(entry);
    if (!reference) throw new Error(`Invalid scene reference in manuscript: ${JSON.stringify(entry)}`);
    const key = reference.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    references.push(reference);
  }
  return references;
}

function numericOrder(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function workParts(root, scenePath) {
  const relative = path.relative(root, scenePath);
  const parts = relative.split(path.sep);
  if (parts.length !== 5 || parts[0] !== 'stories' || !WORK_KINDS.includes(parts[1]) ||
      parts[3] !== 'scenes' || !parts[4].toLowerCase().endsWith('.md') ||
      parts[4].toLowerCase() === 'readme.md' || /_backup_/i.test(parts[4])) return null;
  const safePath = resolveWithin(root, ...parts);
  if (!fs.lstatSync(safePath).isFile()) return null;
  return { kind: parts[1], workId: parts[2], fileName: parts[4], workDir: path.dirname(path.dirname(safePath)) };
}

function orderMapForWork(workDir) {
  const manuscript = resolveWithin(workDir, 'manuscript.md');
  if (!fs.existsSync(manuscript)) return new Map();
  const references = parseManuscriptSceneReferences(fs.readFileSync(manuscript, 'utf8'));
  return new Map(references.map((reference, index) => [path.posix.basename(reference).toLowerCase(), index]));
}

function collectScenes(filter = {}) {
  const root = fs.realpathSync(filter.root || process.cwd());
  const requiredWork = filter.work ? resolveExistingWork(root, filter.work, filter.kind) : null;
  const files = glob.sync('stories/**/scenes/*.md', {
    cwd: root,
    nodir: true,
    absolute: true,
    windowsPathsNoEscape: true
  });
  const orders = new Map();
  const scenes = [];

  for (const filePath of files) {
    const parts = workParts(root, filePath);
    if (!parts) continue;
    if (requiredWork && parts.workDir !== requiredWork.path) continue;
    const parsed = loadFrontmatter(filePath);
    if (!orders.has(parts.workDir)) orders.set(parts.workDir, orderMapForWork(parts.workDir));
    const manuscriptOrder = orders.get(parts.workDir).get(parts.fileName.toLowerCase());
    scenes.push({
      id: parsed.data.id || path.basename(filePath, path.extname(filePath)),
      workId: parts.workId,
      workKind: parts.kind,
      path: filePath,
      data: parsed.data,
      content: parsed.content,
      wordCount: (parsed.content || '').trim().split(/\s+/).filter(Boolean).length,
      manuscriptOrder,
      numericOrder: numericOrder(parsed.data.order)
    });
  }

  scenes.sort((a, b) => {
    const workCompare = path.dirname(path.dirname(a.path)).localeCompare(path.dirname(path.dirname(b.path)));
    if (workCompare) return workCompare;
    const aDeclared = a.manuscriptOrder !== undefined;
    const bDeclared = b.manuscriptOrder !== undefined;
    if (aDeclared !== bDeclared) return aDeclared ? -1 : 1;
    if (aDeclared && a.manuscriptOrder !== b.manuscriptOrder) return a.manuscriptOrder - b.manuscriptOrder;
    const aNumbered = a.numericOrder !== null;
    const bNumbered = b.numericOrder !== null;
    if (aNumbered !== bNumbered) return aNumbered ? -1 : 1;
    if (aNumbered && a.numericOrder !== b.numericOrder) return a.numericOrder - b.numericOrder;
    return path.basename(a.path).localeCompare(path.basename(b.path));
  });
  return scenes;
}

module.exports = { normalizeSceneReference, parseManuscriptSceneReferences, collectScenes };
