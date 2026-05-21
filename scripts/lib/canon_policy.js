const path = require('path');

const CANON_TIERS = [
  'primary_canon',
  'working_canon',
  'draft',
  'speculative',
  'sandbox',
  'test',
  'deprecated'
];

const TIER_WEIGHTS = {
  primary_canon: 100,
  working_canon: 85,
  draft: 55,
  speculative: 45,
  sandbox: 20,
  test: 10,
  deprecated: 0
};

const RETRIEVAL_ROLES = {
  primary_canon: 'authoritative',
  working_canon: 'working_reference',
  draft: 'active_draft',
  speculative: 'exploratory',
  sandbox: 'sandbox',
  test: 'test_fixture',
  deprecated: 'deprecated'
};

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function explicitCanonTier(meta = {}) {
  const tier = meta.canon_tier || meta.metadata?.canon_tier;
  if (CANON_TIERS.includes(tier)) return tier;
  return null;
}

function inferCanonTier(meta = {}, filePath = '') {
  const explicit = explicitCanonTier(meta);
  if (explicit) return explicit;

  const rel = normalizePath(filePath).toLowerCase();
  const status = String(meta.status || meta.metadata?.status || '').toLowerCase();

  if (status === 'deprecated') return 'deprecated';
  if (status === 'speculative') return 'speculative';
  if (status === 'sandbox' || rel.startsWith('sandbox/')) return 'sandbox';
  if (/_backup_/i.test(rel) || /\btest\b/i.test(rel) || rel.includes('_test') || rel.includes('test_') || rel.includes('sample')) return 'test';
  if (rel.includes('/lore/ideas/') || rel.startsWith('lore/ideas/') || rel.includes('/docs/session/') || rel.startsWith('docs/session/')) return 'test';
  if (rel.startsWith('archive/')) return 'deprecated';
  if (rel === 'stories/short_story/the_archivists_wake/manuscript.md' || rel === 'the_archivists_wake.md' || rel.startsWith('bible/') || rel.startsWith('mechanics/') || rel.startsWith('characters/') || rel.startsWith('atlas/') || rel.startsWith('factions/') || rel.startsWith('data/lexicon/')) {
    return 'primary_canon';
  }
  if (rel.startsWith('lore/') || rel.startsWith('manuals/')) return 'working_canon';
  if (rel.startsWith('stories/')) return 'draft';
  if (status === 'draft' || status === 'revised') return 'draft';
  if (status === 'canonical') return 'working_canon';
  return 'working_canon';
}

function hasRefs(meta = {}) {
  const refs = [meta.cross_refs, meta.references, meta.entities].filter(Boolean);
  return refs.some(value => JSON.stringify(value) !== '{}');
}

function sourceWeight(meta = {}, filePath = '', entityType = '') {
  const tier = inferCanonTier(meta, filePath);
  let weight = TIER_WEIGHTS[tier] ?? 40;
  const type = String(entityType || meta.type || '').toLowerCase();

  if (meta.summary_50 || meta.summary_200 || meta.summary || meta.definition) weight += 5;
  if (hasRefs(meta)) weight += 5;
  if (['mechanics', 'mechanics_rule', 'character', 'location', 'faction', 'term'].includes(type)) weight += 5;
  if (normalizePath(filePath).toLowerCase().includes('/scenes/')) weight -= 5;

  return Math.max(0, Math.min(110, weight));
}

function retrievalRole(canonTier) {
  return RETRIEVAL_ROLES[canonTier] || 'working_reference';
}

function describePolicy(meta = {}, filePath = '', entityType = '') {
  const canon_tier = inferCanonTier(meta, filePath);
  const source_weight = sourceWeight(meta, filePath, entityType);
  return {
    canon_tier,
    source_weight,
    retrieval_role: retrievalRole(canon_tier)
  };
}

function shouldInclude(policy = {}, options = {}) {
  const tier = policy.canon_tier || 'working_canon';
  if (tier === 'deprecated') return false;
  if (options.canonOnly && !['primary_canon', 'working_canon'].includes(tier)) return false;
  if (tier === 'sandbox' && !options.includeSandbox) return false;
  if (tier === 'test' && !options.includeTest) return false;
  if (tier === 'draft' && options.canonOnly && !options.includeDrafts) return false;
  return true;
}

function provenanceNote(policy = {}) {
  const role = policy.retrieval_role || retrievalRole(policy.canon_tier);
  return `${role}; tier=${policy.canon_tier}; weight=${policy.source_weight}`;
}

module.exports = {
  CANON_TIERS,
  inferCanonTier,
  sourceWeight,
  retrievalRole,
  describePolicy,
  shouldInclude,
  provenanceNote,
  normalizePath
};
