#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const yaml = require('js-yaml');
const { describePolicy } = require('../lib/canon_policy');

const TYPE_BY_DIR = {
    characters: 'character',
    factions: 'faction',
    atlas: 'location',
    mechanics: 'mechanics',
    stories: 'story',
    lore: 'lore'
};

const REFERENCE_FIELDS = ['cross_refs', 'references'];

function pickCanonicalId(entityData) {
    if (entityData && typeof entityData.id === 'string' && entityData.id.trim()) {
        return entityData.id.trim().toLowerCase();
    }
    return null;
}

function collectTargetIds(value, into) {
    if (value == null) return;
    if (typeof value === 'string') {
        const s = value.trim();
        if (s) into.add(s.toLowerCase());
        return;
    }
    if (Array.isArray(value)) {
        value.forEach(item => collectTargetIds(item, into));
        return;
    }
    if (typeof value === 'object') {
        if (typeof value.target_id === 'string') {
            collectTargetIds(value.target_id, into);
        }
        if (typeof value.id === 'string') {
            collectTargetIds(value.id, into);
        }
        Object.entries(value).forEach(([key, v]) => {
            if (key === 'target_id' || key === 'id') return;
            collectTargetIds(v, into);
        });
    }
}

function parseEntityFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (filePath.endsWith('.json')) {
        try { return JSON.parse(content); } catch { return null; }
    }
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        try { return yaml.load(content); } catch { return null; }
    }
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return null;
    try { return yaml.load(fm[1]); } catch { return null; }
}

async function buildLinkMap() {
    const repoRoot = path.join(__dirname, '../..');
    const outGraphsDir = path.join(repoRoot, 'out/graphs');
    const docsLinkMapDir = path.join(repoRoot, 'docs/link_map');

    fs.mkdirSync(outGraphsDir, { recursive: true });
    fs.mkdirSync(docsLinkMapDir, { recursive: true });

    const entities = {};

    for (const [dir, type] of Object.entries(TYPE_BY_DIR)) {
        const dirPath = path.join(repoRoot, dir);
        if (!fs.existsSync(dirPath)) continue;

        const files = glob.sync('**/*.{md,yaml,json}', { cwd: dirPath });
        for (const file of files) {
            if (file.toLowerCase().endsWith('readme.md')) continue;
            if (/_backup_/.test(file)) continue;
            const filePath = path.join(dirPath, file);
            const data = parseEntityFile(filePath);
            if (!data) continue;

            const canonicalId = pickCanonicalId(data);
            if (!canonicalId) continue;

            const relativePath = path.join(dir, file).replace(/\\/g, '/');
            if (entities[canonicalId]) {
                console.warn(`Duplicate canonical_id ${canonicalId}: ${entities[canonicalId].path} vs ${relativePath}`);
            }
            const policy = describePolicy(data, relativePath, type);
            entities[canonicalId] = {
                canonical_id: canonicalId,
                display_id: data.id || canonicalId,
                type,
                name: data.name || data.title || canonicalId,
                path: relativePath,
                ...policy,
                _refs: REFERENCE_FIELDS.reduce((acc, field) => {
                    if (data[field]) acc[field] = data[field];
                    return acc;
                }, {})
            };
        }
    }

    const rootFiles = fs.readdirSync(repoRoot);
    for (const file of rootFiles) {
        if (!file.endsWith('.md')) continue;
        if (file === 'README.md' || file === 'CANONICAL_INDEX.md') continue;
        const filePath = path.join(repoRoot, file);
        const data = parseEntityFile(filePath);
        if (!data) continue;
        const canonicalId = pickCanonicalId(data);
        if (!canonicalId) continue;
        if (entities[canonicalId]) continue;
        const policy = describePolicy(data, file, 'story');
        entities[canonicalId] = {
            canonical_id: canonicalId,
            display_id: data.id || canonicalId,
            type: 'story',
            name: data.name || data.title || canonicalId,
            path: file,
            ...policy,
            _refs: REFERENCE_FIELDS.reduce((acc, field) => {
                if (data[field]) acc[field] = data[field];
                return acc;
            }, {})
        };
    }

    // Lexicon terms contribute term nodes plus related_terms edges.
    const lexiconPath = path.join(repoRoot, 'data/lexicon/terms.yaml');
    if (fs.existsSync(lexiconPath)) {
        try {
            const lex = yaml.load(fs.readFileSync(lexiconPath, 'utf8'));
            if (lex && Array.isArray(lex.terms)) {
                for (const term of lex.terms) {
                    if (!term || !term.id) continue;
                    const tid = String(term.id).toLowerCase();
                    if (!entities[tid]) {
                        const policy = describePolicy(term, 'data/lexicon/terms.yaml', 'term');
                        entities[tid] = {
                            canonical_id: tid,
                            display_id: term.id,
                            type: 'term',
                            name: term.term || term.name || tid,
                            path: 'data/lexicon/terms.yaml',
                            ...policy,
                            _refs: term.related_terms ? { related_terms: term.related_terms } : {}
                        };
                    }
                }
            }
        } catch (e) {
            console.warn(`Could not parse lexicon: ${e.message}`);
        }
    }

    // Build edges from each entity's reference fields.
    const knownIds = new Set(Object.keys(entities));
    const edgeSet = new Set();
    const relationships = [];
    const orphanedTargets = [];

    for (const entity of Object.values(entities)) {
        const refs = entity._refs || {};
        for (const [field, value] of Object.entries(refs)) {
            // For top-level fields like `cross_refs` and `references`, the value is an
            // object whose keys (`characters`, `locations`, ...) describe the edge type.
            if (value && typeof value === 'object' && !Array.isArray(value) && (field === 'cross_refs' || field === 'references')) {
                for (const [subKey, subVal] of Object.entries(value)) {
                    const targets = new Set();
                    collectTargetIds(subVal, targets);
                    for (const target of targets) {
                        if (target === entity.canonical_id) continue;
                        const edgeKey = `${entity.canonical_id}|${target}|${subKey}`;
                        if (edgeSet.has(edgeKey)) continue;
                        edgeSet.add(edgeKey);
                        if (knownIds.has(target)) {
                            relationships.push({ source: entity.canonical_id, target, type: subKey });
                        } else {
                            orphanedTargets.push({ source: entity.canonical_id, target, type: subKey });
                        }
                    }
                }
            } else {
                const targets = new Set();
                collectTargetIds(value, targets);
                for (const target of targets) {
                    if (target === entity.canonical_id) continue;
                    const edgeKey = `${entity.canonical_id}|${target}|${field}`;
                    if (edgeSet.has(edgeKey)) continue;
                    edgeSet.add(edgeKey);
                    if (knownIds.has(target)) {
                        relationships.push({ source: entity.canonical_id, target, type: field });
                    } else {
                        orphanedTargets.push({ source: entity.canonical_id, target, type: field });
                    }
                }
            }
        }
    }

    // Sort relationships for deterministic output regardless of file discovery order.
    relationships.sort((a, b) => {
        const srcCmp = a.source.localeCompare(b.source);
        if (srcCmp !== 0) return srcCmp;
        const tgtCmp = a.target.localeCompare(b.target);
        if (tgtCmp !== 0) return tgtCmp;
        return a.type.localeCompare(b.type);
    });

    // Strip the internal _refs scratch before serializing.
    for (const entity of Object.values(entities)) {
        delete entity._refs;
    }

    const entitiesOutput = {
        entities: Object.values(entities),
        relationships,
        orphaned_targets: orphanedTargets,
        generated_at: new Date().toISOString()
    };
    const entitiesJsonPath = path.join(outGraphsDir, 'entities.json');
    fs.writeFileSync(entitiesJsonPath, JSON.stringify(entitiesOutput, null, 2));

    const referenceMap = {
        generated: new Date().toISOString(),
        nodes: Object.values(entities).map(e => ({
            canonical_id: e.canonical_id,
            type: e.type,
            name: e.name,
            path: e.path,
            canon_tier: e.canon_tier,
            source_weight: e.source_weight,
            retrieval_role: e.retrieval_role
        })),
        edges: relationships.map(r => ({ from: r.source, to: r.target, type: r.type }))
    };
    fs.writeFileSync(path.join(repoRoot, 'REFERENCE_MAP.json'), JSON.stringify(referenceMap, null, 2));

    const sortedEntities = Object.values(entities).sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));
    const types = [...new Set(sortedEntities.map(e => e.type))].sort();

    let indexContent = `# Canonical Index\n\nThis index lists canonical entities, their IDs, source paths, and retrieval roles. Generated: ${new Date().toISOString()}\n\n`;
    for (const type of types) {
        indexContent += `## ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
        for (const entity of sortedEntities.filter(e => e.type === type)) {
            indexContent += `- \`${entity.canonical_id}\` — ${entity.name} (\`${entity.path}\`)\n`;
        }
        indexContent += `\n`;
    }
    const canonViews = [
        { title: 'Authoritative Canon', tiers: ['primary_canon', 'working_canon'] },
        { title: 'Active Drafts', tiers: ['draft'] },
        { title: 'Speculative / Sandbox Material', tiers: ['speculative', 'sandbox'] },
        { title: 'Test / Dev / Sample Material', tiers: ['test', 'deprecated'] }
    ];
    indexContent += `## Canon Views\n\n`;
    for (const view of canonViews) {
        const matches = sortedEntities.filter(e => view.tiers.includes(e.canon_tier));
        indexContent += `### ${view.title}\n`;
        indexContent += matches.length
            ? `${matches.map(e => `- \`${e.canonical_id}\` - ${e.name} (${e.type}, ${e.canon_tier}, weight ${e.source_weight}, \`${e.path}\`)`).join('\n')}\n\n`
            : `_none_\n\n`;
    }
    fs.writeFileSync(path.join(repoRoot, 'CANONICAL_INDEX.md'), indexContent);

    const linkMapContent = `# Link Map - Entity Relationships

Generated: ${new Date().toISOString()}

## Entities (${Object.keys(entities).length})

${sortedEntities.map(e => `- \`${e.canonical_id}\` (${e.type}, ${e.canon_tier}, weight ${e.source_weight})`).join('\n')}

## Relationships (${relationships.length})

${relationships.map(r => `- \`${r.source}\` → \`${r.target}\` (${r.type})`).join('\n') || '_none_'}

## Orphaned Reference Targets (${orphanedTargets.length})

${orphanedTargets.length
    ? orphanedTargets.map(r => `- \`${r.source}\` → \`${r.target}\` (${r.type}) — target not found`).join('\n')
    : '_none_'}

## Statistics

- **Total Entities**: ${Object.keys(entities).length}
- **Total Relationships**: ${relationships.length}
- **Orphaned Targets**: ${orphanedTargets.length}
- **Entity Types**: ${types.join(', ')}
- **Primary / Working Canon**: ${sortedEntities.filter(e => ['primary_canon', 'working_canon'].includes(e.canon_tier)).length}
- **Draft Entities**: ${sortedEntities.filter(e => e.canon_tier === 'draft').length}
- **Test / Sandbox / Deprecated Entities**: ${sortedEntities.filter(e => ['test', 'sandbox', 'deprecated'].includes(e.canon_tier)).length}
`;
    fs.writeFileSync(path.join(docsLinkMapDir, 'LINK_MAP.md'), linkMapContent);

    console.log(`Link map built: ${Object.keys(entities).length} entities, ${relationships.length} edges, ${orphanedTargets.length} orphaned targets.`);
    return { entityCount: Object.keys(entities).length, relationshipCount: relationships.length };
}

buildLinkMap()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error building link map:', err);
        process.exit(1);
    });
