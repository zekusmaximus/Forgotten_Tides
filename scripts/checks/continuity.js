#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { discoverMarkdownFiles, toPosixPath } = require('../lib/content_discovery');

/**
 * Continuity Check Script
 * Scans stories for character references and checks against continuity invariants
 */

// Ensure output directory exists
const outputDir = path.join(__dirname, '../../out/reports');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const continuityReport = {
    timestamp: new Date().toISOString(),
    characters: {},
    issues: {
        hard: [],
        soft: []
    },
    summary: {
        total_characters: 0,
        total_stories: 0,
        story_files_seen: 0,
        story_files_scanned: 0,
        character_files_seen: 0,
        character_files_scanned: 0,
        skipped_files: 0,
        hard_failures: 0,
        soft_warnings: 0
    },
    coverage: {
        characters: {},
        stories: {}
    }
};

/**
 * Load all character files and extract their continuity invariants
 */
function loadCharacterContinuity() {
    const charactersDir = path.join(__dirname, '../../characters');
    const { files: characterFiles, coverage } = discoverMarkdownFiles(charactersDir);

    const characters = {};
    continuityReport.coverage.characters = coverage;
    continuityReport.summary.character_files_seen = coverage.files_seen;

    for (const filePath of characterFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const file = toPosixPath(path.relative(path.join(__dirname, '../..'), filePath));

        // Extract YAML frontmatter
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match) continue;

        try {
            const frontmatter = yaml.load(match[1]);
            const charName = frontmatter.name || path.basename(file, '.md');

            characters[charName] = {
                id: frontmatter.id,
                invariants: frontmatter.continuity?.invariants || [],
                watchlist: frontmatter.continuity?.watchlist || [],
                file
            };

            continuityReport.characters[charName] = {
                invariants: frontmatter.continuity?.invariants || [],
                issues: []
            };
        } catch (error) {
            console.error(`Error parsing character file ${file}:`, error.message);
        }
    }

    continuityReport.summary.total_characters = Object.keys(characters).length;
    continuityReport.summary.character_files_scanned = characterFiles.length;
    return characters;
}

/**
 * Scan stories directory for character references
 */
function scanStories(characters) {
    const storiesDir = path.join(__dirname, '../../stories');
    const { files: storyFiles, coverage } = discoverMarkdownFiles(storiesDir);
    continuityReport.coverage.stories = coverage;
    continuityReport.summary.story_files_seen = coverage.files_seen;
    continuityReport.summary.story_files_scanned = coverage.files_scanned;
    continuityReport.summary.skipped_files += coverage.skipped_files;

    continuityReport.summary.total_stories = storyFiles.length;

    for (const filePath of storyFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = toPosixPath(path.relative(path.join(__dirname, '../..'), filePath));
        const storyName = relativePath.replace(/\.md$/i, '');

        // Check each character's invariants against story content
        for (const [charName, charData] of Object.entries(characters)) {
            const charIssues = [];

            // Check if character is referenced in this story
            const charMentioned = content.toLowerCase().includes(charName.toLowerCase());

            if (charMentioned) {
                // Check each invariant
                for (const invariant of charData.invariants) {
                    // Skip empty or non-specific invariants
                    if (!invariant || invariant.startsWith('Memory physics') || invariant.startsWith('Anchor burn')) {
                        continue;
                    }

                    // Parse invariant (e.g., "Species: Human" or "Eye color: blue")
                    const invariantMatch = invariant.match(/^([^:]+):\s*(.+)$/);
                    if (invariantMatch) {
                        const [, property, expectedValue] = invariantMatch;
                        const normalizedProperty = property.trim().toLowerCase();
                        const normalizedExpected = expectedValue.trim().toLowerCase();

                        // Look for potential contradictions in story content
                        const propertyMentions = findPropertyMentions(content, normalizedProperty);

                        for (const mention of propertyMentions) {
                            const mentionValue = mention.toLowerCase();
                            if (mentionValue.includes(normalizedExpected)) {
                                // This is good - matches expected value
                                continue;
                            }

                            // Check for potential contradictions
                            const contradictionPattern = new RegExp(`\\b${normalizedProperty}\\b.*?\\b(?!${normalizedExpected})\\w+`, 'i');
                            if (contradictionPattern.test(mention)) {
                                const issue = {
                                    type: 'hard',
                                    story: storyName,
                                    character: charName,
                                    invariant: invariant,
                                    found: mention.trim(),
                                    location: `Story: ${storyName}`
                                };
                                charIssues.push(issue);
                                continuityReport.issues.hard.push(issue);
                            }
                        }
                    }
                }
            }

            if (charIssues.length > 0) {
                continuityReport.characters[charName].issues = charIssues;
            }
        }
    }
}

/**
 * Find mentions of a property in text (e.g., "eye color", "species")
 */
function findPropertyMentions(content, property) {
    const mentions = [];

    // Look for patterns like "eye color: blue" or "species is human"
    const patterns = [
        new RegExp(`\\b${property}\\b\\s*[:=]\\s*([^\\n]+)`, 'gi'),
        new RegExp(`\\b${property}\\b\\s+(?:is|was|are|were)\\s+([^\\n.]+)`, 'gi'),
        new RegExp(`\\b${property}\\b\\s+([^\\n.]+)`, 'gi')
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            if (match[1]) {
                mentions.push(match[1].trim());
            }
        }
    }

    return mentions;
}

/**
 * Write continuity report to file
 */
function writeReport() {
    continuityReport.summary.hard_failures = continuityReport.issues.hard.length;
    continuityReport.summary.soft_warnings = continuityReport.issues.soft.length;

    const reportPath = path.join(outputDir, 'continuity.json');
    fs.writeFileSync(reportPath, JSON.stringify(continuityReport, null, 2));

    console.log(`Continuity report written to: ${reportPath}`);
    console.log(`Summary: ${continuityReport.summary.total_characters} characters, ${continuityReport.summary.total_stories} stories`);
    console.log(`Hard failures: ${continuityReport.summary.hard_failures}`);
    console.log(`Soft warnings: ${continuityReport.summary.soft_warnings}`);

    // Exit with appropriate code
    if (continuityReport.summary.hard_failures > 0) {
        process.exit(1);
    } else if (continuityReport.summary.soft_warnings > 0) {
        process.exit(0); // Soft warnings don't cause failure
    } else {
        process.exit(0);
    }
}

// Main execution
try {
    console.log('Loading character continuity data...');
    const characters = loadCharacterContinuity();

    console.log('Scanning stories for continuity issues...');
    scanStories(characters);

    if (continuityReport.summary.total_characters === 0) {
        continuityReport.issues.hard.push({
            type: 'hard',
            issue: 'Continuity check found no character files with valid frontmatter.',
            location: 'characters/'
        });
    }
    if (continuityReport.summary.story_files_seen > 0 && continuityReport.summary.total_stories === 0) {
        continuityReport.issues.hard.push({
            type: 'hard',
            issue: 'Continuity check saw story markdown files but scanned none.',
            location: 'stories/'
        });
    }

    console.log('Generating continuity report...');
    writeReport();
} catch (error) {
    console.error('Error running continuity check:', error);
    process.exit(1);
}
