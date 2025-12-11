const fs = require('fs');
const path = require('path');

// Copy the findAllWorks function from extract_metadata.js
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

const works = findAllWorks();
console.log('Found works:', JSON.stringify(works, null, 2));