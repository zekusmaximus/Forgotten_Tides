#!/usr/bin/env node

// A publication has an explicit table of contents. Plan it before assembling it.
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { discoverManuscripts, renderCompilation } = require('./compile_stories');
const { WORK_KINDS, resolveWithin, validatePathSegment } = require('./lib/path_safety');

function manifestFile(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim() ||
      path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
    throw new Error('Publication manifest must be a relative path inside the repository.');
  }
  const segments = relativePath.replace(/\\/g, '/').split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('Publication manifest path must not contain empty, . or .. segments.');
  }
  return resolveWithin(root, ...segments);
}

function loadPublicationPlan(repoRoot, manifestPath) {
  const root = fs.realpathSync(repoRoot);
  const file = manifestFile(root, manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read publication manifest ${manifestPath}: ${error.message}`);
  }
  if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object' ||
      typeof manifest.title !== 'string' || !manifest.title.trim() ||
      !Array.isArray(manifest.works) || manifest.works.length === 0) {
    throw new Error('Publication manifest requires a title and a nonempty ordered works array.');
  }

  const available = new Map(discoverManuscripts(root)
    .map(manuscript => [`${manuscript.kind}/${manuscript.work}`, manuscript]));
  const seen = new Set();
  const works = manifest.works.map((entry, index) => {
    if (!entry || Array.isArray(entry) || typeof entry !== 'object' ||
        !WORK_KINDS.includes(entry.kind)) {
      throw new Error(`Publication work ${index + 1} requires a valid kind.`);
    }
    validatePathSegment(entry.work, `publication work ${index + 1}`);
    const key = `${entry.kind}/${entry.work}`;
    if (seen.has(key)) throw new Error(`Duplicate publication work: ${key}`);
    seen.add(key);
    const manuscript = available.get(key);
    if (!manuscript) throw new Error(`Publication work not found: ${key}`);
    const data = matter(fs.readFileSync(manuscript.path, 'utf8')).data;
    return {
      ...manuscript,
      id: data.id || '(no ID)',
      title: data.title || manuscript.work,
      canon_tier: data.canon_tier || 'unclassified',
      status: data.status || 'unspecified'
    };
  });
  return { title: manifest.title.trim(), works, root, manifestPath };
}

function publicationPlanText(plan) {
  const singleLine = value => String(value).replace(/\s+/g, ' ').trim();
  const lines = [`Publication plan: ${singleLine(plan.title)}`, `Manifest: ${plan.manifestPath}`, ''];
  plan.works.forEach((work, index) => {
    lines.push(`${index + 1}. ${singleLine(work.title)} (${singleLine(work.id)}; ${singleLine(work.canon_tier)}; ${singleLine(work.status)})`);
    lines.push(`   stories/${work.kind}/${work.work}/manuscript.md`);
  });
  lines.push('', 'Review this selection and order before running --assemble.');
  return `${lines.join('\n')}\n`;
}

function buildPublication(repoRoot, manifestPath) {
  const plan = loadPublicationPlan(repoRoot, manifestPath);
  return renderCompilation(plan.root, plan.works);
}

function main(args) {
  let root = path.resolve(__dirname, '..');
  let manifestPath;
  let mode;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--root' && args[index + 1]) root = args[++index];
    else if (arg === '--manifest' && args[index + 1]) manifestPath = args[++index];
    else if ((arg === '--plan' || arg === '--assemble') && !mode) mode = arg;
    else throw new Error('Usage: node scripts/compile_publication.js --manifest PATH (--plan | --assemble) [--root REPOSITORY]');
  }
  if (!manifestPath || !mode) {
    throw new Error('Usage: node scripts/compile_publication.js --manifest PATH (--plan | --assemble) [--root REPOSITORY]');
  }
  process.stdout.write(mode === '--plan'
    ? publicationPlanText(loadPublicationPlan(root, manifestPath))
    : buildPublication(root, manifestPath));
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`Publication compilation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { loadPublicationPlan, publicationPlanText, buildPublication };
