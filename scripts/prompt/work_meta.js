#!/usr/bin/env node

/**
 * Work Metadata Management for Forgotten Tides
 * Handles meta.yaml creation, updates, and maintenance for work directories
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

/**
 * Get current ISO timestamp
 * @returns {string} Current date/time in ISO format
 */
function getCurrentISO() {
  return new Date().toISOString();
}

/**
 * Ensure meta.yaml exists and has required fields
 * @param {string} workDir - Path to work directory
 * @param {Object} options - Optional fields to merge
 * @param {string} options.title - Human-readable title
 * @param {string} options.status - Work status (default: 'draft')
 * @returns {Object} The meta data object
 */
function ensureMeta(workDir, options = {}) {
  const metaPath = path.join(workDir, 'meta.yaml');
  let metaData = {};

  // Default values
  const workId = path.basename(workDir);
  const defaults = {
    id: workId,
    title: options.title || workId,
    status: options.status || 'draft',
    created: getCurrentISO(),
    modified: getCurrentISO()
  };

  // Load existing meta if it exists
  if (fs.existsSync(metaPath)) {
    try {
      const fileContent = fs.readFileSync(metaPath, 'utf8');
      metaData = yaml.load(fileContent) || {};

      // Preserve existing created date if present
      if (metaData.created) {
        defaults.created = metaData.created;
      }
    } catch (error) {
      console.error(`Error reading existing meta.yaml: ${error.message}`);
      // Continue with defaults if reading fails
    }
  }

  // Merge with defaults (defaults take precedence for required fields)
  metaData = { ...metaData, ...defaults };

  // Ensure modified timestamp is updated
  metaData.modified = getCurrentISO();

  // Write the meta file atomically
  try {
    const yamlContent = yaml.dump(metaData, {
      lineWidth: -1, // Disable line wrapping
      noCompatMode: true
    });

    // Write to temporary file first, then rename for atomicity
    const tempPath = `${metaPath}.tmp`;
    fs.writeFileSync(tempPath, yamlContent);
    fs.renameSync(tempPath, metaPath);

    return metaData;
  } catch (error) {
    console.error(`Error writing meta.yaml: ${error.message}`);
    throw error;
  }
}

/**
 * Update modified timestamp in meta.yaml
 * @param {string} workDir - Path to work directory
 * @returns {Object} The updated meta data object
 */
function touchModified(workDir) {
  const metaPath = path.join(workDir, 'meta.yaml');

  if (!fs.existsSync(metaPath)) {
    // If meta.yaml doesn't exist, create it with defaults
    return ensureMeta(workDir);
  }

  try {
    // Read existing meta
    const fileContent = fs.readFileSync(metaPath, 'utf8');
    const metaData = yaml.load(fileContent) || {};

    // Update modified timestamp
    metaData.modified = getCurrentISO();

    // Write back atomically
    const yamlContent = yaml.dump(metaData, {
      lineWidth: -1,
      noCompatMode: true
    });

    const tempPath = `${metaPath}.tmp`;
    fs.writeFileSync(tempPath, yamlContent);
    fs.renameSync(tempPath, metaPath);

    return metaData;
  } catch (error) {
    console.error(`Error updating meta.yaml: ${error.message}`);
    throw error;
  }
}

/**
 * Get meta data from work directory
 * @param {string} workDir - Path to work directory
 * @returns {Object|null} The meta data object or null if not found
 */
function getMeta(workDir) {
  const metaPath = path.join(workDir, 'meta.yaml');

  if (!fs.existsSync(metaPath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(metaPath, 'utf8');
    return yaml.load(fileContent) || null;
  } catch (error) {
    console.error(`Error reading meta.yaml: ${error.message}`);
    return null;
  }
}

module.exports = {
  ensureMeta,
  touchModified,
  getMeta
};