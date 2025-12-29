const path = require('path');
const { glob } = require('glob');
const { loadFrontmatter } = require('./file_loader');

function detectWorkId(filePath, data) {
  if (data.work_id) return data.work_id;
  // Attempt to infer from path: stories/<type>/<work>/scenes/<file>
  const parts = filePath.split(path.sep);
  const scenesIndex = parts.lastIndexOf('scenes');
  if (scenesIndex > 1) {
    return parts[scenesIndex - 1];
  }
  return null;
}

function collectScenes(filter = {}) {
  const files = glob.sync('stories/**/scenes/*.md', { cwd: process.cwd(), nodir: true, absolute: true, windowsPathsNoEscape: true });
  const scenes = files.map(filePath => {
    const parsed = loadFrontmatter(filePath);
    const workId = detectWorkId(filePath, parsed.data);
    return {
      id: parsed.data.id || path.basename(filePath, path.extname(filePath)),
      workId,
      path: filePath,
      data: parsed.data,
      content: parsed.content,
      wordCount: (parsed.content || '').trim().split(/\s+/).filter(Boolean).length
    };
  }).filter(scene => {
    if (filter.work && scene.workId) {
      return scene.workId.toLowerCase() === filter.work.toLowerCase();
    }
    return true;
  });
  scenes.sort((a, b) => a.path.localeCompare(b.path));
  return scenes;
}

module.exports = {
  collectScenes
};
