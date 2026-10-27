#!/usr/bin/env node

/**
 * Work Metadata Management for Forgotten Tides
 * Handles meta.yaml creation, updates, and maintenance for work directories
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

function loadMetadata(metaPath) {
  const data = yaml.load(fs.readFileSync(metaPath, 'utf8')) || {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Invalid metadata object in ${metaPath}`);
  }
  return data;
}

function writeMetadata(metaPath, data) {
  const tempPath = `${metaPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tempPath, yaml.dump(data, { lineWidth: -1, noCompatMode: true }), { flag: 'wx' });
    fs.renameSync(tempPath, metaPath);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

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
  if (options.type) defaults.type = options.type;

  // Preserve existing metadata on parse failure instead of replacing it.
  if (fs.existsSync(metaPath)) {
    metaData = loadMetadata(metaPath);
    if (metaData.created) defaults.created = metaData.created;
  }

  // Merge with defaults (defaults take precedence for required fields)
  metaData = { ...metaData, ...defaults };

  // Ensure modified timestamp is updated
  metaData.modified = getCurrentISO();

  writeMetadata(metaPath, metaData);
  return metaData;
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
    const metaData = loadMetadata(metaPath);

    // Update modified timestamp
    metaData.modified = getCurrentISO();

    writeMetadata(metaPath, metaData);

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
    return loadMetadata(metaPath);
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
