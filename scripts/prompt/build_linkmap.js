#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const yaml = require('js-yaml');

async function buildLinkMap() {
    try {
        // Create directories if they don't exist
        const outGraphsDir = path.join(__dirname, '../../out/graphs');
        const docsLinkMapDir = path.join(__dirname, '../../docs/link_map');

        if (!fs.existsSync(outGraphsDir)) {
            fs.mkdirSync(outGraphsDir, { recursive: true });
        }

        if (!fs.existsSync(docsLinkMapDir)) {
            fs.mkdirSync(docsLinkMapDir, { recursive: true });
        }

        // Build entity relationships
        const entities = {};
        const relationships = [];

        // Scan for entity files
        const entityDirs = [
            'characters',
            'factions',
            'atlas',
            'mechanics',
            'stories',
            'lore'
        ];

        for (const dir of entityDirs) {
            const dirPath = path.join(__dirname, `../../${dir}`);
            if (fs.existsSync(dirPath)) {
                const files = glob.sync('**/*.{md,yaml,json}', { cwd: dirPath });
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    let entityData;

                    try {
                        if (file.endsWith('.json')) {
                            entityData = JSON.parse(content);
                        } else if (file.endsWith('.yaml')) {
                            entityData = yaml.load(content);
                        } else {
                            // Try to parse frontmatter for .md files
                            const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                            if (frontmatterMatch) {
                                entityData = yaml.load(frontmatterMatch[1]);
                            }
                        }

                        if (entityData && entityData.id) {
                            const relativePath = path.join(dir, file).replace(/\\/g, '/');
                            let type = dir.replace(/s$/, '');
                            if (dir === 'atlas') type = 'location';
                            if (dir === 'stories') type = 'story';
                            
                            entities[entityData.id] = {
                                id: entityData.id,
                                type: type,
                                name: entityData.name || entityData.title || entityData.id,
                                path: relativePath,
                                file: file,
                                ...entityData
                            };
                        }
                    } catch (error) {
                        console.warn(`Could not parse ${filePath}: ${error.message}`);
                    }
                }
            }
        }

        // Also check root for story files
        const rootFiles = fs.readdirSync(path.join(__dirname, '../../'));
        for (const file of rootFiles) {
            if (file.endsWith('.md') && file !== 'README.md' && file !== 'CANONICAL_INDEX.md') {
                const filePath = path.join(__dirname, '../../', file);
                const content = fs.readFileSync(filePath, 'utf8');
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                if (frontmatterMatch) {
                    try {
                        const entityData = yaml.load(frontmatterMatch[1]);
                        if (entityData && entityData.id) {
                            entities[entityData.id] = {
                                id: entityData.id,
                                type: 'story',
                                name: entityData.name || entityData.title || entityData.id,
                                path: file,
                                file: file,
                                ...entityData
                            };
                        }
                    } catch (e) {}
                }
            }
        }

        // Build relationships from lexicon terms
        const lexiconPath = path.join(__dirname, '../../data/lexicon/terms.yaml');
        if (fs.existsSync(lexiconPath)) {
            const lexiconContent = fs.readFileSync(lexiconPath, 'utf8');
            const terms = yaml.load(lexiconContent);

            if (terms && terms.terms) {
                for (const term of terms.terms) {
                    if (term.id && term.related) {
                        const sourceId = term.id;
                        if (!entities[sourceId]) {
                            entities[sourceId] = {
                                id: sourceId,
                                type: 'term',
                                name: term.name || sourceId
                            };
                        }

                        for (const relatedId of term.related) {
                            if (!entities[relatedId]) {
                                entities[relatedId] = {
                                    id: relatedId,
                                    type: 'term',
                                    name: relatedId
                                };
                            }

                            relationships.push({
                                source: sourceId,
                                target: relatedId,
                                type: 'related'
                            });
                        }
                    }
                }
            }
        }

        // Write entities.json
        const entitiesOutput = {
            entities: Object.values(entities),
            relationships: relationships,
            generated_at: new Date().toISOString()
        };

        const entitiesJsonPath = path.join(outGraphsDir, 'entities.json');
        fs.writeFileSync(entitiesJsonPath, JSON.stringify(entitiesOutput, null, 2));

        // Write REFERENCE_MAP.json for the dashboard
        const referenceMap = {
            generated: new Date().toISOString(),
            nodes: Object.values(entities).map(e => ({
                canonical_id: e.id,
                type: e.type,
                name: e.name,
                path: e.path
            })),
            edges: relationships.map(r => ({
                from: r.source,
                to: r.target,
                type: r.type
            }))
        };
        const referenceMapPath = path.join(__dirname, '../../REFERENCE_MAP.json');
        fs.writeFileSync(referenceMapPath, JSON.stringify(referenceMap, null, 2));

        // Write CANONICAL_INDEX.md
        const sortedEntities = Object.values(entities).sort((a, b) => a.id.localeCompare(b.id));
        const types = [...new Set(sortedEntities.map(e => e.type))].sort();
        
        let canonicalIndexContent = `# Canonical Index\n\nThis index lists canonical entities, their IDs, and source paths. Generated: ${new Date().toISOString()}\n\n`;
        
        for (const type of types) {
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
            canonicalIndexContent += `## ${typeLabel}\n`;
            const typeEntities = sortedEntities.filter(e => e.type === type);
            for (const entity of typeEntities) {
                canonicalIndexContent += `- \`${entity.id}\` — ${entity.name} (\`${entity.path}\`)\n`;
            }
            canonicalIndexContent += `\n`;
        }

        const canonicalIndexPath = path.join(__dirname, '../../CANONICAL_INDEX.md');
        fs.writeFileSync(canonicalIndexPath, canonicalIndexContent);

        // Write LINK_MAP.md
        const linkMapContent = `# Link Map - Entity Relationships

Generated: ${new Date().toISOString()}

## Entities (${Object.keys(entities).length})

${Object.keys(entities).map(id => `- \`${id}\` (${entities[id].type})`).join('\n')}

## Relationships (${relationships.length})

${relationships.map(rel => `- \`${rel.source}\` → \`${rel.target}\` (${rel.type})`).join('\n')}

## Statistics

- **Total Entities**: ${Object.keys(entities).length}
- **Total Relationships**: ${relationships.length}
- **Entity Types**: ${[...new Set(Object.values(entities).map(e => e.type))].join(', ')}

## Notes

This link map represents the canonical relationships between entities in The Forgotten Tides universe. Relationships are derived from explicit references in entity files and lexicon term associations.
`;

        const linkMapMdPath = path.join(docsLinkMapDir, 'LINK_MAP.md');
        fs.writeFileSync(linkMapMdPath, linkMapContent);

        console.log(`Link map built successfully:
- Entities: ${entitiesJsonPath}
- Documentation: ${linkMapMdPath}`);

        return {
            entitiesPath: entitiesJsonPath,
            linkMapPath: linkMapMdPath,
            entityCount: Object.keys(entities).length,
            relationshipCount: relationships.length
        };

    } catch (error) {
        console.error('Error building link map:', error);
        throw error;
    }
}

// Run the build
buildLinkMap()
    .then(result => {
        process.exit(0);
    })
    .catch(error => {
        process.exit(1);
    });