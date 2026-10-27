#!/usr/bin/env node

/**
 * Authoring script for Forgotten Tides
 * Handles story authoring, scene management, and content persistence
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { makeSceneId, makeWorkId, slugify } = require('../lib/idgen');
const { normalizeWorkKind, resolveExistingWork, resolveWithin, validatePathSegment } = require('../lib/path_safety');
const { nextId } = require('../ids_next');
const yaml = require('js-yaml');
const { ensureMeta, touchModified } = require('./work_meta');

const REPO_ROOT = process.cwd();

function existingWork() {
  return resolveExistingWork(REPO_ROOT, flags.work, flags.kind);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath);
}

function preflightMetadata(workPath) {
  const metaPath = resolveWithin(workPath, 'meta.yaml');
  if (fs.existsSync(metaPath)) {
    const data = yaml.load(fs.readFileSync(metaPath, 'utf8'));
    if (data !== null && (typeof data !== 'object' || Array.isArray(data))) {
      throw new Error(`Invalid metadata object in ${metaPath}`);
    }
  }
}

function replaceFileAtomic(target, content) {
  const temporary = resolveWithin(path.dirname(target), `${path.basename(target)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx' });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function writeNewFileAtomic(target, content) {
  const temporary = resolveWithin(path.dirname(target), `${path.basename(target)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx' });
    // Linking creates the final name exclusively, without exposing a partial
    // manuscript to another creator's ID scan.
    fs.linkSync(temporary, target);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function reserveStoryId() {
  // Each creator claims an ID before writing its manuscript. A lock file for
  // each candidate lets concurrent creators move to the next ID, while the
  // second source scan handles a creator that finished between scans.
  const reservationDir = resolveWithin(REPO_ROOT, 'out', 'id-reservations');
  fs.mkdirSync(reservationDir, { recursive: true });
  let number = Number(nextId(REPO_ROOT, 'story').slice('story-'.length));
  for (;;) {
    if (!Number.isSafeInteger(number)) throw new Error('Story ID space exhausted');
    const id = `story-${String(number).padStart(4, '0')}`;
    const reservationPath = resolveWithin(reservationDir, `${id}.lock`);
    try {
      fs.writeFileSync(reservationPath, `${process.pid}\n`, { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      number += 1;
      continue;
    }

    let latest;
    try {
      latest = Number(nextId(REPO_ROOT, 'story').slice('story-'.length));
    } catch (error) {
      fs.rmSync(reservationPath, { force: true });
      throw error;
    }
    if (number < latest) {
      fs.rmSync(reservationPath, { force: true });
      number = latest;
      continue;
    }
    return { id, release: () => fs.rmSync(reservationPath, { force: true }) };
  }
}

// Command line argument parsing
const args = process.argv.slice(2);
const flags = {
  intent: getFlag('--intent'),
  work: getFlag('--work'),
  kind: getFlag('--kind'),
  title: getFlag('--title'),
  scene: getFlag('--scene'),
  order: getFlag('--order'),
  notes: getFlag('--notes'),
  body_file: getFlag('--body_file'),
  outline: getFlag('--outline')
};

function getFlag(flag) {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
}

// Read body content from stdin if body_file not provided
function getBodyContent() {
  if (flags.body_file) {
    try {
      return fs.readFileSync(flags.body_file, 'utf8');
    } catch (error) {
      console.error(`Error reading body file: ${error.message}`);
      process.exit(1);
    }
  }

  // Read from stdin
  let stdin = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    stdin += chunk;
  });

  return new Promise((resolve) => {
    process.stdin.on('end', () => {
      resolve(stdin);
    });
  });
}

// Generate YAML frontmatter
function generateFrontmatter(data) {
  return `---\n${yaml.dump(data)}---\n\n`;
}

// Start work operation
async function startWork() {
  if (!flags.work || !flags.kind || !flags.title) {
    throw new Error('Missing required arguments for start_work: --work, --kind, --title');
  }

  const workKind = normalizeWorkKind(flags.kind);
  const workId = validatePathSegment(makeWorkId(workKind === 'short_story' ? 'short' : workKind, flags.title), 'work ID');
  if (!slugify(flags.title)) throw new Error('Work title must contain letters or numbers');
  const categoryPath = resolveWithin(REPO_ROOT, 'stories', workKind);
  const workPath = resolveWithin(REPO_ROOT, 'stories', workKind, workId);
  if (fs.existsSync(workPath)) throw new Error(`Work already exists: ${workId}`);
  const { id: storyId, release } = reserveStoryId();

  const createdFiles = [];
  let scenesPath;
  let createdWork = false;
  try {
    fs.mkdirSync(categoryPath, { recursive: true });
    // The final mkdir is exclusive. A retry must not touch an existing work.
    fs.mkdirSync(workPath);
    createdWork = true;
    scenesPath = resolveWithin(workPath, 'scenes');
    fs.mkdirSync(scenesPath);

    // Create meta.yaml with initial metadata
    ensureMeta(workPath, {
      title: flags.title,
      status: 'draft',
      type: workKind === 'novel' ? 'novel' : undefined
    });
    createdFiles.push(resolveWithin(workPath, 'meta.yaml'));

    // Create manuscript.md with schema-compliant frontmatter
    const now = new Date().toISOString();
    const manuscriptContent = generateFrontmatter({
      id: storyId,
      schema_version: 'v1.0.0',
      contract_version: 'v1.0.0',
      type: 'story',
      title: flags.title,
      story_type: workKind === 'short_story' ? 'short-story' : workKind,
      status: 'draft',
      canon_tier: 'draft',
      retrieval_role: 'active_draft',
      tags: [],
      summary_50: '',
      summary_200: '',
      cross_refs: { characters: [], locations: [], factions: [], mechanics: [], stories: [] },
      references: { characters: [], locations: [], factions: [], mechanics: [], stories: [] },
      themes: [],
      metadata: {
        created: now,
        modified: now
      }
    });

    const manuscriptPath = resolveWithin(workPath, 'manuscript.md');
    writeNewFileAtomic(manuscriptPath, manuscriptContent);
    createdFiles.push(manuscriptPath);

    // Create outline.md
    const outlineContent = generateFrontmatter({
      id: `${workId}_OUTLINE`.toLowerCase(),
      title: `${flags.title} - Outline`,
      work_id: workId,
      created: new Date().toISOString(),
      status: 'draft'
    }) + `# Outline for ${flags.title}\n\n## Structure\n\n## Key Scenes\n\n## Themes\n`;

    const outlinePath = resolveWithin(workPath, 'outline.md');
    writeNewFileAtomic(outlinePath, outlineContent);
    createdFiles.push(outlinePath);

    return {
      operation: 'start_work',
      work_id: workId,
      story_id: storyId,
      work_title: flags.title,
      work_kind: workKind,
      work_path: relativePath(workPath),
      files_created: ['meta.yaml', 'manuscript.md', 'outline.md', 'scenes/']
    };
  } catch (error) {
    for (const file of createdFiles.reverse()) {
      try { fs.unlinkSync(file); } catch { /* preserve the original failure */ }
    }
    if (scenesPath) {
      try { fs.rmdirSync(scenesPath); } catch { /* may not have been created */ }
    }
    if (createdWork) {
      try { fs.rmdirSync(workPath); } catch { /* never remove files we did not create */ }
    }
    throw error;
  } finally {
    release();
  }
}

// Save scene operation
async function saveScene() {
  if (!flags.work || !flags.scene || !flags.order) {
    throw new Error('Missing required arguments for save_scene: --work, --scene, --order');
  }

  const sceneOrder = Number(flags.order);
  if (!Number.isSafeInteger(sceneOrder) || sceneOrder < 0) {
    throw new Error('Scene order must be a non-negative integer');
  }
  const { path: workPath } = existingWork();
  const scenesPath = resolveWithin(workPath, 'scenes');
  if (!fs.existsSync(scenesPath) || !fs.statSync(scenesPath).isDirectory()) {
    throw new Error(`Scenes directory not found for work ${flags.work}`);
  }
  const manuscriptPath = resolveWithin(workPath, 'manuscript.md');
  const manuscriptContent = fs.readFileSync(manuscriptPath, 'utf8');
  const frontmatterMatch = manuscriptContent.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) throw new Error('Invalid manuscript format: missing frontmatter');
  const frontmatter = yaml.load(frontmatterMatch[1]);
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error('Invalid manuscript frontmatter');
  }
  if (frontmatter.scenes != null && !Array.isArray(frontmatter.scenes)) {
    throw new Error('Invalid manuscript scenes list');
  }
  preflightMetadata(workPath);

  const bodyContent = await getBodyContent();
  const sceneFileId = makeSceneId(flags.scene, new Date().toISOString());
  const sceneId = sceneFileId.toLowerCase();
  const sceneFile = resolveWithin(scenesPath, `${sceneFileId}.md`);
  const wordCount = bodyContent.trim() ? bodyContent.trim().split(/\s+/).length : 0;

  // Create scene file with frontmatter
  const sceneContent = generateFrontmatter({
    id: sceneId,
    schema_version: 'v1.0.0',
    title: flags.scene,
    work_id: flags.work,
    order: sceneOrder,
    status: 'draft',
    tags: [],
    created: new Date().toISOString(),
    word_count: wordCount
  }) + bodyContent;

  const scenes = [...(frontmatter.scenes || []), {
    id: sceneId,
    title: flags.scene,
    order: sceneOrder,
    file: path.relative(workPath, sceneFile)
  }];
  scenes.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  frontmatter.scenes = scenes;
  const updatedManuscript = generateFrontmatter(frontmatter) + manuscriptContent.slice(frontmatterMatch[0].length);

  fs.writeFileSync(sceneFile, sceneContent, { flag: 'wx' });
  let manuscriptUpdated = false;
  try {
    replaceFileAtomic(manuscriptPath, updatedManuscript);
    manuscriptUpdated = true;
    touchModified(workPath);
  } catch (error) {
    const rollbackErrors = [];
    if (manuscriptUpdated) {
      try { replaceFileAtomic(manuscriptPath, manuscriptContent); } catch (failure) { rollbackErrors.push(failure.message); }
    }
    try { fs.unlinkSync(sceneFile); } catch (failure) { rollbackErrors.push(failure.message); }
    if (rollbackErrors.length) {
      throw new Error(`${error.message}; rollback incomplete: ${rollbackErrors.join('; ')}`);
    }
    throw error;
  }

  return {
    operation: 'save_scene',
    work_id: flags.work,
    scene_id: sceneId,
    scene_title: flags.scene,
    scene_order: sceneOrder,
    scene_file: relativePath(sceneFile),
    word_count: wordCount
  };
}

// Replace scene operation
async function replaceScene() {
  if (!flags.work || !flags.scene) {
    throw new Error('Missing required arguments for replace_scene: --work, --scene');
  }

  const { path: workPath } = existingWork();
  const scenesPath = resolveWithin(workPath, 'scenes');
  preflightMetadata(workPath);
  const bodyContent = await getBodyContent();

  // Find existing scene file
  const sceneFiles = fs.readdirSync(scenesPath).filter(file => file.endsWith('.md') && !/_backup_/i.test(file));
  const sceneFile = sceneFiles.find(file => {
    const content = fs.readFileSync(resolveWithin(scenesPath, file), 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      const frontmatter = yaml.load(frontmatterMatch[1]);
      const wanted = flags.scene.trim().toLowerCase();
      return [frontmatter?.title, frontmatter?.id, path.basename(file, '.md')]
        .some(value => typeof value === 'string' && value.toLowerCase() === wanted);
    }
    return false;
  });

  if (!sceneFile) {
    throw new Error(`Scene "${flags.scene}" not found in work "${flags.work}"`);
  }

  const scenePath = resolveWithin(scenesPath, sceneFile);

  // Read existing frontmatter
  const existingContent = fs.readFileSync(scenePath, 'utf8');
  const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error('Invalid scene format: missing frontmatter');
  }

  const frontmatter = yaml.load(frontmatterMatch[1]);
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error('Invalid scene frontmatter');
  }

  // Keep backups out of the live scenes directory used by indexers.
  const backupDir = resolveWithin(workPath, '.backups', 'scenes');
  const backupPath = resolveWithin(workPath, '.backups', 'scenes', `${path.basename(sceneFile, '.md')}_backup_${crypto.randomUUID()}.md`);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(backupPath, existingContent, { flag: 'wx' });

  // Update word count
  const wordCount = bodyContent.trim() ? bodyContent.trim().split(/\s+/).length : 0;
  frontmatter.word_count = wordCount;
  frontmatter.updated = new Date().toISOString();

  // Write new content with preserved frontmatter
  const newContent = generateFrontmatter(frontmatter) + bodyContent;
  replaceFileAtomic(scenePath, newContent);

  // Update modified timestamp in meta.yaml
  touchModified(workPath);

  return {
    operation: 'replace_scene',
    work_id: flags.work,
    scene_id: frontmatter.id,
    scene_title: flags.scene,
    backup_file: relativePath(backupPath),
    updated_file: relativePath(scenePath),
    word_count: wordCount
  };
}

// Save notes operation
async function saveNotes() {
  if (!flags.notes) {
    throw new Error('Missing required argument for save_notes: --notes');
  }

  const bodyContent = await getBodyContent();
  const notesSlug = slugify(flags.notes);
  if (!notesSlug) throw new Error('Notes title must contain letters or numbers');
  const notesFileId = validatePathSegment(`NOTES_${notesSlug}_${crypto.randomUUID()}`, 'notes ID');
  const notesId = notesFileId.toLowerCase();
  const notesDir = resolveWithin(REPO_ROOT, 'lore', 'notes');
  const notesPath = resolveWithin(REPO_ROOT, 'lore', 'notes', `${notesFileId}.md`);

  // Create notes file with frontmatter
  const notesContent = generateFrontmatter({
    id: notesId,
    title: flags.notes,
    type: 'notes',
    status: 'draft',
    created: new Date().toISOString(),
    word_count: bodyContent.split(/\s+/).length
  }) + bodyContent;

  // Ensure notes directory exists
  fs.mkdirSync(notesDir, { recursive: true });

  fs.writeFileSync(notesPath, notesContent, { flag: 'wx' });

  return {
    operation: 'save_notes',
    notes_id: notesId,
    notes_title: flags.notes,
    notes_file: relativePath(notesPath),
    word_count: bodyContent.split(/\s+/).length
  };
}

// Update outline operation
async function updateOutline() {
  if (!flags.work || !flags.outline) {
    throw new Error('Missing required arguments for update_outline: --work, --outline');
  }

  const { path: workPath } = existingWork();
  const outlinePath = resolveWithin(workPath, 'outline.md');
  const outlineSlug = slugify(flags.work);
  if (!outlineSlug) throw new Error('Work ID must contain letters or numbers to create an outline ID');
  const outlineId = `${outlineSlug}_OUTLINE`.toLowerCase();
  preflightMetadata(workPath);

  // Read outline content from stdin or file
  const outlineContent = await getBodyContent();

  // Create or update outline file
  let finalContent;
  if (fs.existsSync(outlinePath)) {
    // Preserve existing frontmatter if it exists
    const existingContent = fs.readFileSync(outlinePath, 'utf8');
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n/);

    if (frontmatterMatch) {
      const frontmatter = yaml.load(frontmatterMatch[1]);
      frontmatter.updated = new Date().toISOString();
      finalContent = generateFrontmatter(frontmatter) + outlineContent;
    } else {
      finalContent = generateFrontmatter({
        id: outlineId,
        title: `${flags.work} - Outline`,
        work_id: flags.work,
        created: new Date().toISOString(),
        status: 'draft'
      }) + outlineContent;
    }
  } else {
    finalContent = generateFrontmatter({
      id: outlineId,
      title: `${flags.work} - Outline`,
      work_id: flags.work,
      created: new Date().toISOString(),
      status: 'draft'
    }) + outlineContent;
  }

  replaceFileAtomic(outlinePath, finalContent);

  // Update modified timestamp in meta.yaml
  touchModified(workPath);

  return {
    operation: 'update_outline',
    work_id: flags.work,
    outline_file: relativePath(outlinePath),
    word_count: outlineContent.split(/\s+/).length
  };
}

// Main execution
async function main() {
  try {
    // Determine operation based on intent
    let result;
    switch (flags.intent) {
      case 'start_work':
        result = await startWork();
        break;
      case 'save_scene':
        result = await saveScene();
        break;
      case 'replace_scene':
        result = await replaceScene();
        break;
      case 'save_notes':
        result = await saveNotes();
        break;
      case 'update_outline':
        result = await updateOutline();
        break;
      default:
        throw new Error(`Unknown intent: ${flags.intent}`);
    }

    // Emit JSON summary to stdout
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
main();
