const fs = require('fs');
const path = require('path');

// Copy the relevant functions from extract_metadata.js
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function normalizedLevenshtein(a, b) {
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : levenshteinDistance(a, b) / maxLen;
}

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

function findAllWorks() {
    const storiesDir = path.join(__dirname, 'stories');
    const works = [];

    const categories = ['shorts', 'novella', 'novels'];
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

// Test the extraction
const query = "save this as a scene for First Corridor and place this as the opening scene";
const works = findAllWorks();

console.log('Found works:', works.map(w => w.title));

for (const work of works) {
    const distance = normalizedLevenshtein(work.title.toLowerCase(), query.toLowerCase());
    console.log(`Distance between "${work.title}" and query: ${distance}`);
    console.log(`Threshold check (${distance} < 0.5): ${distance < 0.5}`);
}