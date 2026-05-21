// scripts/prompt/export_prompt_pack.js
// Minimal prompt-pack exporter. Given a list of IDs, assembles a small JSON
// with 50/200 summaries, rule bullets, and cross-refs (if present).

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { describePolicy, shouldInclude, provenanceNote } = require("../lib/canon_policy");

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

function findById(id, options = {}) {
  const dirs = ['characters', 'factions', 'atlas', 'mechanics', 'stories', 'lore', 'data'];
  const files = globFiles(`{${dirs.join(',')}}/**/*.md`, { nodir: true });
  for (const f of files) {
    if (/readme\.md$/i.test(f) || /_backup_/i.test(f)) continue;
    const { meta, body } = readFM(f);
    if (meta && meta.id === id) {
      const policy = describePolicy(meta, f, meta.type || "entity");
      if (!shouldInclude(policy, options)) continue;
      return { path: f, meta, body, policy };
    }
  }

  const lexiconPath = 'data/lexicon/terms.yaml';
  if (fs.existsSync(lexiconPath)) {
    try {
      const lexicon = yaml.load(fs.readFileSync(lexiconPath, 'utf8')) || {};
      const term = (lexicon.terms || []).find(t => t.id === id);
      if (term) {
        const policy = describePolicy(term, lexiconPath, 'term');
        if (!shouldInclude(policy, options)) return null;
        return {
          path: lexiconPath,
          meta: {
            id: term.id,
            type: 'term',
            name: term.term,
            summary_50: term.definition,
            summary_200: term.definition,
            ...term
          },
          body: term.definition || '',
          policy
        };
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

function pack(ids, options = {}) {
  const entries = [];
  for (const id of ids) {
    const hit = findById(id, options);
    if (!hit) continue;
    const { path: p, meta, policy } = hit;
    const entry = {
      id: meta.id,
      type: meta.type || "entity",
      name: meta.name || meta.title || meta.id,
      canon_tier: policy.canon_tier,
      source_weight: policy.source_weight,
      retrieval_role: policy.retrieval_role,
      provenance: provenanceNote(policy),
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
  entries.sort((a, b) => {
    if (b.source_weight !== a.source_weight) return b.source_weight - a.source_weight;
    return String(a.id).localeCompare(String(b.id));
  });
  return { created_at: new Date().toISOString(), filters: options, entries };
}

function parseArgs(argv) {
  const ids = [];
  const options = {
    canonOnly: false,
    includeDrafts: false,
    includeTest: false,
    includeSandbox: false
  };

  for (const arg of argv) {
    if (arg === '--canon-only') options.canonOnly = true;
    else if (arg === '--include-drafts') options.includeDrafts = true;
    else if (arg === '--include-test') options.includeTest = true;
    else if (arg === '--include-sandbox') options.includeSandbox = true;
    else ids.push(arg);
  }

  return { ids, options };
}

if (require.main === module) {
  const { ids, options } = parseArgs(process.argv.slice(2).filter(Boolean));
  if (!ids.length) {
    console.error("Usage: node scripts/prompt/export_prompt_pack.js [--canon-only] [--include-test] [--include-sandbox] ID [ID ...]");
    process.exit(2);
  }
  if (!fs.existsSync("out/prompts")) fs.mkdirSync("out/prompts", { recursive: true });
  const payload = pack(ids, options);
  const timestamp = payload.created_at.replace(/[:.]/g, "-");
  const jsonFile = `out/prompts/${timestamp}_pack.json`;
  const mdFile = `out/prompts/${timestamp}_pack.md`;
  
  fs.writeFileSync(jsonFile, JSON.stringify(payload, null, 2));
  
  // Generate Markdown version
  let mdContent = `# Prompt Pack: ${payload.created_at}\n\n`;
  for (const entry of payload.entries) {
    mdContent += `## ${entry.name} (${entry.id})\n`;
    mdContent += `**Type:** ${entry.type}\n`;
    mdContent += `**Canon Tier:** ${entry.canon_tier} (${entry.retrieval_role}, weight ${entry.source_weight})\n`;
    mdContent += `**Provenance:** ${entry.provenance}\n`;
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

module.exports = { pack, parseArgs };
