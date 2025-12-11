#!/usr/bin/env node
// scripts/prompt/scene_autotag.js
// Auto-tag scene files with entity references from context, pack, lexicon, and body content

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

function getLatestFile(dir, pattern) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith(pattern))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    return files.length ? path.join(dir, files[0].f) : null;
  } catch (e) {
    return null;
  }
}

function loadJsonFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn(`Warning: Could not load JSON file ${filePath}: ${e.message}`);
  }
  return null;
}

function loadYamlFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn(`Warning: Could not load YAML file ${filePath}: ${e.message}`);
  }
  return null;
}

function extractIdsFromBody(body) {
  const regex = /\b(?:CHAR|LOC|FAC|RULE|mech)-[A-Z0-9\-]+\b/gi;
  const matches = body.match(regex) || [];
  return [...new Set(matches.map(id => id.toUpperCase()))];
}

function rankAndFilterEntities(candidates, bodyIds) {
  const ranked = {
    characters: [],
    locations: [],
    factions: [],
    rules_used: []
  };

  // Create a set of body IDs for quick lookup
  const bodyIdSet = new Set(bodyIds);

  // Process candidates by priority
  for (const id of candidates) {
    // Skip if already in body (they'll be added first)
    if (bodyIdSet.has(id)) continue;

    if (id.startsWith('CHAR-')) {
      ranked.characters.push(id);
    } else if (id.startsWith('LOC-')) {
      ranked.locations.push(id);
    } else if (id.startsWith('FAC-')) {
      ranked.factions.push(id);
    } else if (id.startsWith('RULE-') || id.startsWith('mech-')) {
      ranked.rules_used.push(id);
    }
  }

  // Add body IDs first (highest priority)
  for (const id of bodyIds) {
    if (id.startsWith('CHAR-')) {
      ranked.characters.unshift(id);
    } else if (id.startsWith('LOC-')) {
      ranked.locations.unshift(id);
    } else if (id.startsWith('FAC-')) {
      ranked.factions.unshift(id);
    } else if (id.startsWith('RULE-') || id.startsWith('mech-')) {
      ranked.rules_used.unshift(id);
    }
  }

  // Deduplicate and sort each category
  for (const category in ranked) {
    ranked[category] = [...new Set(ranked[category])].sort();
    // Cap at 8 entities per category
    if (ranked[category].length > 8) {
      ranked[category] = ranked[category].slice(0, 8);
    }
  }

  return ranked;
}

function autotagScene(scenePath, packPath, contextPath) {
  try {
    // Load scene file
    const sceneContent = fs.readFileSync(scenePath, 'utf8');
    const { data: frontmatter, content: body } = matter(sceneContent);

    // Collect candidates from different sources
    const candidates = new Set();

    // 1. From context JSON order list
    if (contextPath) {
      const contextData = loadJsonFile(contextPath);
      if (contextData?.order) {
        contextData.order.forEach(id => candidates.add(id));
      }
    }

    // 2. From pack JSON entries
    if (packPath) {
      const packData = loadJsonFile(packPath);
      if (packData?.entries) {
        packData.entries.forEach(entry => {
          if (entry.id) candidates.add(entry.id);
        });
      }
    }

    // 3. From lexicon terms
    const lexiconPath = 'data/lexicon/terms.yaml';
    const lexiconData = loadYamlFile(lexiconPath);
    if (lexiconData?.terms) {
      lexiconData.terms.forEach(term => {
        if (term.id) candidates.add(term.id);
      });
    }

    // 4. From body content (highest priority)
    const bodyIds = extractIdsFromBody(body);

    // Rank and filter entities
    const entities = rankAndFilterEntities([...candidates], bodyIds);

    // Update frontmatter
    frontmatter.entities = entities;

    // Write back only frontmatter (preserve original body)
    const newContent = matter.stringify(body, frontmatter);

    // Write to file
    fs.writeFileSync(scenePath, newContent);

    console.log(`Successfully auto-tagged scene: ${scenePath}`);
    return true;
  } catch (error) {
    console.error(`Error auto-tagging scene: ${error.message}`);
    return false;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
scene_autotag.js - Auto-tag scene files with entity references

Usage:
  node scripts/prompt/scene_autotag.js <scene-file> [--pack <pack.json>] [--context <context.json>]

Arguments:
  <scene-file>          Path to the scene file to auto-tag

Options:
  --pack <pack.json>     Path to prompt pack JSON file (default: latest in out/prompts)
  --context <context.json> Path to context JSON file (default: latest in out/prompts)
  --help, -h            Show this help message

Examples:
  node scripts/prompt/scene_autotag.js stories/novella/MY_STORY/scenes/SCENE_123.md
  node scripts/prompt/scene_autotag.js scene.md --pack out/prompts/my_pack.json --context out/prompts/my_context.json
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  let scenePath = args[0];
  let packPath = null;
  let contextPath = null;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pack' && args[i + 1] && !args[i + 1].startsWith('--')) {
      packPath = args[i + 1];
      i++;
    } else if (arg === '--context' && args[i + 1] && !args[i + 1].startsWith('--')) {
      contextPath = args[i + 1];
      i++;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  // Set defaults if not provided
  if (!packPath) {
    packPath = getLatestFile('out/prompts', '_pack.json');
  }

  if (!contextPath) {
    contextPath = getLatestFile('out/prompts', '_context.json');
  }

  return { scenePath, packPath, contextPath };
}

if (require.main === module) {
  const { scenePath, packPath, contextPath } = parseArgs();

  // Validate scene path
  if (!fs.existsSync(scenePath)) {
    console.error(`Error: Scene file not found: ${scenePath}`);
    process.exit(1);
  }

  // Run autotagging
  const success = autotagScene(scenePath, packPath, contextPath);
  process.exit(success ? 0 : 1);
}

// Export for programmatic use
module.exports = { autotagScene };