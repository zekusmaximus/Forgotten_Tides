const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const jsyaml = require('js-yaml');

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
      const fileContent = fs.readFileSync(manuscriptPath, 'utf8');
      const { data: frontmatter } = matter(fileContent);

      // Handle both 'scenes' and 'include' fields for backward compatibility
      const includeList = frontmatter.scenes || frontmatter.include || [];
      return Array.isArray(includeList) ? includeList : [];
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
      const { data: frontmatter, content } = matter(fileContent);

      // Update the frontmatter with the new include list
      const updatedFrontmatter = {
        ...frontmatter,
        scenes: includeList
      };

      // Convert to YAML and write back
      const newContent = matter.stringify(content, updatedFrontmatter);
      fs.writeFileSync(manuscriptPath, newContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save manuscript frontmatter: ${error.message}`);
    }
  }

  /**
   * Extract SC-ID from scene path (e.g., "scenes/SC-0001.md" -> "SC-0001")
   * @param {string} scenePath - Scene file path
   * @returns {string} SC-ID
   */
  static extractSceneId(scenePath) {
    const match = scenePath.match(/SC-(\d{4})/);
    return match ? match[0] : null;
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

    // Deduplicate - remove existing entry if present
    const dedupedList = includeList.filter(item => item !== sceneRelPath);
    const newList = [...dedupedList];

    // Handle each insertion mode
    switch (mode) {
      case 'first':
        newList.unshift(sceneRelPath);
        break;

      case 'last':
        newList.push(sceneRelPath);
        break;

      case 'before': {
        if (typeof value !== 'string') {
          throw new Error('For "before" mode, value must be a scene reference (SC-ID)');
        }

        const targetIndex = includeList.findIndex(item => item.includes(value));
        if (targetIndex === -1) {
          throw new Error(`Reference scene ${value} not found in include list`);
        }

        newList.splice(targetIndex, 0, sceneRelPath);
        break;
      }

      case 'after': {
        if (typeof value !== 'string') {
          throw new Error('For "after" mode, value must be a scene reference (SC-ID)');
        }

        const targetIndex = includeList.findIndex(item => item.includes(value));
        if (targetIndex === -1) {
          throw new Error(`Reference scene ${value} not found in include list`);
        }

        newList.splice(targetIndex + 1, 0, sceneRelPath);
        break;
      }

      case 'index': {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          throw new Error('For "index" mode, value must be a non-negative integer');
        }

        if (value > includeList.length) {
          throw new Error(`Index ${value} is out of bounds for list of length ${includeList.length}`);
        }

        newList.splice(value, 0, sceneRelPath);
        break;
      }

      case 'midpoint': {
        const midpoint = Math.floor(includeList.length / 2);
        newList.splice(midpoint, 0, sceneRelPath);
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