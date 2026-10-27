const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { WORK_KINDS, normalizeWorkKind, resolveWithin } = require('./path_safety');
const { parseManuscriptSceneReferences } = require('./scene_indexer');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');

function parseFrontmatter(content, source = 'Markdown document') {
  if (!/^---\r?\n/.test(content)) return null;
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter closing delimiter in ${source}`);
  let data;
  try {
    data = yaml.load(match[1]);
  } catch (error) {
    throw new Error(`Could not parse frontmatter in ${source}: ${error.message}`);
  }
  if (data == null) return {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Frontmatter must be an object in ${source}`);
  }
  return data;
}

function readYamlObject(filePath) {
  if (!fs.existsSync(filePath)) return {};
  let data;
  try {
    data = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse ${filePath}: ${error.message}`);
  }
  if (data == null) return {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Expected an object in ${filePath}`);
  }
  return data;
}

function discoverWorks(root = DEFAULT_ROOT) {
  const works = [];
  for (const kind of WORK_KINDS) {
    const categoryPath = resolveWithin(root, 'stories', kind);
    if (!fs.existsSync(categoryPath)) continue;
    for (const entry of fs.readdirSync(categoryPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const workPath = resolveWithin(root, 'stories', kind, entry.name);
      const manuscriptPath = resolveWithin(workPath, 'manuscript.md');
      const metaPath = resolveWithin(workPath, 'meta.yaml');
      const manuscript = fs.existsSync(manuscriptPath) ? fs.readFileSync(manuscriptPath, 'utf8') : null;
      const frontmatter = manuscript === null ? null : parseFrontmatter(manuscript, manuscriptPath);
      const meta = readYamlObject(metaPath);
      const directoryId = entry.name;
      const id = frontmatter?.id || meta.story_id || meta.id || directoryId;
      const title = frontmatter?.title || meta.title || meta.working_title || directoryId.replace(/_/g, ' ');
      works.push({
        id: String(id),
        directoryId,
        title: String(title),
        kind,
        path: workPath,
        manuscriptPath: manuscript === null ? null : manuscriptPath,
        frontmatter: frontmatter || {},
        meta
      });
    }
  }
  return works.sort((a, b) => a.path.localeCompare(b.path));
}

function resolveWork(identifier, options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const kind = options.kind ? normalizeWorkKind(options.kind) : null;
  if (typeof identifier !== 'string' || !identifier.trim()) throw new Error('Work ID or title is required');
  const query = identifier.trim().toLowerCase();
  const works = discoverWorks(root).filter(work => !kind || work.kind === kind);
  const exact = works.filter(work => [work.directoryId, work.id, work.title]
    .some(value => value.toLowerCase() === query));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) throw new Error(`Ambiguous work "${identifier}"; pass --kind or a directory ID`);
  if (options.fuzzy === false) throw new Error(`Work not found: ${identifier}`);
  const partial = works.filter(work => work.title.toLowerCase().includes(query));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new Error(`Ambiguous work "${identifier}": ${partial.map(work => work.directoryId).join(', ')}`);
  throw new Error(`Work not found: ${identifier}`);
}

function readScenesInDirectory(scenesDir, work = null) {
  if (!fs.existsSync(scenesDir)) return [];
  const scenes = [];
  for (const entry of fs.readdirSync(scenesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md') ||
        entry.name.toLowerCase() === 'readme.md' || /_backup_/i.test(entry.name)) continue;
    const scenePath = resolveWithin(scenesDir, entry.name);
    const content = fs.readFileSync(scenePath, 'utf8');
    const frontmatter = parseFrontmatter(content, scenePath) || {};
    const fileId = path.basename(entry.name, '.md');
    scenes.push({
      id: typeof frontmatter.id === 'string' ? frontmatter.id : fileId,
      fileId,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : fileId,
      path: scenePath,
      relativePath: `scenes/${entry.name}`,
      workId: work?.directoryId || null,
      kind: work?.kind || null,
      frontmatter
    });
  }
  return scenes.sort((a, b) => a.path.localeCompare(b.path));
}

function discoverScenes(root = DEFAULT_ROOT, options = {}) {
  if (options.work) return readScenesInDirectory(resolveWithin(options.work.path, 'scenes'), options.work);
  const scenes = discoverWorks(root).flatMap(work => readScenesInDirectory(resolveWithin(work.path, 'scenes'), work));
  if (options.includeShared) {
    for (const segments of [['stories', '_shared', 'scenes'], ['scenes']]) {
      const scenesDir = resolveWithin(root, ...segments);
      scenes.push(...readScenesInDirectory(scenesDir));
    }
  }
  return scenes;
}

function orderedWorkScenes(work) {
  const scenes = discoverScenes(undefined, { work });
  if (!work.manuscriptPath) return scenes;
  const paths = parseManuscriptSceneReferences(fs.readFileSync(work.manuscriptPath, 'utf8'));
  const byReference = new Map();
  for (const scene of scenes) {
    byReference.set(scene.relativePath.toLowerCase(), scene);
    byReference.set(`scenes/${scene.id}.md`.toLowerCase(), scene);
  }
  const ordered = [];
  const used = new Set();
  for (const reference of paths) {
    const scene = byReference.get(reference.toLowerCase());
    if (scene && !used.has(scene.path)) {
      ordered.push(scene);
      used.add(scene.path);
    }
  }
  const remaining = scenes.filter(scene => !used.has(scene.path));
  remaining.sort((a, b) => {
    const aOrder = Number(a.frontmatter.order);
    const bOrder = Number(b.frontmatter.order);
    const aNumbered = a.frontmatter.order != null && a.frontmatter.order !== '' && Number.isFinite(aOrder);
    const bNumbered = b.frontmatter.order != null && b.frontmatter.order !== '' && Number.isFinite(bOrder);
    if (aNumbered !== bNumbered) return aNumbered ? -1 : 1;
    if (aNumbered && bNumbered && aOrder !== bOrder) return aOrder - bOrder;
    return a.fileId.localeCompare(b.fileId);
  });
  return ordered.concat(remaining);
}

module.exports = {
  DEFAULT_ROOT,
  parseFrontmatter,
  discoverWorks,
  resolveWork,
  discoverScenes,
  orderedWorkScenes
};
