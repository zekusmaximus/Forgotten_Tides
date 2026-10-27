#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { WORK_KINDS, resolveWithin } = require('./lib/path_safety');
const { normalizeSceneReference } = require('./lib/scene_indexer');

const INCLUDE_PATTERN = /<!--\s*(?:include|scene):\s*([^>]+?)\s*-->/gi;
const NON_PUBLISHABLE_WORK = /(^|[_-])(test|sample|sandbox)([_-]|$)/i;
const BACKUP_SCENE = /(^|[._-])(backup|bak)([._-]|$)/i;

function readMarkdown(filePath, root) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  try {
    return matter(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${relative}: ${error.message}`);
  }
}

function discoverManuscripts(root) {
  const storiesDir = resolveWithin(root, 'stories');
  if (!fs.existsSync(storiesDir) || !fs.statSync(storiesDir).isDirectory()) {
    throw new Error('Story directory does not exist: stories/');
  }

  const manuscripts = [];
  for (const kind of WORK_KINDS) {
    const kindDir = resolveWithin(root, 'stories', kind);
    if (!fs.existsSync(kindDir)) continue;
    if (!fs.statSync(kindDir).isDirectory()) throw new Error(`Not a story directory: stories/${kind}`);
    for (const entry of fs.readdirSync(kindDir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`Unsafe story directory symlink: stories/${kind}/${entry.name}`);
      if (!entry.isDirectory()) continue;
      if (NON_PUBLISHABLE_WORK.test(entry.name)) continue;
      const manuscript = resolveWithin(root, 'stories', kind, entry.name, 'manuscript.md');
      if (!fs.existsSync(manuscript)) continue;
      if (!fs.lstatSync(manuscript).isFile()) throw new Error(`Not a manuscript file: ${manuscript}`);
      manuscripts.push({ kind, work: entry.name, path: manuscript });
    }
  }
  manuscripts.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (manuscripts.length === 0) throw new Error('No manuscripts found under stories/.');
  return manuscripts;
}

function sceneReference(entry, manuscriptPath) {
  const reference = normalizeSceneReference(entry);
  const fileName = reference && path.posix.basename(reference);
  if (!reference || fileName.toLowerCase() === 'readme.md' || BACKUP_SCENE.test(fileName)) {
    throw new Error(`Invalid scene reference in ${manuscriptPath}: ${JSON.stringify(entry)}`);
  }
  return reference;
}

function declaredScenes(root, manuscript, data, manuscriptPath) {
  const declaration = data.scenes === undefined ? data.include : data.scenes;
  if (declaration === undefined) return [];
  const entries = Array.isArray(declaration) ? declaration : [declaration];
  return entries.flatMap(entry => typeof entry === 'string' && entry.trim().toLowerCase() === 'scenes'
    ? allSceneReferences(root, manuscript.kind, manuscript.work)
    : [sceneReference(entry, manuscriptPath)]);
}

function allSceneReferences(root, kind, work) {
  const sceneDir = resolveWithin(root, 'stories', kind, work, 'scenes');
  if (!fs.existsSync(sceneDir)) return [];
  if (!fs.statSync(sceneDir).isDirectory()) throw new Error(`Not a scene directory: ${sceneDir}`);
  return fs.readdirSync(sceneDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md') &&
      entry.name.toLowerCase() !== 'readme.md' && !BACKUP_SCENE.test(entry.name))
    .map(entry => `scenes/${entry.name}`)
    .sort();
}

function renderManuscript(root, manuscript) {
  const relativeManuscript = path.relative(root, manuscript.path).split(path.sep).join('/');
  const parsed = readMarkdown(manuscript.path, root);
  const declared = declaredScenes(root, manuscript, parsed.data || {}, relativeManuscript);
  const included = new Set();

  function renderScene(reference) {
    const key = reference.toLowerCase();
    if (included.has(key)) return '';
    const scenePath = resolveWithin(root, 'stories', manuscript.kind, manuscript.work, ...reference.split('/'));
    if (!fs.existsSync(scenePath) || !fs.lstatSync(scenePath).isFile()) {
      throw new Error(`Scene referenced by ${relativeManuscript} does not exist: ${reference}`);
    }
    included.add(key);
    const relativeScene = path.relative(root, scenePath).split(path.sep).join('/');
    const scene = readMarkdown(scenePath, root);
    return `<!-- Source: ${relativeScene} -->\n\n${scene.content.trim()}`;
  }

  let body = parsed.content.replace(INCLUDE_PATTERN, (_match, value) => {
    const references = value.trim().toLowerCase() === 'scenes'
      ? (declared.length ? declared : allSceneReferences(root, manuscript.kind, manuscript.work))
      : [sceneReference(value.trim(), relativeManuscript)];
    return references.map(renderScene).filter(Boolean).join('\n\n');
  }).trim();

  const remaining = declared.map(renderScene).filter(Boolean);
  if (remaining.length) body = [body, ...remaining].filter(Boolean).join('\n\n');
  if (!body) body = `# ${parsed.data.title || manuscript.work}`;
  return `<!-- Source: ${relativeManuscript} -->\n\n${body}`;
}

function buildCompilation(repoRoot) {
  const root = fs.realpathSync(repoRoot);
  return `${discoverManuscripts(root).map(manuscript => renderManuscript(root, manuscript)).join('\n\n---\n\n')}\n`;
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--root' || !args[1])) {
      throw new Error('Usage: node scripts/compile_stories.js [--root REPOSITORY]');
    }
    process.stdout.write(buildCompilation(args.length ? args[1] : path.resolve(__dirname, '..')));
  } catch (error) {
    console.error(`Story compilation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildCompilation, discoverManuscripts };
