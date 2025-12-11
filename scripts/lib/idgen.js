const crypto = require('crypto');

/**
 * Convert string to uppercase slug format
 * @param {string} s - Input string to slugify
 * @returns {string} Uppercase slug format
 */
function slugify(s) {
    return s
        .toString()
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '')
        .replace(/_+/g, '_');
}

/**
 * Generate deterministic scene ID using SHA1 hash
 * @param {string} title - Scene title
 * @param {string} seedISO - ISO timestamp seed
 * @returns {string} Scene ID in format SCENE_[hash]
 */
function makeSceneId(title, seedISO) {
    const combined = `${title}:${seedISO}`;
    const hash = crypto.createHash('sha1').update(combined).digest('hex');
    return `SCENE_${hash.toUpperCase()}`;
}

/**
 * Generate work ID based on kind (short/novella/novel)
 * @param {string} kind - Work kind (short, novella, novel)
 * @param {string} title - Work title
 * @returns {string} Work ID in format [KIND]_[slugified_title]
 */
function makeWorkId(kind, title) {
    const validKinds = ['short', 'novella', 'novel'];
    if (!validKinds.includes(kind.toLowerCase())) {
        throw new Error(`Invalid work kind: ${kind}. Must be one of: ${validKinds.join(', ')}`);
    }
    const slug = slugify(title);
    return `${kind.toUpperCase()}_${slug}`;
}

module.exports = {
    slugify,
    makeSceneId,
    makeWorkId
};