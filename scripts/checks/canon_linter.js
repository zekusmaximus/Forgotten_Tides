#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const RED_LINES = [
    {
        pattern: /anchor (regrew|regenerated|restored|recovered)/i,
        message: "Violation: Anchors CANNOT regrow, regenerate, or be restored.",
        severity: "error"
    },
    {
        pattern: /Rell.*(restored|recovered|got back).*anchor/i,
        message: "Violation: Rell's burned anchors can NEVER be restored.",
        severity: "error"
    },
    {
        pattern: /Heliodrome.*(resolved|fixed|repaired|spontaneously)/i,
        message: "Violation: The Heliodrome cannot spontaneously resolve or be easily fixed.",
        severity: "error"
    },
    {
        pattern: /Corridor.*without.*memory/i,
        message: "Violation: Corridors cannot function without memory input.",
        severity: "error"
    },
    {
        pattern: /Sutira.*(hysterically|uncontrollably|broke down)/i,
        message: "Warning: Sutira cannot casually break emotionally; her breakdowns must be controlled.",
        severity: "warning"
    },
    {
        pattern: /Tari.*(naive|clueless|stupid)/i,
        message: "Warning: Tari must never be written as naive; he is innocent but perceptive.",
        severity: "warning"
    }
];

async function runLinter() {
    console.log("Running Canon Linter...");
    let errorCount = 0;
    let warningCount = 0;

    const storyFiles = glob.sync('stories/**/*.md', { cwd: process.cwd() });
    const rootStories = glob.sync('*.md', { cwd: process.cwd() }).filter(f => f !== 'README.md' && f !== 'CANONICAL_INDEX.md' && f !== 'CONTRIBUTING.md');
    
    const allFiles = [...storyFiles, ...rootStories];

    for (const file of allFiles) {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const redLine of RED_LINES) {
                if (redLine.pattern.test(line)) {
                    const label = redLine.severity === 'error' ? '\x1b[31mERROR\x1b[0m' : '\x1b[33mWARNING\x1b[0m';
                    console.log(`${label} in ${file}:${i + 1}: ${redLine.message}`);
                    console.log(`  > ${line.trim()}`);
                    
                    if (redLine.severity === 'error') errorCount++;
                    else warningCount++;
                }
            }
        }
    }

    console.log(`\nLinter finished with ${errorCount} errors and ${warningCount} warnings.`);
    
    if (errorCount > 0) {
        process.exit(1);
    }
}

runLinter().catch(err => {
    console.error(err);
    process.exit(1);
});
