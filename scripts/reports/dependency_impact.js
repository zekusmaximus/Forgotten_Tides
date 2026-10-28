#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.join(__dirname, '../..');
const MAP_NAME = 'REFERENCE_MAP.json';
const CAUSAL_FIELDS = new Set(['references', 'source']);

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, id: null, json: false, includeMentions: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--id' && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      options.id = argv[++i].trim().toLowerCase();
    } else if (arg === '--root' && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      options.root = path.resolve(argv[++i]);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--include-mentions') {
      options.includeMentions = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  if (!options.help && !options.id) throw new Error('Missing --id <canonical-id>');
  return options;
}

function loadReferenceMap(root = DEFAULT_ROOT) {
  const mapPath = path.join(root, MAP_NAME);
  if (!fs.existsSync(mapPath)) {
    throw new Error(`${MAP_NAME} is missing under ${root}; run npm run linkmap:build first.`);
  }
  let map;
  try {
    map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse ${mapPath}: ${error.message}`);
  }
  if (!map || !Array.isArray(map.nodes) || !Array.isArray(map.edges)) {
    throw new Error(`Invalid ${MAP_NAME}: expected nodes and edges arrays; run npm run linkmap:build.`);
  }
  const ids = new Set();
  for (const node of map.nodes) {
    if (!node || typeof node.canonical_id !== 'string' || ids.has(node.canonical_id)) {
      throw new Error(`Invalid ${MAP_NAME}: missing or duplicate node ID; run npm run linkmap:build.`);
    }
    ids.add(node.canonical_id);
  }
  for (const edge of map.edges) {
    if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string' ||
        typeof edge.type !== 'string' || !Array.isArray(edge.fields) ||
        edge.fields.length === 0 || edge.fields.some(field => typeof field !== 'string')) {
      throw new Error(`Stale or invalid ${MAP_NAME}: edges need provenance fields; run npm run linkmap:build.`);
    }
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new Error(`Invalid ${MAP_NAME}: edge endpoint is missing; run npm run linkmap:build.`);
    }
  }
  return map;
}

function nodeSummary(node) {
  return {
    id: node.canonical_id,
    name: node.name || node.canonical_id,
    type: node.type || 'unknown',
    path: node.path || null,
    canon_tier: node.canon_tier || null
  };
}

function sortEdges(a, b) {
  return a.from.localeCompare(b.from) || a.to.localeCompare(b.to) ||
    a.type.localeCompare(b.type) || a.fields.join(',').localeCompare(b.fields.join(','));
}

function incomingIndex(map, allowedFields) {
  const incoming = new Map();
  for (const edge of map.edges) {
    if (!edge.fields.some(field => allowedFields.has(field))) continue;
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to).push(edge);
  }
  for (const edges of incoming.values()) edges.sort(sortEdges);
  return incoming;
}

function isContinuityEdge(edge, nodes) {
  const sourceType = nodes.get(edge.from)?.type;
  const targetType = nodes.get(edge.to)?.type;
  if (edge.fields.includes('source')) {
    return edge.type === 'source_story' && sourceType === 'event' && targetType === 'story';
  }
  if (!edge.fields.includes('references') || sourceType !== 'story') return false;
  return (edge.type === 'stories' && targetType === 'story') ||
    (edge.type === 'events' && targetType === 'event');
}

function causalPaths(map, targetId, nodes) {
  const incoming = incomingIndex(map, CAUSAL_FIELDS);
  const direct = new Map();
  const transitive = new Map();
  const visited = new Set([targetId]);
  const queue = [];

  for (const edge of incoming.get(targetId) || []) {
    if (visited.has(edge.from)) continue;
    visited.add(edge.from);
    const trace = [{ from: edge.from, to: edge.to, type: edge.type, fields: edge.fields }];
    direct.set(edge.from, trace);
    if (['story', 'event'].includes(nodes.get(edge.from)?.type)) {
      queue.push({ id: edge.from, trace });
    }
  }

  // Only explicit work/event continuity can carry an impact beyond one hop.
  // Entity reference fields often describe associations and are not reliable
  // evidence that every connected story depends on every other connected one.
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const edge of incoming.get(current.id) || []) {
      if (!isContinuityEdge(edge, nodes)) continue;
      if (visited.has(edge.from)) continue;
      visited.add(edge.from);
      const trace = [{ from: edge.from, to: edge.to, type: edge.type, fields: edge.fields }, ...current.trace];
      transitive.set(edge.from, trace);
      queue.push({ id: edge.from, trace });
    }
  }
  return { direct, transitive };
}

function impactReport(map, rawId, options = {}) {
  const id = String(rawId || '').trim().toLowerCase();
  const nodes = new Map(map.nodes.map(node => [node.canonical_id, node]));
  if (!nodes.has(id)) {
    throw new Error(`Unknown ID ${id || '(empty)'} in ${MAP_NAME}; run npm run linkmap:build if the source is newer than the map.`);
  }

  const paths = causalPaths(map, id, nodes);
  const asEntry = (dependentId, trace) => ({
    ...nodeSummary(nodes.get(dependentId)),
    depth: trace.length,
    review_candidate: !['story', 'event'].includes(nodes.get(dependentId)?.type),
    trace
  });
  const sortEntries = (a, b) => a.depth - b.depth || a.id.localeCompare(b.id);
  const direct = [...paths.direct].map(([dependentId, trace]) => asEntry(dependentId, trace)).sort(sortEntries);
  const transitive = [...paths.transitive].map(([dependentId, trace]) => asEntry(dependentId, trace)).sort(sortEntries);

  const mentionCandidates = [];
  if (options.includeMentions) {
    const incomingMentions = incomingIndex(map, new Set(['cross_refs']));
    const candidatePaths = new Map();
    const candidatesAt = [{ id, suffix: [] }];
    // An event sourced from this story is another place where a later work
    // may mention the story's established material. Stop there: a mere
    // mention cannot establish transitive dependence through other works.
    for (const edge of incomingIndex(map, new Set(['source'])).get(id) || []) {
      if (edge.type === 'source_story' && nodes.get(edge.from)?.type === 'event') {
        candidatesAt.push({ id: edge.from, suffix: [edge] });
      }
    }
    for (const target of candidatesAt) {
      for (const edge of incomingMentions.get(target.id) || []) {
        if (paths.direct.has(edge.from) || paths.transitive.has(edge.from) || candidatePaths.has(edge.from)) continue;
        candidatePaths.set(edge.from, [edge, ...target.suffix]);
      }
    }
    for (const [dependentId, trace] of candidatePaths) {
      mentionCandidates.push({ ...asEntry(dependentId, trace), review_candidate: true });
    }
    mentionCandidates.sort(sortEntries);
  }

  return {
    target: nodeSummary(nodes.get(id)),
    include_mentions: Boolean(options.includeMentions),
    summary: {
      direct: direct.length,
      transitive: transitive.length,
      mention_candidates: mentionCandidates.length
    },
    direct,
    transitive,
    mention_candidates: mentionCandidates
  };
}

function formatTrace(trace) {
  return trace.map(edge => `${edge.from} --${edge.fields.join('+')}.${edge.type}--> ${edge.to}`).join(' ; ');
}

function formatText(report) {
  const target = report.target;
  const lines = [`Dependency impact for ${target.id} — ${target.name} (${target.canon_tier || 'untiered'})`];
  for (const [title, entries] of [
    ['Direct dependents', report.direct],
    ['Transitive dependents', report.transitive],
    ...(report.include_mentions ? [['Mention candidates', report.mention_candidates]] : [])
  ]) {
    lines.push('', `${title} (${entries.length})`);
    if (entries.length === 0) {
      lines.push('  (none)');
      continue;
    }
    for (const entry of entries) {
      const note = entry.review_candidate ? ' (review candidate)' : '';
      lines.push(`  ${entry.id} [${entry.type}; ${entry.canon_tier || 'untiered'}] ${entry.path || '(no path)'}${note}`);
      lines.push(`    via ${formatTrace(entry.trace)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log('Usage: node scripts/reports/dependency_impact.js --id <canonical-id> [--json] [--include-mentions] [--root <repo>]');
    return;
  }
  const report = impactReport(loadReferenceMap(options.root), options.id, options);
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatText(report));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Dependency impact: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, loadReferenceMap, impactReport, formatText, main };
