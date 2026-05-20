#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const warnOnly = !process.argv.includes('--strict');

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

  // Index every directory that can supply canonical entities. Without this,
  // characters reference fact-/mech-/loc- IDs that the script never learns about.
  const entityDirs = ['factions', 'mechanics', 'atlas', 'lore', 'manuals', 'data'];
  entityDirs.forEach(dir => {
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
    } else if ((file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) && !/_backup_/.test(file)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^---\s*([\s\S]*?)\s*---/);
        if (match) {
          const data = yaml.load(match[1]);
          if (data.id) {
            // Type comes from the ID prefix, not data.type — `data.type + 's'`
            // mis-pluralizes already-plural types like "mechanics".
            let type;
            if (data.id.startsWith('char-')) type = 'characters';
            else if (data.id.startsWith('loc-')) type = 'locations';
            else if (data.id.startsWith('fact-')) type = 'factions';
            else if (data.id.startsWith('mech-')) type = 'mechanics';
            else if (data.id.startsWith('story-')) type = 'stories';

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
              const msg = `${filePath}: Unresolved reference to ${id} in cross_refs.${type}`;
              warnOnly ? console.warn(`⚠️  ${msg}`) : console.error(`❌ ${msg}`);
              hasErrors = hasErrors || !warnOnly;
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
              if (ref.startsWith('char-')) type = 'characters';
              else if (ref.startsWith('loc-')) type = 'locations';
              else if (ref.startsWith('fact-')) type = 'factions';
              else if (ref.startsWith('mech-')) type = 'mechanics';
              else if (ref.startsWith('story-')) type = 'stories';

              if (type && (!index[type] || !index[type].has(ref))) {
                const msg = `${filePath}: Unresolved reference to ${ref} in ${field}`;
                warnOnly ? console.warn(`⚠️  ${msg}`) : console.error(`❌ ${msg}`);
                hasErrors = hasErrors || !warnOnly;
              }
            } else if (typeof ref === 'object' && ref.target_id) {
              // Handle relationships with target_id
              const targetId = ref.target_id;
              let type;
              if (targetId.startsWith('char-')) type = 'characters';
              else if (targetId.startsWith('loc-')) type = 'locations';
              else if (targetId.startsWith('fact-')) type = 'factions';
              else if (targetId.startsWith('mech-')) type = 'mechanics';
              else if (targetId.startsWith('story-')) type = 'stories';

              if (type && (!index[type] || !index[type].has(targetId))) {
                const msg = `${filePath}: Unresolved reference to ${targetId} in ${field}.target_id`;
                warnOnly ? console.warn(`⚠️  ${msg}`) : console.error(`❌ ${msg}`);
                hasErrors = hasErrors || !warnOnly;
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
    process.exit(warnOnly ? 0 : 1);
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
    } else if ((file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) && !/_backup_/.test(file)) {
      checkReferences(filePath, index);
    }
  });
}

main();
