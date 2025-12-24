#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Updated Glossary Enforcer
 * Now uses structured YAML data from data/lexicon/terms.yaml
 */

// Load glossary terms from structured YAML
function loadGlossaryTerms() {
  const glossaryPath = path.join(__dirname, '../../data/lexicon/terms.yaml');
  const terms = new Set();
  const termMap = new Map(); // For additional metadata

  if (!fs.existsSync(glossaryPath)) {
    console.warn('⚠️  No terms.yaml found, falling back to legacy GLOSSARY.md');
    return loadLegacyGlossaryTerms();
  }

  try {
    const content = fs.readFileSync(glossaryPath, 'utf8');
    const yamlData = yaml.load(content);

    if (yamlData.terms && Array.isArray(yamlData.terms)) {
      yamlData.terms.forEach(termObj => {
        const term = termObj.term;
        terms.add(term);

        // Add aliases if present
        if (termObj.aliases && Array.isArray(termObj.aliases)) {
          termObj.aliases.forEach(alias => {
            terms.add(alias);
            termMap.set(alias, term); // Map alias to canonical term
          });
        }

        termMap.set(term, termObj); // Store full term data
      });
    }

    return { terms, termMap };
  } catch (error) {
    console.error(`❌ Error loading terms.yaml: ${error.message}`);
    return loadLegacyGlossaryTerms();
  }
}

// Fallback to legacy GLOSSARY.md if YAML not available
function loadLegacyGlossaryTerms() {
  const glossaryPath = path.join(__dirname, '../../lexicon/GLOSSARY.md');
  const terms = new Set();

  if (!fs.existsSync(glossaryPath)) {
    console.warn('⚠️  No GLOSSARY.md found, skipping glossary enforcement');
    return { terms, termMap: new Map() };
  }

  try {
    const content = fs.readFileSync(glossaryPath, 'utf8');

    // Extract terms from markdown headings like "### Term"
    const termMatches = content.matchAll(/###\s+([A-Z][a-zA-Z\s-]+)/g);
    for (const match of termMatches) {
      terms.add(match[1].trim());
    }

    return { terms, termMap: new Map() };
  } catch (error) {
    console.error(`❌ Error loading legacy glossary: ${error.message}`);
    return { terms, termMap: new Map() };
  }
}

// Load ignore list
function loadIgnoreList(ignorePath) {
  const ignored = new Set();

  if (fs.existsSync(ignorePath)) {
    try {
      const content = fs.readFileSync(ignorePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach(line => {
        const term = line.trim();
        if (term) {
          ignored.add(term);
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not load ignore list: ${error.message}`);
    }
  }

  return ignored;
}

function loadGlobalIgnoreList() {
  const ignorePath = path.join(__dirname, '../../docs/lint/glossary_ignore.txt');
  return loadIgnoreList(ignorePath);
}

function loadDirectoryIgnoreList(filePath) {
  const ignored = new Set();
  let currentDir = path.dirname(filePath);
  const repoRoot = path.resolve(__dirname, '../..');

  while (currentDir.startsWith(repoRoot)) {
    const ignorePath = path.join(currentDir, '.glossary_ignore.txt');
    const localIgnored = loadIgnoreList(ignorePath);
    localIgnored.forEach(term => ignored.add(term));

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return ignored;
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function suggestClosestTerms(term, glossaryTerms) {
  const normalizedTerm = term.toLowerCase();
  const candidates = [];

  glossaryTerms.forEach(glossaryTerm => {
    const distance = levenshteinDistance(normalizedTerm, glossaryTerm.toLowerCase());
    candidates.push({ term: glossaryTerm, distance });
  });

  candidates.sort((a, b) => a.distance - b.distance);
  const maxDistance = Math.max(3, Math.floor(term.length * 0.3));
  return candidates.filter(candidate => candidate.distance <= maxDistance).slice(0, 3).map(candidate => candidate.term);
}

// Scan markdown files for capitalized multiword terms
function scanForGlossaryTerms(filePath, glossaryTerms, ignoredTerms, termMap) {
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    const lines = content.split('\n');
    let startLine = 0;

    if (lines[0] && lines[0].trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          startLine = i + 1;
          break;
        }
      }
    }

    // Regex for capitalized multiword terms (2+ words, title case)
    // This matches terms like "Memory Drive", "Conceptual Drift", etc.
    const termRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;

    for (let lineIndex = startLine; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const matches = line.matchAll(termRegex);

      for (const match of matches) {
        const term = match[1];
        if (!glossaryTerms.has(term) && !ignoredTerms.has(term)) {
          const suggestions = suggestClosestTerms(term, glossaryTerms);
          warnings.push({
            file: filePath,
            line: lineIndex + 1,
            term,
            suggestions
          });
        }
      }
    }

    return warnings;
  } catch (error) {
    console.error(`❌ Error scanning ${filePath}: ${error.message}`);
    return warnings;
  }
}

// Walk stories directory and check for glossary terms
function checkStoriesDirectory(glossaryTerms, ignoredTerms, termMap) {
  const storiesDir = path.join(__dirname, '../../stories');
  let hasWarnings = false;

  if (!fs.existsSync(storiesDir)) {
    return false;
  }

  const files = fs.readdirSync(storiesDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(storiesDir, file);
      const directoryIgnored = loadDirectoryIgnoreList(filePath);
      const combinedIgnored = new Set([...ignoredTerms, ...directoryIgnored]);
      const warnings = scanForGlossaryTerms(filePath, glossaryTerms, combinedIgnored, termMap);

      if (warnings.length > 0) {
        warnings.forEach(warning => {
          console.log(JSON.stringify({
            level: 'warn',
            file: path.relative(process.cwd(), warning.file),
            line: warning.line,
            term: warning.term,
            suggestions: warning.suggestions
          }));
        });
        hasWarnings = true;
      } else {
        console.log(JSON.stringify({
          level: 'info',
          file: path.relative(process.cwd(), filePath),
          status: 'ok'
        }));
      }
    }
  });

  return hasWarnings;
}

// Main execution
function main() {
  console.log('🔍 Enforcing glossary terms from structured YAML...');

  const { terms: glossaryTerms, termMap } = loadGlossaryTerms();
  const ignoredTerms = loadGlobalIgnoreList();

  if (glossaryTerms.size === 0) {
    console.log('ℹ️  No glossary terms loaded, skipping check');
    process.exit(0);
  }

  console.log(`📚 Loaded ${glossaryTerms.size} glossary terms from structured data`);
  if (ignoredTerms.size > 0) {
    console.log(`🚫 Ignoring ${ignoredTerms.size} terms from ignore list`);
  }

  const hasWarnings = checkStoriesDirectory(glossaryTerms, ignoredTerms, termMap);

  if (hasWarnings) {
    console.log('\n⚠️  Found terms not in glossary (warnings only, exit code 0)');
    process.exit(0); // Warnings don't fail the build
  } else {
    console.log('✅ All capitalized multiword terms are in glossary');
    process.exit(0);
  }
}

main();
