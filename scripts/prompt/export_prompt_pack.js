// scripts/prompt/export_prompt_pack.js
// Minimal prompt-pack exporter. Given a list of IDs, assembles a small JSON
// with 50/200 summaries, rule bullets, and cross-refs (if present).

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
      // fall through
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

function readFM(p) {
  const raw = fs.readFileSync(p, "utf8");
  const fm = parseMatter(raw);
  return { meta: fm.data || {}, body: fm.content || "" };
}

function findById(id) {
  const dirs = ['characters', 'factions', 'atlas', 'mechanics', 'stories', 'lore', 'data'];
  const files = globFiles(`{${dirs.join(',')}}/**/*.md`, { nodir: true });
  for (const f of files) {
    const { meta, body } = readFM(f);
    if (meta && meta.id === id) return { path: f, meta, body };
  }
  return null;
}

function pack(ids) {
  const entries = [];
  for (const id of ids) {
    const hit = findById(id);
    if (!hit) continue;
    const { path: p, meta } = hit;
    const entry = {
      id: meta.id,
      type: meta.type || "entity",
      name: meta.name || meta.title || meta.id,
      summary_50: meta.summary_50 || "",
      summary_200: meta.summary_200 || "",
      rules: Array.isArray(meta.rules) ? meta.rules : [],
      refs: {
        characters: meta.characters || meta.entities?.characters || [],
        locations: meta.locations || meta.entities?.locations || [],
        factions: meta.factions || [],
        rules_used: meta.rules_used || []
      },
      source: p
    };
    entries.push(entry);
  }
  entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { created_at: new Date().toISOString(), entries };
}

if (require.main === module) {
  const ids = process.argv.slice(2).filter(Boolean);
  if (!ids.length) {
    console.error("Usage: node scripts/prompt/export_prompt_pack.js ID [ID ...]");
    process.exit(2);
  }
  if (!fs.existsSync("out/prompts")) fs.mkdirSync("out/prompts", { recursive: true });
  const payload = pack(ids);
  const timestamp = payload.created_at.replace(/[:.]/g, "-");
  const jsonFile = `out/prompts/${timestamp}_pack.json`;
  const mdFile = `out/prompts/${timestamp}_pack.md`;
  
  fs.writeFileSync(jsonFile, JSON.stringify(payload, null, 2));
  
  // Generate Markdown version
  let mdContent = `# Prompt Pack: ${payload.created_at}\n\n`;
  for (const entry of payload.entries) {
    mdContent += `## ${entry.name} (${entry.id})\n`;
    mdContent += `**Type:** ${entry.type}\n`;
    if (entry.summary_200) mdContent += `**Summary:** ${entry.summary_200}\n\n`;
    else if (entry.summary_50) mdContent += `**Summary:** ${entry.summary_50}\n\n`;
    
    if (entry.rules && entry.rules.length > 0) {
      mdContent += `### Rules\n`;
      for (const rule of entry.rules) {
        mdContent += `- ${rule}\n`;
      }
      mdContent += `\n`;
    }
    
    mdContent += `---\n\n`;
  }
  fs.writeFileSync(mdFile, mdContent);
  
  process.stdout.write(jsonFile);
}

module.exports = { pack };
