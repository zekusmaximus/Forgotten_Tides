const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

function loadFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  return {
    path: filePath,
    data: parsed.data || {},
    content: parsed.content || '',
    raw
  };
}

function readYamlFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(raw) || {};
  return { data, raw };
}

function safeJsonParse(content) {
  try {
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listFiles(root, predicate) {
  const out = [];
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach(entry => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!predicate || predicate(full)) {
        out.push(full);
      }
    });
  }
  if (fs.existsSync(root)) {
    walk(root);
  }
  return out;
}

module.exports = {
  loadFrontmatter,
  readYamlFile,
  safeJsonParse,
  ensureDir,
  listFiles
};
