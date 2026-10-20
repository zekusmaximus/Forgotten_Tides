#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { discoverMarkdownFiles, toPosixPath } = require('../lib/content_discovery');

/**
 * Continuity Check Script
 *
 * Scans stories for character references and checks explicit property
 * declarations against each character's continuity invariants.
 *
 * Matching rules:
 *   - A character counts as mentioned only where its name or an alias appears
 *     as a whole word (so "Michael" never matches "Hael").
 *   - Invariants of the form `Property: Value` are checked only against
 *     explicit declarations in the same paragraph as a mention of the
 *     character: `property: value`, `property = value`, or
 *     `property is/was/are/were value`. Ordinary prose use of the property
 *     word ("the species of lamp") is not a declaration.
 *   - A declaration contradicts the invariant when its value does not contain
 *     the invariant's core value (the text before any parenthetical, so
 *     `Human (Mid-Gravity)` compares as `human`).
 *
 * The module exports its pieces so scripts/tests/test_continuity_check.js can
 * run them against a fixture repository.
 */

const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const SKIPPED_INVARIANT_PREFIXES = ['Memory physics', 'Anchor burn'];

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive matcher for any of the given names, bounded by non-letter,
 * non-digit characters so possessives ("Hael's") match and longer words that
 * merely contain the name ("Michael", "Haelish") do not.
 */
function buildNameMatcher(names) {
    const parts = [...new Set(
        (names || [])
            .filter(name => typeof name === 'string' && name.trim().length > 0)
            .map(name => escapeRegExp(name.trim()))
    )].sort((a, b) => b.length - a.length);
    if (parts.length === 0) return null;
    return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
}

/**
 * Turn an invariant string into a comparable property/value pair, or null when
 * the invariant is not of the `Property: Value` form or is one of the generic
 * rule reminders.
 */
function parseInvariant(invariant) {
    if (typeof invariant !== 'string') return null;
    if (SKIPPED_INVARIANT_PREFIXES.some(prefix => invariant.startsWith(prefix))) return null;
    const match = invariant.match(/^([^:]+):\s*(.+)$/);
    if (!match) return null;
    const property = match[1].trim();
    const expected = match[2].trim();
    const core = expected.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!property || !core) return null;
    return { raw: invariant, property, expected, core };
}

/**
 * Explicit declarations of a property in a block of text. Returns the declared
 * values, trimmed. Only `property: value`, `property = value`, and
 * `property is|was|are|were value` count.
 */
function findPropertyDeclarations(text, property) {
    const prop = escapeRegExp(property.toLowerCase());
    const boundary = '(?<![\\p{L}\\p{N}])';
    const patterns = [
        new RegExp(`${boundary}${prop}\\s*[:=]\\s*([^\\n.;]+)`, 'giu'),
        new RegExp(`${boundary}${prop}\\s+(?:is|was|are|were)\\s+([^\\n.;]+)`, 'giu')
    ];
    const declarations = [];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const value = (match[1] || '').trim();
            if (value) declarations.push(value);
        }
    }
    return declarations;
}

function splitParagraphs(content) {
    return content.split(/\r?\n[ \t]*\r?\n/);
}

function createReport() {
    return {
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
}

/**
 * Load all character files and extract their names, aliases, and invariants.
 */
async function loadCharacterContinuity(root, report) {
    const charactersDir = path.join(root, 'characters');
    const { files: characterFiles, coverage } = discoverMarkdownFiles(charactersDir);

    const characters = {};
    report.coverage.characters = coverage;
    report.summary.character_files_seen = coverage.files_seen;

    await Promise.all(characterFiles.map(async (filePath) => {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const file = toPosixPath(path.relative(root, filePath));

        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match) return;

        try {
            const frontmatter = yaml.load(match[1]) || {};
            const charName = frontmatter.name || path.basename(file, '.md');
            const aliases = Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [];
            const invariants = frontmatter.continuity?.invariants || [];

            characters[charName] = {
                id: frontmatter.id,
                names: [charName, ...aliases],
                matcher: buildNameMatcher([charName, ...aliases]),
                invariants,
                parsedInvariants: invariants.map(parseInvariant).filter(Boolean),
                watchlist: frontmatter.continuity?.watchlist || [],
                file
            };

            report.characters[charName] = {
                invariants,
                stories: [],
                issues: []
            };
        } catch (error) {
            console.error(`Error parsing character file ${file}:`, error.message);
        }
    }));

    report.summary.total_characters = Object.keys(characters).length;
    report.summary.character_files_scanned = characterFiles.length;
    return characters;
}

/**
 * Scan stories for character mentions and check explicit declarations against
 * invariants, paragraph by paragraph.
 */
async function scanStories(root, characters, report) {
    const storiesDir = path.join(root, 'stories');
    const { files: storyFiles, coverage } = discoverMarkdownFiles(storiesDir);
    report.coverage.stories = coverage;
    report.summary.story_files_seen = coverage.files_seen;
    report.summary.story_files_scanned = coverage.files_scanned;
    report.summary.skipped_files += coverage.skipped_files;
    report.summary.total_stories = storyFiles.length;

    await Promise.all(storyFiles.map(async (filePath) => {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const relativePath = toPosixPath(path.relative(root, filePath));
        const storyName = relativePath.replace(/\.md$/i, '');
        const paragraphs = splitParagraphs(content);

        for (const [charName, charData] of Object.entries(characters)) {
            if (!charData.matcher) continue;
            const mentionedParagraphs = paragraphs.filter(paragraph => charData.matcher.test(paragraph));
            if (mentionedParagraphs.length === 0) continue;

            report.characters[charName].stories.push(storyName);

            for (const invariant of charData.parsedInvariants) {
                for (const paragraph of mentionedParagraphs) {
                    for (const declared of findPropertyDeclarations(paragraph, invariant.property)) {
                        if (declared.toLowerCase().includes(invariant.core)) continue;
                        const issue = {
                            type: 'hard',
                            story: storyName,
                            character: charName,
                            invariant: invariant.raw,
                            found: declared,
                            location: `Story: ${storyName}`
                        };
                        report.characters[charName].issues.push(issue);
                        report.issues.hard.push(issue);
                    }
                }
            }
        }
    }));

    for (const entry of Object.values(report.characters)) {
        entry.stories.sort();
    }
}

/**
 * Run the whole check against a repository root. Writes the JSON report to
 * outputDir (default <root>/out/reports) and returns the report object. Exit
 * codes are left to the caller.
 */
async function runContinuityCheck(options = {}) {
    const root = options.root || DEFAULT_ROOT;
    const outputDir = options.outputDir || path.join(root, 'out', 'reports');
    const log = options.log || (() => {});
    const report = createReport();

    log('Loading character continuity data...');
    const characters = await loadCharacterContinuity(root, report);

    log('Scanning stories for continuity issues...');
    await scanStories(root, characters, report);

    if (report.summary.total_characters === 0) {
        report.issues.hard.push({
            type: 'hard',
            issue: 'Continuity check found no character files with valid frontmatter.',
            location: 'characters/'
        });
    }
    if (report.summary.story_files_seen > 0 && report.summary.total_stories === 0) {
        report.issues.hard.push({
            type: 'hard',
            issue: 'Continuity check saw story markdown files but scanned none.',
            location: 'stories/'
        });
    }

    report.summary.hard_failures = report.issues.hard.length;
    report.summary.soft_warnings = report.issues.soft.length;

    if (options.write !== false) {
        fs.mkdirSync(outputDir, { recursive: true });
        const reportPath = path.join(outputDir, 'continuity.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log(`Continuity report written to: ${reportPath}`);
    }

    return report;
}

async function main() {
    try {
        const report = await runContinuityCheck({ root: DEFAULT_ROOT, log: message => console.log(message) });
        console.log(`Summary: ${report.summary.total_characters} characters, ${report.summary.total_stories} stories`);
        console.log(`Hard failures: ${report.summary.hard_failures}`);
        console.log(`Soft warnings: ${report.summary.soft_warnings}`);
        for (const issue of report.issues.hard) {
            if (issue.story) {
                console.log(`  HARD ${issue.story}: ${issue.character} invariant "${issue.invariant}" contradicted by "${issue.found}"`);
            } else {
                console.log(`  HARD ${issue.location}: ${issue.issue}`);
            }
        }
        process.exit(report.summary.hard_failures > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error running continuity check:', error);
        process.exit(1);
    }
}

module.exports = {
    DEFAULT_ROOT,
    buildNameMatcher,
    parseInvariant,
    findPropertyDeclarations,
    splitParagraphs,
    runContinuityCheck
};

if (require.main === module) {
    main();
}
