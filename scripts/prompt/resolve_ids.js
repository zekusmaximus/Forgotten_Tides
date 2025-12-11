// scripts/prompt/resolve_ids.js
// Natural-language → relevant canonical IDs by scanning YAML frontmatter.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let globSync;
try {
  ({ sync: globSync } = require("glob"));
} catch (e) {
  globSync = null;
}

let matter;
try {
  matter = require("gray-matter");
} catch (e) {
  matter = null;
}

const DATA_DIRS = [
  "data/characters", "data/locations", "data/factions",
  "data/mechanics", "data/rulesets", "data/timeline"
];
const STORY_DIRS = ["stories/shorts", "stories/novels"];
const LEXICON = "data/lexicon/terms.yaml";

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir);
  for (const ent of entries) {
    const full = path.join(dir, ent);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, files);
    } else if (stat.isFile() && full.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function fallbackGlob(pattern) {
  const brace = pattern.match(/^\{(.+)\}\/\*\*\/\*\.md$/);
  if (brace) {
    const bases = brace[1].split(",").map((p) => p.trim()).filter(Boolean);
    return bases.flatMap((b) => walkDir(b));
  }

  const dirMatch = pattern.match(/^(.+)\/\*\*\/\*\.md$/);
  if (dirMatch) return walkDir(dirMatch[1]);

  return [];
}

function globFiles(pattern, options) {
  if (globSync) {
    try {
      return globSync(pattern, options);
    } catch (e) {
      // fall through to fallback
    }
  }
  return fallbackGlob(pattern);
}

function parseMatter(raw) {
  if (matter) {
    try {
      return matter(raw);
    } catch (e) {
      // fall back to manual parsing
    }
  }

  if (!raw.startsWith("---")) return { data: {}, content: raw };
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, content: raw };
  let data = {};
  try {
    data = yaml.load(match[1]) || {};
  } catch (e) {
    data = {};
  }
  const content = raw.slice(match[0].length);
  return { data, content };
}

function readFrontmatter(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseMatter(raw);
    const meta = fm.data || {};
    return { meta, body: fm.content || "" };
  } catch (e) {
    return { meta: {}, body: "" };
  }
}

function tokenize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\-_' ]+/g, " ").split(/\s+/).filter(Boolean);
}

function scoreField(text, qTokens, w) {
  const t = tokenize(text);
  const set = new Set(t);
  let score = 0;
  for (const qt of qTokens) if (set.has(qt)) score += w;
  return score;
}

function collectEntities() {
  const items = [];

  const dataFiles = DATA_DIRS.flatMap(d => globFiles(`${d}/**/*.md`, { nodir: true }));
  for (const f of dataFiles) {
    const { meta } = readFrontmatter(f);
    if (!meta || !meta.id) continue;
    items.push({
      id: meta.id, type: meta.type || "entity", name: meta.name || meta.title || "",
      aliases: meta.aliases || [], tags: meta.tags || [],
      summaries: [meta.summary_50 || "", meta.summary_200 || "", meta.summary_600 || ""],
      path: f
    });
  }

  const storyFiles = STORY_DIRS.flatMap(d => globFiles(`${d}/**/*.md`, { nodir: true }));
  for (const f of storyFiles) {
    const { meta } = readFrontmatter(f);
    if (meta && meta.id) {
      items.push({
        id: meta.id, type: meta.type || "story", name: meta.title || "",
        aliases: [], tags: meta.tags || [],
        summaries: [meta.summary_50 || "", meta.summary_200 || ""],
        path: f
      });
    }
  }

  if (fs.existsSync(LEXICON)) {
    let lx = {};
    try {
      lx = yaml.load(fs.readFileSync(LEXICON, "utf8")) || {};
    } catch (e) {
      lx = {};
    }
    for (const t of (lx.terms || [])) {
      items.push({
        id: t.id || `TERM-${(t.term || "").replace(/\s+/g, "-")}`,
        type: "term",
        name: t.term || "",
        aliases: [],
        tags: [t.category || ""],
        summaries: [t.definition || ""],
        path: LEXICON
      });
    }
  }
  return items;
}

function resolveIDs(query) {
  const qTokens = tokenize(query);
  const items = collectEntities();
  const scored = [];

  for (const it of items) {
    let s = 0;
    s += scoreField(it.name, qTokens, 5);
    for (const a of it.aliases) s += scoreField(a, qTokens, 4);
    for (const t of it.tags) s += scoreField(t, qTokens, 3);
    for (const sum of it.summaries) s += scoreField(sum, qTokens, 1);
    if (s > 0) scored.push({ id: it.id, type: it.type, score: s });
  }

  scored.sort((a, b) => b.score - a.score);
  const out = [];
  const seen = new Set();
  for (const r of scored) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r.id);
    if (out.length >= 12) break;
  }
  return out;
}

if (require.main === module) {
  const q = process.argv.slice(2).join(" ").trim();
  if (!q) {
    console.error("Usage: node scripts/prompt/resolve_ids.js \"natural language query\"");
    process.exit(2);
  }
  const ids = resolveIDs(q);
  process.stdout.write(ids.join("\n"));
}

module.exports = { resolve: resolveIDs };
