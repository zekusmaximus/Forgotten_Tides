#!/usr/bin/env node

/**
 * Authoring script for Forgotten Tides
 * Handles story authoring, scene management, and content persistence
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { makeSceneId, makeWorkId, slugify } = require('../lib/idgen');
const yaml = require('js-yaml');

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

// Create work directory structure
function createWorkDirectory(workId, workTitle, workKind) {
  const workPath = path.join('stories', workKind, workId);
  if (!fs.existsSync(workPath)) {
    fs.mkdirSync(workPath, { recursive: true });
  }

  // Create scenes directory
  const scenesPath = path.join(workPath, 'scenes');
  if (!fs.existsSync(scenesPath)) {
    fs.mkdirSync(scenesPath);
  }

  return workPath;
}

// Start work operation
async function startWork() {
  if (!flags.work || !flags.kind || !flags.title) {
    throw new Error('Missing required arguments for start_work: --work, --kind, --title');
  }

  const workId = makeWorkId(flags.kind, flags.title);
  const workPath = createWorkDirectory(workId, flags.title, flags.kind);

  // Create manuscript.md
  const manuscriptContent = generateFrontmatter({
    id: workId,
    title: flags.title,
    kind: flags.kind,
    status: 'draft',
    created: new Date().toISOString(),
    scenes: []
  });

  fs.writeFileSync(path.join(workPath, 'manuscript.md'), manuscriptContent);

  // Create outline.md
  const outlineContent = generateFrontmatter({
    id: `${workId}_OUTLINE`,
    title: `${flags.title} - Outline`,
    work_id: workId,
    created: new Date().toISOString(),
    status: 'draft'
  }) + `# Outline for ${flags.title}\n\n## Structure\n\n## Key Scenes\n\n## Themes\n`;

  fs.writeFileSync(path.join(workPath, 'outline.md'), outlineContent);

  return {
    operation: 'start_work',
    work_id: workId,
    work_title: flags.title,
    work_kind: flags.kind,
    work_path: workPath,
    files_created: ['manuscript.md', 'outline.md', 'scenes/']
  };
}

// Save scene operation
async function saveScene() {
  if (!flags.work || !flags.scene || !flags.order) {
    throw new Error('Missing required arguments for save_scene: --work, --scene, --order');
  }

  const bodyContent = await getBodyContent();
  const sceneId = makeSceneId(flags.scene, new Date().toISOString());
  const workPath = path.join('stories', flags.kind || 'novels', flags.work);
  const scenesPath = path.join(workPath, 'scenes');
  const sceneFile = path.join(scenesPath, `${sceneId}.md`);

  // Create scene file with frontmatter
  const sceneContent = generateFrontmatter({
    id: sceneId,
    title: flags.scene,
    work_id: flags.work,
    order: parseInt(flags.order),
    status: 'draft',
    created: new Date().toISOString(),
    word_count: bodyContent.split(/\s+/).length
  }) + bodyContent;

  fs.writeFileSync(sceneFile, sceneContent);

  // Update manuscript includes
  const manuscriptPath = path.join(workPath, 'manuscript.md');
  let manuscriptContent = fs.readFileSync(manuscriptPath, 'utf8');

  // Parse frontmatter
  const frontmatterMatch = manuscriptContent.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontmatterMatch) {
    const frontmatter = yaml.load(frontmatterMatch[1]);
    const scenes = frontmatter.scenes || [];

    // Add new scene to scenes array
    scenes.push({
      id: sceneId,
      title: flags.scene,
      order: parseInt(flags.order),
      file: path.relative(workPath, sceneFile)
    });

    // Sort scenes by order
    scenes.sort((a, b) => a.order - b.order);

    // Update frontmatter
    frontmatter.scenes = scenes;
    const newFrontmatter = generateFrontmatter(frontmatter);

    // Replace frontmatter in manuscript
    manuscriptContent = manuscriptContent.replace(frontmatterMatch[0], newFrontmatter);
    fs.writeFileSync(manuscriptPath, manuscriptContent);
  }

  return {
    operation: 'save_scene',
    work_id: flags.work,
    scene_id: sceneId,
    scene_title: flags.scene,
    scene_order: parseInt(flags.order),
    scene_file: sceneFile,
    word_count: bodyContent.split(/\s+/).length
  };
}

// Replace scene operation
async function replaceScene() {
  if (!flags.work || !flags.scene) {
    throw new Error('Missing required arguments for replace_scene: --work, --scene');
  }

  const bodyContent = await getBodyContent();
  const workPath = path.join('stories', flags.kind || 'novels', flags.work);
  const scenesPath = path.join(workPath, 'scenes');

  // Find existing scene file
  const sceneFiles = fs.readdirSync(scenesPath);
  const sceneFile = sceneFiles.find(file => {
    const content = fs.readFileSync(path.join(scenesPath, file), 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      const frontmatter = yaml.load(frontmatterMatch[1]);
      return frontmatter.title === flags.scene;
    }
    return false;
  });

  if (!sceneFile) {
    throw new Error(`Scene "${flags.scene}" not found in work "${flags.work}"`);
  }

  const scenePath = path.join(scenesPath, sceneFile);

  // Backup existing scene
  const backupPath = path.join(scenesPath, `${path.basename(sceneFile, '.md')}_backup_${Date.now()}.md`);
  fs.copyFileSync(scenePath, backupPath);

  // Read existing frontmatter
  const existingContent = fs.readFileSync(scenePath, 'utf8');
  const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error('Invalid scene format: missing frontmatter');
  }

  const frontmatter = yaml.load(frontmatterMatch[1]);

  // Update word count
  frontmatter.word_count = bodyContent.split(/\s+/).length;
  frontmatter.updated = new Date().toISOString();

  // Write new content with preserved frontmatter
  const newContent = generateFrontmatter(frontmatter) + bodyContent;
  fs.writeFileSync(scenePath, newContent);

  return {
    operation: 'replace_scene',
    work_id: flags.work,
    scene_id: frontmatter.id,
    scene_title: flags.scene,
    backup_file: backupPath,
    updated_file: scenePath,
    word_count: bodyContent.split(/\s+/).length
  };
}

// Save notes operation
async function saveNotes() {
  if (!flags.notes) {
    throw new Error('Missing required argument for save_notes: --notes');
  }

  const bodyContent = await getBodyContent();
  const notesId = `NOTES_${slugify(flags.notes)}_${Date.now()}`;
  const notesPath = path.join('lore', 'notes', `${notesId}.md`);

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
  if (!fs.existsSync(path.join('lore', 'notes'))) {
    fs.mkdirSync(path.join('lore', 'notes'), { recursive: true });
  }

  fs.writeFileSync(notesPath, notesContent);

  return {
    operation: 'save_notes',
    notes_id: notesId,
    notes_title: flags.notes,
    notes_file: notesPath,
    word_count: bodyContent.split(/\s+/).length
  };
}

// Update outline operation
async function updateOutline() {
  if (!flags.work || !flags.outline) {
    throw new Error('Missing required arguments for update_outline: --work, --outline');
  }

  const workPath = path.join('stories', flags.kind || 'novels', flags.work);
  const outlinePath = path.join(workPath, 'outline.md');

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
        id: `${flags.work}_OUTLINE`,
        title: `${flags.work} - Outline`,
        work_id: flags.work,
        created: new Date().toISOString(),
        status: 'draft'
      }) + outlineContent;
    }
  } else {
    finalContent = generateFrontmatter({
      id: `${flags.work}_OUTLINE`,
      title: `${flags.work} - Outline`,
      work_id: flags.work,
      created: new Date().toISOString(),
      status: 'draft'
    }) + outlineContent;
  }

  fs.writeFileSync(outlinePath, finalContent);

  return {
    operation: 'update_outline',
    work_id: flags.work,
    outline_file: outlinePath,
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