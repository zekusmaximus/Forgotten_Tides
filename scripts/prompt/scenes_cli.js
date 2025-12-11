#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extract } = require('./extract_metadata');

// Parse frontmatter from markdown files
function parseFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = {};
    const lines = frontmatterMatch[1].split('\n');

    let currentKey = null;
    let currentValue = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;

        // Check if this is a new key-value pair
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            // Save previous key if we were collecting multi-line value
            if (currentKey !== null) {
                frontmatter[currentKey] = currentValue.join('\n').trim();
            }

            currentKey = match[1];
            currentValue = [match[2].trim()];
        } else if (currentKey !== null) {
            // Continue collecting multi-line value
            currentValue.push(trimmedLine);
        }
    }

    // Save the last key-value pair
    if (currentKey !== null) {
        frontmatter[currentKey] = currentValue.join('\n').trim();
    }

    return frontmatter;
}

// Find all works in the stories directory
function findAllWorks() {
    // Resolve stories directory from this script's location
    const storiesDir = path.join(__dirname, '../..', 'stories');
    const works = [];

    // Check both standard categories and the novella directory
    const categories = ['shorts', 'novellas', 'novels', 'novella'];
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
                        path: itemPath,
                        manuscriptPath: manuscriptPath,
                        frontmatter: frontmatter
                    });
                }
            } catch (error) {
                console.error(`Error reading ${manuscriptPath}:`, error.message);
            }
        }
    }

    return works;
}

// Find scenes in a specific work directory
function findScenesInWork(workPath) {
    const scenes = [];
    const scenesDir = path.join(workPath, 'scenes');

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
                        frontmatter: frontmatter
                    });
                } catch (error) {
                    console.error(`Error reading ${scenePath}:`, error.message);
                }
            }
        }
    }

    return scenes;
}

// Parse manuscript scenes from both formats
function parseManuscriptScenes(manuscriptContent) {
    const frontmatter = parseFrontmatter(manuscriptContent);
    if (!frontmatter || !frontmatter.scenes) {
        return [];
    }

    const scenes = [];
    const scenesText = frontmatter.scenes;

    // Handle simple array format: scenes: [file1, file2, ...]
    if (scenesText.startsWith('[') && scenesText.endsWith(']')) {
        // Try to parse as simple array
        const simpleItems = scenesText.slice(1, -1).split(',').map(item => item.trim());
        return simpleItems.filter(item => item);
    }

    // Handle complex YAML format with nested objects
    const lines = scenesText.split('\n');
    let currentScene = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;

        if (trimmedLine.startsWith('- ')) {
            // New scene entry
            if (currentScene !== null) {
                scenes.push(currentScene);
            }
            currentScene = {};
        } else if (currentScene !== null) {
            // Parse scene properties
            const parts = trimmedLine.split(':').map(part => part.trim());
            if (parts.length === 2) {
                const key = parts[0];
                const value = parts[1];
                currentScene[key] = value;
            }
        }
    }

    // Add the last scene
    if (currentScene !== null) {
        scenes.push(currentScene);
    }

    // Convert to file paths
    return scenes.map(scene => {
        if (scene.file) {
            return scene.file;
        } else if (scene.id) {
            return `scenes/${scene.id}.md`;
        }
        return '';
    }).filter(file => file);
}

// Resolve work by ID or title
function resolveWork(workIdentifier) {
    const works = findAllWorks();

    // Try exact ID match first
    const exactIdMatch = works.find(w => w.id === workIdentifier);
    if (exactIdMatch) {
        return exactIdMatch;
    }

    // Try fuzzy title matching
    const titleMatches = works.filter(work =>
        work.title.toLowerCase().includes(workIdentifier.toLowerCase())
    );

    if (titleMatches.length === 1) {
        return titleMatches[0];
    } else if (titleMatches.length > 1) {
        console.error(`Multiple works match "${workIdentifier}":`);
        titleMatches.forEach(match => {
            console.error(`  - ${match.title} (${match.id})`);
        });
        return null;
    }

    console.error(`Work not found: ${workIdentifier}`);
    return null;
}

// Resolve scene by ID or path
function resolveScene(sceneIdentifier) {
    const storiesDir = path.join(__dirname, '../..', 'stories');
    const categories = ['shorts', 'novellas', 'novels', 'novella'];
    const allScenes = [];

    // Search in all work directories
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
                        const sceneId = path.basename(sceneFile, '.md');
                        allScenes.push({
                            id: sceneId,
                            path: scenePath
                        });
                    }
                }
            }
        }
    }

    // Try exact ID match first
    const exactIdMatch = allScenes.find(s => s.id === sceneIdentifier);
    if (exactIdMatch) {
        return exactIdMatch;
    }

    // Try exact path match
    const exactPathMatch = allScenes.find(s => s.path === sceneIdentifier || s.path === path.resolve(sceneIdentifier));
    if (exactPathMatch) {
        return exactPathMatch;
    }

    // Try fuzzy path matching
    const pathMatches = allScenes.filter(scene =>
        scene.path.toLowerCase().includes(sceneIdentifier.toLowerCase())
    );

    if (pathMatches.length === 1) {
        return pathMatches[0];
    } else if (pathMatches.length > 1) {
        console.error(`Multiple scenes match "${sceneIdentifier}":`);
        pathMatches.forEach(match => {
            console.error(`  - ${match.id}: ${match.path}`);
        });
        return null;
    }

    console.error(`Scene not found: ${sceneIdentifier}`);
    return null;
}

// List command
function listCommand(workIdentifier) {
    const work = resolveWork(workIdentifier);
    if (!work) {
        process.exit(1);
    }

    try {
        // Read manuscript to get scene order
        const manuscriptContent = fs.readFileSync(work.manuscriptPath, 'utf8');
        const scenePaths = parseManuscriptScenes(manuscriptContent);

        // Get all scenes with their metadata
        const allScenes = findScenesInWork(work.path);

        // Create a map of scene files to their metadata
        const sceneMap = {};
        allScenes.forEach(scene => {
            const sceneFilename = path.basename(scene.path);
            sceneMap[sceneFilename] = scene;
        });

        // Output table header
        console.log('index | SC-ID       | title                          | path');
        console.log('------|------------|--------------------------------|-------------------------------');

        // Output scenes in manuscript order
        scenePaths.forEach((scenePath, index) => {
            const sceneFilename = path.basename(scenePath);
            const scene = sceneMap[sceneFilename];

            if (scene) {
                const relativePath = path.relative(process.cwd(), scene.path);
                console.log(`${index.toString().padEnd(5)} | ${scene.id.padEnd(10)} | ${(scene.title || '').padEnd(30)} | ${relativePath}`);
            } else {
                console.log(`${index.toString().padEnd(5)} | ${sceneFilename.padEnd(10)} | ${'MISSING'.padEnd(30)} | ${scenePath}`);
            }
        });

    } catch (error) {
        console.error(`Error listing scenes: ${error.message}`);
        process.exit(1);
    }
}

// Graph command
function graphCommand(workIdentifier) {
    const work = resolveWork(workIdentifier);
    if (!work) {
        process.exit(1);
    }

    try {
        // Read manuscript to get scene order
        const manuscriptContent = fs.readFileSync(work.manuscriptPath, 'utf8');
        const scenePaths = parseManuscriptScenes(manuscriptContent);

        if (scenePaths.length === 0) {
            console.log('graph TD');
            return;
        }

        // Get all scenes with their metadata
        const allScenes = findScenesInWork(work.path);

        // Create a map of scene files to their metadata
        const sceneMap = {};
        allScenes.forEach(scene => {
            const sceneFilename = path.basename(scene.path);
            sceneMap[sceneFilename] = scene;
        });

        // Generate Mermaid graph
        console.log('graph TD');

        // Generate scene linkages
        const sceneIds = scenePaths.map(scenePath => {
            const sceneFilename = path.basename(scenePath);
            const scene = sceneMap[sceneFilename];
            return scene ? scene.id : path.basename(scenePath, '.md');
        });

        // Output linkages
        for (let i = 0; i < sceneIds.length - 1; i++) {
            console.log(`  ${sceneIds[i]} --> ${sceneIds[i + 1]}`);
        }

        // Output scene labels with titles if available
        sceneIds.forEach(sceneId => {
            const scene = allScenes.find(s => s.id === sceneId);
            if (scene && scene.title && scene.title !== scene.id) {
                console.log(`  ${sceneId}["${scene.title}"]`);
            }
        });

    } catch (error) {
        console.error(`Error generating graph: ${error.message}`);
        process.exit(1);
    }
}

// Open command
function openCommand(sceneIdentifier) {
    const scene = resolveScene(sceneIdentifier);
    if (!scene) {
        process.exit(1);
    }

    // Output absolute path
    const absolutePath = path.resolve(scene.path);
    console.log(absolutePath);
}

// Main CLI function
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: scenes_cli.js <command> [options]');
        console.error('');
        console.error('Commands:');
        console.error('  list    --work <ID_or_Title>    List scenes in a work');
        console.error('  graph   --work <ID_or_Title>    Generate Mermaid graph of scene linkages');
        console.error('  open    --scene <SC-ID_or_path> Print absolute path to scene');
        process.exit(1);
    }

    const command = args[0];

    switch (command) {
        case 'list':
            if (args.length < 3 || args[1] !== '--work') {
                console.error('Usage: scenes_cli.js list --work <ID_or_Title>');
                process.exit(1);
            }
            listCommand(args[2]);
            break;

        case 'graph':
            if (args.length < 3 || args[1] !== '--work') {
                console.error('Usage: scenes_cli.js graph --work <ID_or_Title>');
                process.exit(1);
            }
            graphCommand(args[2]);
            break;

        case 'open':
            if (args.length < 3 || args[1] !== '--scene') {
                console.error('Usage: scenes_cli.js open --scene <SC-ID_or_path>');
                process.exit(1);
            }
            openCommand(args[2]);
            break;

        default:
            console.error(`Unknown command: ${command}`);
            console.error('Available commands: list, graph, open');
            process.exit(1);
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = {
    listCommand,
    graphCommand,
    openCommand,
    resolveWork,
    resolveScene,
    findAllWorks
};