const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jsyaml = require('js-yaml');
const { normalizeSceneReference, parseManuscriptSceneReferences } = require('../lib/scene_indexer');

/**
 * Manuscript Ordering Engine
 *
 * Provides deterministic insertion operations for manuscript scene ordering
 * with comprehensive error handling and validation.
 */

class OrderingEngine {
  /**
   * Load manuscript frontmatter from manuscript.md
   * @param {string} workDir - Working directory containing manuscript.md
   * @returns {Array} Array of scene paths from the include list
   * @throws {Error} If manuscript.md cannot be read or parsed
   */
  static load(workDir) {
    const manuscriptPath = path.join(workDir, 'manuscript.md');

    if (!fs.existsSync(manuscriptPath)) {
      throw new Error(`Manuscript file not found at: ${manuscriptPath}`);
    }

    try {
      return parseManuscriptSceneReferences(fs.readFileSync(manuscriptPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to parse manuscript frontmatter: ${error.message}`);
    }
  }

  /**
   * Save include list back to manuscript.md
   * @param {string} workDir - Working directory containing manuscript.md
   * @param {Array} includeList - Array of scene paths to save
   * @throws {Error} If manuscript.md cannot be written
   */
  static save(workDir, includeList) {
    const manuscriptPath = path.join(workDir, 'manuscript.md');

    if (!fs.existsSync(manuscriptPath)) {
      throw new Error(`Manuscript file not found at: ${manuscriptPath}`);
    }

    try {
      const fileContent = fs.readFileSync(manuscriptPath, 'utf8');
      const header = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      const frontmatter = header ? jsyaml.load(header[1]) || {} : {};
      if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
        throw new Error('Manuscript frontmatter must be a YAML object');
      }
      const references = OrderingEngine.normalizeList(includeList);
      const priorEntries = Array.isArray(frontmatter.scenes) ? frontmatter.scenes
        : Array.isArray(frontmatter.include) ? frontmatter.include : [];
      const previousByFile = new Map();
      for (const entry of priorEntries) {
        const reference = normalizeSceneReference(entry);
        if (reference && !previousByFile.has(reference.toLowerCase())) {
          previousByFile.set(reference.toLowerCase(), entry);
        }
      }
      // A single object representation retains existing title/order metadata.
      const scenes = references.map(reference => {
        const prior = previousByFile.get(reference.toLowerCase());
        const id = path.posix.basename(reference, '.md');
        return prior && typeof prior === 'object'
          ? { ...prior, id: prior.id || id, file: reference }
          : { id, file: reference };
      });
      const updatedFrontmatter = { ...frontmatter, scenes };
      delete updatedFrontmatter.include;
      const eol = fileContent.includes('\r\n') ? '\r\n' : '\n';
      const frontmatterYaml = jsyaml.dump(updatedFrontmatter, { lineWidth: -1 }).replace(/\n/g, eol);
      const body = header ? fileContent.slice(header[0].length) : fileContent;
      const newContent = `---${eol}${frontmatterYaml}---${eol}${body}`;
      const tempPath = `${manuscriptPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
      try {
        fs.writeFileSync(tempPath, newContent, {
          encoding: 'utf8', flag: 'wx', mode: fs.statSync(manuscriptPath).mode & 0o777
        });
        fs.renameSync(tempPath, manuscriptPath);
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    } catch (error) {
      throw new Error(`Failed to save manuscript frontmatter: ${error.message}`);
    }
  }

  /**
   * Extract a scene ID from a scene path (SC-0001 or SCENE_* forms)
   * @param {string} scenePath - Scene file path
   * @returns {string} SC-ID
   */
  static extractSceneId(scenePath) {
    const reference = normalizeSceneReference(scenePath);
    if (!reference) return null;
    const id = path.posix.basename(reference, '.md');
    return /^(SC-\d{4,}|SCENE_[A-Z0-9_-]+)$/i.test(id) ? id : null;
  }

  static normalizeList(includeList) {
    if (!Array.isArray(includeList)) throw new Error('includeList must be an array');
    const seen = new Set();
    const list = [];
    for (const entry of includeList) {
      const reference = normalizeSceneReference(entry);
      if (!reference) throw new Error(`Invalid scene reference: ${JSON.stringify(entry)}`);
      const key = reference.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(reference);
      }
    }
    return list;
  }

  /**
   * Insert scene into include list with various positioning modes
   * @param {Array} includeList - Current include list
   * @param {string} sceneRelPath - Scene path to insert
   * @param {Object} options - Insertion options
   * @param {string} options.mode - Insertion mode (first, last, before, after, index, midpoint)
   * @param {string|number} options.value - Reference value for mode
   * @returns {Array} New include list with scene inserted
   * @throws {Error} For invalid operations
   */
  static insert(includeList, sceneRelPath, { mode, value }) {
    // Validate inputs
    if (!Array.isArray(includeList)) {
      throw new Error('includeList must be an array');
    }

    if (typeof sceneRelPath !== 'string' || !sceneRelPath.trim()) {
      throw new Error('sceneRelPath must be a non-empty string');
    }

    if (!mode || !['first', 'last', 'before', 'after', 'index', 'midpoint'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Must be one of: first, last, before, after, index, midpoint`);
    }

    const sceneReference = normalizeSceneReference(sceneRelPath);
    if (!sceneReference) throw new Error(`Invalid scene reference: ${sceneRelPath}`);
    const original = OrderingEngine.normalizeList(includeList);
    const sceneKey = sceneReference.toLowerCase();
    const newList = original.filter(reference => reference.toLowerCase() !== sceneKey);

    if ((mode === 'before' || mode === 'after') &&
        normalizeSceneReference(value)?.toLowerCase() === sceneKey &&
        original.some(reference => reference.toLowerCase() === sceneKey)) {
      return original;
    }

    const findTarget = () => {
      if (typeof value !== 'string') {
        throw new Error(`For "${mode}" mode, value must be a scene reference`);
      }
      const target = normalizeSceneReference(value);
      if (!target) throw new Error(`Invalid reference scene: ${value}`);
      const index = newList.findIndex(reference => reference.toLowerCase() === target.toLowerCase());
      if (index === -1) throw new Error(`Reference scene ${value} not found in include list`);
      return index;
    };

    // Handle each insertion mode
    switch (mode) {
      case 'first':
        newList.unshift(sceneReference);
        break;

      case 'last':
        newList.push(sceneReference);
        break;

      case 'before': {
        const targetIndex = findTarget();
        newList.splice(targetIndex, 0, sceneReference);
        break;
      }

      case 'after': {
        const targetIndex = findTarget();
        newList.splice(targetIndex + 1, 0, sceneReference);
        break;
      }

      case 'index': {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          throw new Error('For "index" mode, value must be a non-negative integer');
        }

        if (value > original.length) {
          throw new Error(`Index ${value} is out of bounds for list of length ${original.length}`);
        }

        newList.splice(Math.min(value, newList.length), 0, sceneReference);
        break;
      }

      case 'midpoint': {
        const midpoint = Math.floor(newList.length / 2);
        newList.splice(midpoint, 0, sceneReference);
        break;
      }

      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }

    return newList;
  }
}

// Export the engine
module.exports = OrderingEngine;

// CLI interface for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node ordering.js <workDir> <scenePath> <mode> [value]');
    console.log('Modes: first, last, before, after, index, midpoint');
    process.exit(1);
  }

  const [workDir, scenePath, mode, value] = args;

  try {
    const engine = new OrderingEngine();
    const includeList = OrderingEngine.load(workDir);

    // Convert value to appropriate type based on mode
    let processedValue = value;
    if (mode === 'index' && value !== undefined) {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue)) {
        throw new Error('Index value must be a valid integer');
      }
    }

    const newList = OrderingEngine.insert(includeList, scenePath, { mode, value: processedValue });
    OrderingEngine.save(workDir, newList);

    console.log(`Successfully inserted ${scenePath} using mode ${mode}`);
    console.log('New order:', newList);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
