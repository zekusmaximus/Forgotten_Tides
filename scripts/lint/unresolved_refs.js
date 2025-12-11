#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Build in-memory index of all IDs by type
function buildIdIndex() {
  const index = {
    characters: new Set(),
    locations: new Set(),
    factions: new Set(),
    mechanics: new Set(),
    stories: new Set()
  };

  // Add characters
  const charsDir = path.join(__dirname, '../../characters');
  if (fs.existsSync(charsDir)) {
    const charFiles = fs.readdirSync(charsDir);
    charFiles.forEach(file => {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(charsDir, file), 'utf8');
        const match = content.match(/^---\s*([\s\S]*?)\s*---/);
        if (match) {
          try {
            const data = yaml.load(match[1]);
            if (data.id) {
              index.characters.add(data.id);
            }
          } catch (e) {
            console.warn(`⚠️  Could not parse ${file}: ${e.message}`);
          }
        }
      }
    });
  }

  // Add stories
  const storiesDir = path.join(__dirname, '../../stories');
  if (fs.existsSync(storiesDir)) {
    const storyFiles = fs.readdirSync(storiesDir);
    storyFiles.forEach(file => {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(storiesDir, file), 'utf8');
        const match = content.match(/^---\s*([\s\S]*?)\s*---/);
        if (match) {
          try {
            const data = yaml.load(match[1]);
            if (data.id) {
              index.stories.add(data.id);
            }
          } catch (e) {
            console.warn(`⚠️  Could not parse ${file}: ${e.message}`);
          }
        }
      }
    });
  }

  // Add data files if they exist
  const dataDirs = ['data'];
  dataDirs.forEach(dir => {
    const fullPath = path.join(__dirname, `../../${dir}`);
    if (fs.existsSync(fullPath)) {
      walkDataDir(fullPath, index);
    }
  });

  return index;
}

function walkDataDir(dir, index) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDataDir(filePath, index);
    } else if (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^---\s*([\s\S]*?)\s*---/);
        if (match) {
          const data = yaml.load(match[1]);
          if (data.id) {
            // Determine type from ID pattern or type field
            let type;
            if (data.type) {
              type = data.type + 's'; // pluralize
            } else if (data.id.startsWith('CHAR-')) {
              type = 'characters';
            } else if (data.id.startsWith('LOC-')) {
              type = 'locations';
            } else if (data.id.startsWith('FACT-')) {
              type = 'factions';
            } else if (data.id.startsWith('MECH-')) {
              type = 'mechanics';
            } else if (data.id.startsWith('STORY-')) {
              type = 'stories';
            }

            if (type && index[type]) {
              index[type].add(data.id);
            }
          }
        }
      } catch (e) {
        console.warn(`⚠️  Could not parse ${filePath}: ${e.message}`);
      }
    }
  });
}

// Check references in a file
function checkReferences(filePath, index) {
  let hasErrors = false;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) {
      return false;
    }

    const yamlContent = match[1];
    const data = yaml.load(yamlContent);

    // Check cross_refs
    if (data.cross_refs) {
      for (const [type, ids] of Object.entries(data.cross_refs)) {
        if (Array.isArray(ids)) {
          for (const id of ids) {
            if (!index[type] || !index[type].has(id)) {
              console.error(`❌ ${filePath}: Unresolved reference to ${id} in cross_refs.${type}`);
              hasErrors = true;
            }
          }
        }
      }
    }

    // Check other reference fields that might contain IDs
    const referenceFields = ['appears_in', 'rules_used', 'relationships'];
    referenceFields.forEach(field => {
      if (data[field]) {
        if (Array.isArray(data[field])) {
          data[field].forEach(ref => {
            if (typeof ref === 'string') {
              // Try to determine type from ID pattern
              let type;
              if (ref.startsWith('CHAR-')) type = 'characters';
              else if (ref.startsWith('LOC-')) type = 'locations';
              else if (ref.startsWith('FACT-')) type = 'factions';
              else if (ref.startsWith('MECH-')) type = 'mechanics';
              else if (ref.startsWith('STORY-')) type = 'stories';

              if (type && (!index[type] || !index[type].has(ref))) {
                console.error(`❌ ${filePath}: Unresolved reference to ${ref} in ${field}`);
                hasErrors = true;
              }
            } else if (typeof ref === 'object' && ref.target_id) {
              // Handle relationships with target_id
              const targetId = ref.target_id;
              let type;
              if (targetId.startsWith('CHAR-')) type = 'characters';
              else if (targetId.startsWith('LOC-')) type = 'locations';
              else if (targetId.startsWith('FACT-')) type = 'factions';
              else if (targetId.startsWith('MECH-')) type = 'mechanics';
              else if (targetId.startsWith('STORY-')) type = 'stories';

              if (type && (!index[type] || !index[type].has(targetId))) {
                console.error(`❌ ${filePath}: Unresolved reference to ${targetId} in ${field}.target_id`);
                hasErrors = true;
              }
            }
          });
        }
      }
    });

    return hasErrors;
  } catch (error) {
    console.error(`❌ Error checking references in ${filePath}: ${error.message}`);
    return true;
  }
}

// Main execution
function main() {
  console.log('🔍 Checking for unresolved references...');

  const index = buildIdIndex();
  let hasErrors = false;

  // Check characters
  const charsDir = path.join(__dirname, '../../characters');
  if (fs.existsSync(charsDir)) {
    const charFiles = fs.readdirSync(charsDir);
    charFiles.forEach(file => {
      if (file.endsWith('.md')) {
        const filePath = path.join(charsDir, file);
        if (checkReferences(filePath, index)) {
          hasErrors = true;
        }
      }
    });
  }

  // Check stories
  const storiesDir = path.join(__dirname, '../../stories');
  if (fs.existsSync(storiesDir)) {
    const storyFiles = fs.readdirSync(storiesDir);
    storyFiles.forEach(file => {
      if (file.endsWith('.md')) {
        const filePath = path.join(storiesDir, file);
        if (checkReferences(filePath, index)) {
          hasErrors = true;
        }
      }
    });
  }

  // Check data directories
  const dataDirs = ['data'];
  dataDirs.forEach(dir => {
    const fullPath = path.join(__dirname, `../../${dir}`);
    if (fs.existsSync(fullPath)) {
      walkDataDirForRefs(fullPath, index);
    }
  });

  if (hasErrors) {
    console.error('❌ Found unresolved references');
    process.exit(1);
  } else {
    console.log('✅ All references resolved');
    process.exit(0);
  }
}

function walkDataDirForRefs(dir, index) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDataDirForRefs(filePath, index);
    } else if (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      checkReferences(filePath, index);
    }
  });
}

main();