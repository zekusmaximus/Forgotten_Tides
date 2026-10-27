#!/usr/bin/env node

const path = require('path');
const { normalizeWorkKind } = require('../lib/path_safety');
const {
  DEFAULT_ROOT,
  discoverWorks,
  discoverScenes,
  resolveWork: resolveStoredWork,
  orderedWorkScenes
} = require('../lib/work_resolver');
const { parseManuscriptSceneReferences } = require('../lib/scene_indexer');

function findAllWorks(root = DEFAULT_ROOT) {
  return discoverWorks(root);
}

function resolveWork(identifier, root = DEFAULT_ROOT, kind = null) {
  return resolveStoredWork(identifier, { root, kind });
}

function findScenesInWork(workPath, root = DEFAULT_ROOT) {
  const work = discoverWorks(root).find(candidate => candidate.path === path.resolve(workPath));
  if (!work) throw new Error(`Work not found: ${workPath}`);
  return discoverScenes(root, { work });
}

function parseManuscriptScenes(content) {
  return parseManuscriptSceneReferences(content);
}

function resolveScene(identifier, root = DEFAULT_ROOT, workIdentifier = null) {
  if (typeof identifier !== 'string' || !identifier.trim()) throw new Error('Scene ID or path is required');
  const work = workIdentifier ? resolveWork(workIdentifier, root) : null;
  const scenes = work ? discoverScenes(root, { work }) : discoverScenes(root, { includeShared: true });
  const value = identifier.trim().toLowerCase().replace(/\\/g, '/');
  const exact = scenes.filter(scene => [scene.id, scene.fileId, scene.path,
    path.relative(root, scene.path).replace(/\\/g, '/'), scene.relativePath]
    .some(candidate => candidate.toLowerCase().replace(/\\/g, '/') === value));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) throw new Error(`Ambiguous scene "${identifier}"; pass --work`);
  const partial = scenes.filter(scene => scene.title.toLowerCase().includes(value));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new Error(`Ambiguous scene "${identifier}"; pass --work or a full scene ID`);
  throw new Error(`Scene not found: ${identifier}`);
}

function listCommand(workIdentifier, options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const work = resolveWork(workIdentifier, root, options.kind);
  if (!work.manuscriptPath) throw new Error(`Manuscript not found for ${work.directoryId}`);
  const scenes = orderedWorkScenes(work);
  console.log('index | SC-ID       | title                          | path');
  console.log('------|------------|--------------------------------|-------------------------------');
  scenes.forEach((scene, index) => {
    const relative = path.relative(root, scene.path);
    console.log(`${String(index).padEnd(5)} | ${scene.fileId.padEnd(10)} | ${scene.title.padEnd(30)} | ${relative}`);
  });
  return scenes;
}

function graphCommand(workIdentifier, options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const work = resolveWork(workIdentifier, root, options.kind);
  if (!work.manuscriptPath) throw new Error(`Manuscript not found for ${work.directoryId}`);
  const scenes = orderedWorkScenes(work);
  console.log('graph TD');
  scenes.forEach((scene, index) => {
    const label = `${scene.fileId}: ${scene.title}`.replace(/[\r\n]/g, ' ').replace(/["\\]/g, '\\$&');
    console.log(`  n${index}["${label}"]`);
    if (index > 0) console.log(`  n${index - 1} --> n${index}`);
  });
  return scenes;
}

function openCommand(sceneIdentifier, options = {}) {
  const scene = resolveScene(sceneIdentifier, options.root || DEFAULT_ROOT, options.work || null);
  console.log(scene.path);
  return scene;
}

function parseOptions(argv) {
  const [command, ...rest] = argv;
  if (!['list', 'graph', 'open'].includes(command)) {
    throw new Error('Usage: scenes_cli.js <list|graph|open> --work <ID_or_Title> | --scene <ID_or_path>');
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!['--work', '--scene', '--kind'].includes(flag) || !value || value.startsWith('--')) {
      throw new Error(`Unsupported or incomplete option: ${flag || '(none)'}`);
    }
    const key = flag.slice(2);
    if (options[key]) throw new Error(`Duplicate option: ${flag}`);
    options[key] = value;
  }
  if (options.kind) options.kind = normalizeWorkKind(options.kind);
  if ((command === 'list' || command === 'graph') && (!options.work || options.scene)) {
    throw new Error(`Usage: scenes_cli.js ${command} --work <ID_or_Title> [--kind <kind>]`);
  }
  if (command === 'open' && (!options.scene || options.kind)) {
    throw new Error('Usage: scenes_cli.js open --scene <ID_or_path> [--work <ID_or_Title>]');
  }
  return { command, options };
}

function main(argv = process.argv.slice(2)) {
  try {
    const { command, options } = parseOptions(argv);
    if (command === 'list') listCommand(options.work, options);
    else if (command === 'graph') graphCommand(options.work, options);
    else openCommand(options.scene, options);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  findAllWorks,
  findScenesInWork,
  parseManuscriptScenes,
  resolveWork,
  resolveScene,
  listCommand,
  graphCommand,
  openCommand,
  parseOptions,
  main
};
