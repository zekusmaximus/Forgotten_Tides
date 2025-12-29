const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./file_loader');

function defaultOutDir() {
  return path.join(process.cwd(), 'out', 'reports');
}

function writeJsonReport(fileName, payload) {
  const outDir = defaultOutDir();
  ensureDir(outDir);
  const target = path.join(outDir, fileName);
  fs.writeFileSync(target, JSON.stringify(payload, null, 2), 'utf8');
  return target;
}

function writeMarkdownReport(fileName, lines) {
  const outDir = defaultOutDir();
  ensureDir(outDir);
  const target = path.join(outDir, fileName);
  const body = Array.isArray(lines) ? lines.join('\n') : lines;
  fs.writeFileSync(target, body, 'utf8');
  return target;
}

function renderFindings(title, findings) {
  const header = `# ${title}`;
  if (!findings || findings.length === 0) {
    return [header, '', '_No findings_'];
  }
  const rows = findings.map(item => {
    const location = item.file ? ` (${item.file}${item.line ? `:${item.line}` : ''})` : '';
    const severity = item.severity ? `**${item.severity.toUpperCase()}**` : '**info**';
    return `- ${severity}${location}: ${item.message}`;
  });
  return [header, '', ...rows];
}

module.exports = {
  defaultOutDir,
  writeJsonReport,
  writeMarkdownReport,
  renderFindings
};
