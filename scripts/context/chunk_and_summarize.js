const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

const DEFAULT_GLOBS = [
  'mechanics/**/*.md',
  'lore/**/*.md',
  'stories/**/*.md',
  'characters/**/*.md',
  'bible/**/*.md',
  'manuals/**/*.md',
  'design/**/*.md',
  'atlas/**/*.md',
  'factions/**/*.md',
  'docs/**/*.md'
];

const MAX_CHARS = Number.parseInt(process.env.CHUNK_MAX_CHARS || '1400', 10);
const MIN_CHARS = Number.parseInt(process.env.CHUNK_MIN_CHARS || '400', 10);
const OUTPUT_DIR = path.resolve(process.env.CHUNK_OUT_DIR || 'out/chunks');
const ROOT_DIR = path.resolve(process.env.CHUNK_ROOT_DIR || process.cwd());

const ignore = ['**/node_modules/**', '**/out/**', '**/.git/**'];

const normalizeText = (text) => text.replace(/\r\n/g, '\n');

const stripMarkdown = (text) => text
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
  .replace(/[*_>#-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const summarizeChunk = (chunk) => {
  const text = stripMarkdown(chunk);
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(' ');
  return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
};

const chunkByHeadings = (content, maxChars) => {
  const lines = normalizeText(content).split('\n');
  const sections = [];
  let buffer = [];

  const pushBuffer = () => {
    if (buffer.length) {
      sections.push(buffer.join('\n').trim());
      buffer = [];
    }
  };

  lines.forEach((line) => {
    if (/^#{1,3}\s+/.test(line) && buffer.length) {
      pushBuffer();
    }
    buffer.push(line);
  });
  pushBuffer();

  const chunks = [];
  sections.forEach((section) => {
    if (section.length <= maxChars) {
      chunks.push(section);
      return;
    }
    const paragraphs = section.split(/\n{2,}/);
    let current = '';
    paragraphs.forEach((paragraph) => {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
      if (candidate.length > maxChars && current) {
        chunks.push(current.trim());
        current = paragraph;
      } else {
        current = candidate;
      }
    });
    if (current.trim()) {
      chunks.push(current.trim());
    }
  });

  return chunks.filter(Boolean);
};

const buildOutputPath = (filePath) => {
  const relative = path.relative(ROOT_DIR, filePath).replace(/\.md$/i, '');
  const slug = relative.split(path.sep).join('__');
  return path.join(OUTPUT_DIR, `${slug}__chunks.json`);
};

const gatherFiles = () => {
  const files = new Set();
  DEFAULT_GLOBS.forEach((pattern) => {
    glob.sync(pattern, { nodir: true, ignore, cwd: ROOT_DIR }).forEach((file) => {
      files.add(path.resolve(ROOT_DIR, file));
    });
  });
  return Array.from(files).sort();
};

const ensureOutputDir = () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
};

const extractTitle = (data, content) => {
  if (data && data.name) return data.name;
  const heading = normalizeText(content).split('\n').find((line) => /^#\s+/.test(line));
  return heading ? heading.replace(/^#\s+/, '').trim() : null;
};

const run = () => {
  ensureOutputDir();
  const files = gatherFiles();
  const results = [];

  files.forEach((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const content = parsed.content.trim();
    if (content.length < MIN_CHARS) return;

    const chunks = chunkByHeadings(content, MAX_CHARS);
    const payload = {
      source: {
        path: path.relative(ROOT_DIR, filePath),
        canonical_id: parsed.data?.canonical_id || null,
        title: extractTitle(parsed.data, content)
      },
      generated_at: new Date().toISOString(),
      chunking: {
        max_chars: MAX_CHARS,
        min_chars: MIN_CHARS,
        total_chunks: chunks.length
      },
      chunks: chunks.map((chunk, index) => {
        const headingMatch = chunk.split('\n').find((line) => /^#{1,3}\s+/.test(line));
        return {
          index: index + 1,
          heading: headingMatch ? headingMatch.replace(/^#{1,3}\s+/, '').trim() : null,
          char_count: chunk.length,
          summary: summarizeChunk(chunk),
          content: chunk
        };
      })
    };

    const outputPath = buildOutputPath(filePath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    results.push({ source: payload.source.path, output: path.relative(ROOT_DIR, outputPath) });
  });

  const manifestPath = path.join(OUTPUT_DIR, 'chunk_manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify({ generated_at: new Date().toISOString(), outputs: results }, null, 2)}\n`);

  console.log(`Chunked ${results.length} file(s). Manifest: ${path.relative(ROOT_DIR, manifestPath)}`);
};

run();
