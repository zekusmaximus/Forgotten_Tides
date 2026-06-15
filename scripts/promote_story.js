#!/usr/bin/env node

/**
 * promote_story.js
 *
 * Promote a short story from draft/working_canon to primary_canon.
 *
 * Usage:
 *   node scripts/promote_story.js --id story-0007
 *   node scripts/promote_story.js --id story-0007 --tier primary_canon
 *
 * After running:
 *   - Updates the story's frontmatter (canon_tier + status)
 *   - Rebuilds linkmap artifacts
 *   - Prints next steps (commit + validate)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const STORIES_DIR = path.join(ROOT, 'stories', 'short_story');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      out.id = args[i + 1];
      i++;
    } else if (args[i] === '--tier' && args[i + 1]) {
      out.tier = args[i + 1];
      i++;
    }
  }
  if (!out.id) {
    console.error('Usage: node scripts/promote_story.js --id story-#### [--tier primary_canon]');
    process.exit(1);
  }
  out.tier = out.tier || 'primary_canon';
  return out;
}

function findManuscriptById(id) {
  // Walk short_story tree and look for matching id in frontmatter
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        const hit = scan(full);
        if (hit) return hit;
      } else if (entry.toLowerCase() === 'manuscript.md') {
        try {
          const raw = fs.readFileSync(full, 'utf8');
          const fm = matter(raw);
          if (fm.data && fm.data.id === id) {
            return full;
          }
        } catch (_) {}
      }
    }
    return null;
  };
  return scan(STORIES_DIR);
}

function updateFrontmatter(filePath, newTier) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fm = matter(raw);
  const data = fm.data || {};

  const previousTier = data.canon_tier || '(none)';
  data.canon_tier = newTier;

  // If it was draft, also lift status to canonical (common pattern)
  if (data.status === 'draft' || !data.status) {
    data.status = 'canonical';
  }

  const updated = matter.stringify(fm.content, data, { lineWidth: -1 });
  fs.writeFileSync(filePath, updated, 'utf8');

  return { previousTier, newTier, status: data.status };
}

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
}

function main() {
  const { id, tier } = parseArgs();

  const manuscript = findManuscriptById(id);
  if (!manuscript) {
    console.error(`❌ Could not find manuscript for ${id} under stories/short_story`);
    process.exit(1);
  }

  console.log(`📖 Found ${id} at ${path.relative(ROOT, manuscript)}`);

  const result = updateFrontmatter(manuscript, tier);
  console.log(`✅ Updated frontmatter: canon_tier ${result.previousTier} → ${result.newTier} (status=${result.status})`);

  console.log('🔗 Rebuilding canon artifacts...');
  run('npm', ['run', 'linkmap:build']);

  console.log('\nPromotion complete.');
  console.log('Next steps:');
  console.log('  1. Review the diff on the manuscript and generated files (CANONICAL_INDEX.md, REFERENCE_MAP.json, docs/link_map/LINK_MAP.md)');
  console.log('  2. Run: npm run validate:ci');
  console.log('  3. Commit with a canon: message, e.g.:');
  console.log(`     canon(story): promote ${id} to primary_canon`);
}

main();
