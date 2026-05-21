#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const { glob } = require('glob');
const { describePolicy, explicitCanonTier, normalizePath } = (() => {
  const policy = require('../lib/canon_policy');
  return {
    ...policy,
    explicitCanonTier: meta => {
      const tier = meta.canon_tier || meta.metadata?.canon_tier;
      return policy.CANON_TIERS.includes(tier) ? tier : null;
    }
  };
})();

const ROOTS = ['characters', 'factions', 'atlas', 'mechanics', 'stories', 'lore', 'manuals', 'bible', 'data'];

function readMeta(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.load(raw) || {};
  }
  return matter(raw).data || {};
}

function main() {
  const rows = [];
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    const files = glob.sync('**/*.{md,yaml,yml}', { cwd: root, nodir: true })
      .filter(file => !/readme\.md$/i.test(file) && !/_backup_/i.test(file));
    for (const file of files) {
      const rel = normalizePath(path.join(root, file));
      let meta = {};
      try {
        meta = readMeta(rel);
      } catch (error) {
        rows.push({ path: rel, parse_error: error.message });
        continue;
      }
      if (!meta.id && !rel.endsWith('data/lexicon/terms.yaml')) continue;
      const policy = describePolicy(meta, rel, meta.type || '');
      rows.push({
        path: rel,
        id: meta.id || null,
        explicit_canon_tier: explicitCanonTier(meta),
        inferred_canon_tier: policy.canon_tier,
        source_weight: policy.source_weight,
        retrieval_role: policy.retrieval_role
      });
    }
  }

  fs.mkdirSync('out/reports', { recursive: true });
  fs.writeFileSync('out/reports/canon_tier_report.json', JSON.stringify({ generated_at: new Date().toISOString(), files: rows }, null, 2));
  const missing = rows.filter(row => !row.explicit_canon_tier && !row.parse_error);
  const md = [
    '# Canon Tier Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Files reviewed: ${rows.length}`,
    `Missing explicit canon_tier: ${missing.length}`,
    '',
    '## Missing Explicit Tier',
    '',
    missing.length ? missing.map(row => `- \`${row.path}\` -> inferred \`${row.inferred_canon_tier}\` (${row.retrieval_role}, weight ${row.source_weight})`).join('\n') : '_none_',
    ''
  ].join('\n');
  fs.writeFileSync('out/reports/canon_tier_report.md', md);
  console.log(`Canon tier report wrote ${rows.length} rows; ${missing.length} missing explicit canon_tier.`);
}

main();
