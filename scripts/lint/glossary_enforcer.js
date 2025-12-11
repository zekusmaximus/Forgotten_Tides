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
function loadIgnoreList() {
  const ignorePath = path.join(__dirname, '../../docs/lint/glossary_ignore.txt');
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

// Scan markdown files for capitalized multiword terms
function scanForGlossaryTerms(filePath, glossaryTerms, ignoredTerms, termMap) {
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip frontmatter
    const bodyMatch = content.match(/^---\s*([\s\S]*?)\s*---([\s\S]*)/);
    const bodyContent = bodyMatch ? bodyMatch[2] : content;

    // Regex for capitalized multiword terms (2+ words, title case)
    // This matches terms like "Memory Drive", "Conceptual Drift", etc.
    const termRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const matches = bodyContent.matchAll(termRegex);
    const foundTerms = new Set();

    for (const match of matches) {
      const term = match[1];
      foundTerms.add(term);
    }

    // Check which found terms are not in glossary and not ignored
    foundTerms.forEach(term => {
      if (!glossaryTerms.has(term) && !ignoredTerms.has(term)) {
        warnings.push(`⚠️  Term "${term}" not found in glossary`);
      }
    });

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
      const warnings = scanForGlossaryTerms(filePath, glossaryTerms, ignoredTerms, termMap);

      if (warnings.length > 0) {
        console.log(`\n📄 ${filePath}`);
        warnings.forEach(warning => console.log(`  ${warning}`));
        hasWarnings = true;
      } else {
        console.log(`✅ ${filePath} - All terms in glossary`);
      }
    }
  });

  return hasWarnings;
}

// Main execution
function main() {
  console.log('🔍 Enforcing glossary terms from structured YAML...');

  const { terms: glossaryTerms, termMap } = loadGlossaryTerms();
  const ignoredTerms = loadIgnoreList();

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