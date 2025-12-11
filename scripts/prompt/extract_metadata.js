const fs = require('fs');
const path = require('path');

// Levenshtein distance implementation
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Normalized Levenshtein distance (0-1)
function normalizedLevenshtein(a, b) {
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : levenshteinDistance(a, b) / maxLen;
}

// Parse frontmatter from markdown files
function parseFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = {};
    const lines = frontmatterMatch[1].split('\n');

    for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            frontmatter[match[1]] = match[2].trim();
        }
    }

    return frontmatter;
}

// Find all works in the stories directory
function findAllWorks() {
    const storiesDir = path.join(__dirname, '../../../stories');
    const works = [];

    const categories = ['shorts', 'novellas', 'novels'];
    for (const category of categories) {
        const categoryPath = path.join(storiesDir, category);
        if (!fs.existsSync(categoryPath)) continue;

        const items = fs.readdirSync(categoryPath);
        for (const item of items) {
            const itemPath = path.join(categoryPath, item);
            if (!fs.statSync(itemPath).isDirectory()) continue;

            const manuscriptPath = path.join(itemPath, 'manuscript.md');
            if (!fs.existsSync(manuscriptPath)) continue;

            try {
                const content = fs.readFileSync(manuscriptPath, 'utf8');
                const frontmatter = parseFrontmatter(content);

                if (frontmatter && frontmatter.id && frontmatter.title) {
                    works.push({
                        id: frontmatter.id,
                        title: frontmatter.title,
                        kind: frontmatter.kind || category,
                        path: itemPath
                    });
                }
            } catch (error) {
                console.error(`Error reading ${manuscriptPath}:`, error.message);
            }
        }
    }

    return works;
}

// Find scenes in work directories and shared scenes
function findScenes() {
    const scenes = [];

    // Look for scenes in work directories
    const storiesDir = path.join(__dirname, '../../../stories');
    const categories = ['shorts', 'novellas', 'novels'];

    for (const category of categories) {
        const categoryPath = path.join(storiesDir, category);
        if (!fs.existsSync(categoryPath)) continue;

        const items = fs.readdirSync(categoryPath);
        for (const item of items) {
            const itemPath = path.join(categoryPath, item);
            if (!fs.statSync(itemPath).isDirectory()) continue;

            const scenesDir = path.join(itemPath, 'scenes');
            if (fs.existsSync(scenesDir)) {
                const sceneFiles = fs.readdirSync(scenesDir);
                for (const sceneFile of sceneFiles) {
                    if (sceneFile.endsWith('.md')) {
                        const scenePath = path.join(scenesDir, sceneFile);
                        try {
                            const content = fs.readFileSync(scenePath, 'utf8');
                            const frontmatter = parseFrontmatter(content);
                            const sceneId = path.basename(sceneFile, '.md');

                            scenes.push({
                                id: sceneId,
                                title: frontmatter?.title || sceneId,
                                path: scenePath,
                                workId: item
                            });
                        } catch (error) {
                            console.error(`Error reading ${scenePath}:`, error.message);
                        }
                    }
                }
            }
        }
    }

    // Look for shared scenes
    const sharedScenesDir = path.join(storiesDir, '_shared/scenes');
    if (fs.existsSync(sharedScenesDir)) {
        const sceneFiles = fs.readdirSync(sharedScenesDir);
        for (const sceneFile of sceneFiles) {
            if (sceneFile.endsWith('.md')) {
                const scenePath = path.join(sharedScenesDir, sceneFile);
                try {
                    const content = fs.readFileSync(scenePath, 'utf8');
                    const frontmatter = parseFrontmatter(content);
                    const sceneId = path.basename(sceneFile, '.md');

                    scenes.push({
                        id: sceneId,
                        title: frontmatter?.title || sceneId,
                        path: scenePath,
                        workId: null
                    });
                } catch (error) {
                    console.error(`Error reading ${scenePath}:`, error.message);
                }
            }
        }
    }

    return scenes;
}

// Find scenes at top level scenes directory
function findTopLevelScenes() {
    const scenes = [];
    const scenesDir = path.join(__dirname, '../../../scenes');

    if (fs.existsSync(scenesDir)) {
        const sceneFiles = fs.readdirSync(scenesDir);
        for (const sceneFile of sceneFiles) {
            if (sceneFile.endsWith('.md')) {
                const scenePath = path.join(scenesDir, sceneFile);
                try {
                    const content = fs.readFileSync(scenePath, 'utf8');
                    const frontmatter = parseFrontmatter(content);
                    const sceneId = path.basename(sceneFile, '.md');

                    scenes.push({
                        id: sceneId,
                        title: frontmatter?.title || sceneId,
                        path: scenePath,
                        workId: null
                    });
                } catch (error) {
                    console.error(`Error reading ${scenePath}:`, error.message);
                }
            }
        }
    }

    return scenes;
}

// Main extraction function
function extract(query) {
    try {
        // Cache works and scenes for this extraction
        const works = findAllWorks();
        const workScenes = findScenes();
        const topLevelScenes = findTopLevelScenes();
        const allScenes = [...workScenes, ...topLevelScenes];

        const result = {
            work: null,
            scene: null,
            order: null,
            outline_section: null,
            flags: {},
            needs_clarification: null
        };

        // Parse query for flags
        const replaceFlag = query.includes('replace') || query.includes('overwrite');
        if (replaceFlag) {
            result.flags.replace = true;
        }

        // 1. Work detection
        const workIdMatch = query.match(/\b(NOVELLA|NOVEL|STORY)-[A-Z0-9_]+\b/i);
        if (workIdMatch) {
            const workId = workIdMatch[0].toUpperCase();
            const exactWork = works.find(w => w.id === workId);
            if (exactWork) {
                result.work = {
                    id: exactWork.id,
                    title: exactWork.title,
                    kind: exactWork.kind
                };
            }
        }

        // If no exact work ID match, try fuzzy title matching
        if (!result.work) {
            const titleMatches = [];
            for (const work of works) {
                const distance = normalizedLevenshtein(work.title.toLowerCase(), query.toLowerCase());
                if (distance < 0.5) { // Threshold for considering a match
                    titleMatches.push({
                        work,
                        score: distance
                    });
                }
            }

            // Sort by score (best match first)
            titleMatches.sort((a, b) => a.score - b.score);

            if (titleMatches.length === 1) {
                const bestMatch = titleMatches[0].work;
                result.work = {
                    id: bestMatch.id,
                    title: bestMatch.title,
                    kind: bestMatch.kind
                };
            } else if (titleMatches.length > 1) {
                // Multiple potential matches - need clarification
                result.needs_clarification = {
                    question: `Which work did you mean? I found multiple matches for "${query}":`,
                    options: titleMatches.map(match => ({
                        label: `${match.work.title} (${match.work.id})`,
                        value: match.work.id
                    }))
                };
                return result;
            }
        }

        // 2. Scene detection
        // Exact SC-ID matching
        const sceneIdMatch = query.match(/\bSC-[A-Z0-9_]+\b/i);
        if (sceneIdMatch) {
            const sceneId = sceneIdMatch[0].toUpperCase();
            const exactScene = allScenes.find(s => s.id === sceneId);
            if (exactScene) {
                result.scene = {
                    id: exactScene.id,
                    path: exactScene.path
                };
            }
        }

        // If no exact scene ID match, try fuzzy title matching
        if (!result.scene) {
            const sceneTitleMatches = [];
            for (const scene of allScenes) {
                const distance = normalizedLevenshtein(scene.title.toLowerCase(), query.toLowerCase());
                if (distance < 0.5) { // Threshold for considering a match
                    sceneTitleMatches.push({
                        scene,
                        score: distance
                    });
                }
            }

            // Sort by score (best match first)
            sceneTitleMatches.sort((a, b) => a.score - b.score);

            if (sceneTitleMatches.length === 1) {
                const bestMatch = sceneTitleMatches[0].scene;
                result.scene = {
                    id: bestMatch.id,
                    path: bestMatch.path
                };
            } else if (sceneTitleMatches.length > 1) {
                // Multiple potential matches - need clarification
                result.needs_clarification = {
                    question: `Which scene did you mean? I found multiple matches for "${query}":`,
                    options: sceneTitleMatches.map(match => ({
                        label: `${match.scene.title} (${match.scene.id})`,
                        value: match.scene.id
                    }))
                };
                return result;
            }
        }

        // 3. Order resolution
        const orderPatterns = [
            { regex: /\b(opening|first)\b/i, mode: 'first' },
            { regex: /\b(last|final|ending)\b/i, mode: 'last' },
            { regex: /\bbefore\s+SC-([A-Z0-9_]+)\b/i, mode: 'before' },
            { regex: /\bafter\s+SC-([A-Z0-9_]+)\b/i, mode: 'after' },
            { regex: /\bscene\s+(\d+)\b/i, mode: 'index' },
            { regex: /\bat\s+index\s+(\d+)\b/i, mode: 'index' },
            { regex: /\bmidpoint\b/i, mode: 'midpoint' },
            { regex: /\b(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+chapter\b/i, mode: 'index' }
        ];

        for (const pattern of orderPatterns) {
            const match = query.match(pattern.regex);
            if (match) {
                let value = null;

                if (pattern.mode === 'index') {
                    if (match[1]) {
                        // Direct index number
                        value = parseInt(match[1]) - 1; // Convert to 0-based index
                    } else {
                        // Chapter number words (second, third, etc.)
                        const chapterWords = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
                        const chapterMatch = query.match(/\b(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+chapter\b/i);
                        if (chapterMatch) {
                            const wordIndex = chapterWords.indexOf(chapterMatch[1].toLowerCase());
                            value = wordIndex + 1; // second chapter = index 1
                        }
                    }
                } else if (pattern.mode === 'before' || pattern.mode === 'after') {
                    value = match[1].toUpperCase();
                }

                result.order = {
                    mode: pattern.mode,
                    value: value
                };
                break;
            }
        }

        // 4. Outline section detection
        const outlinePatterns = [
            { regex: /\bact\s+one\b/i, section: 'act_one' },
            { regex: /\bact\s+two\b/i, section: 'act_two' },
            { regex: /\bact\s+three\b/i, section: 'act_three' },
            { regex: /\bmidpoint\b/i, section: 'midpoint' },
            { regex: /\bfinale\b/i, section: 'finale' }
        ];

        for (const pattern of outlinePatterns) {
            if (query.match(pattern.regex)) {
                result.outline_section = pattern.section;
                break;
            }
        }

        return result;

    } catch (error) {
        console.error('Error in extract function:', error);
        return {
            work: null,
            scene: null,
            order: null,
            outline_section: null,
            flags: {},
            needs_clarification: {
                question: `An error occurred while processing your request: ${error.message}`,
                options: []
            }
        };
    }
}

// Export for CommonJS
module.exports = {
    extract
};