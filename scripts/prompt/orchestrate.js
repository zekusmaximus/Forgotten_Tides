// scripts/prompt/orchestrate.js
// NL request → intent → IDs → prompt pack → action → lints (if available) → report.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { classify } = require("./route_intent.js");
const { resolve: resolveIDs } = require("./resolve_ids.js");

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (e) {
    return { error: String(e.stderr || e.message || e) };
  }
}

function ensureDirs() {
  ["out/prompts","out/reports","lore/ideas","docs/session"].forEach(d=>{
    if (!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});
  });
}

function exportPack(ids) {
  if (!ids?.length) return null;
  const out = sh(`node scripts/prompt/export_prompt_pack.js ${ids.join(" ")}`);
  const files = fs.readdirSync("out/prompts").filter(f=>f.endsWith("_pack.json"))
    .map(f=>({ f, t: fs.statSync(path.join("out/prompts", f)).mtimeMs }))
    .sort((a,b)=>b.t-a.t);
  return files.length ? path.join("out/prompts", files[0].f) : null;
}

function runLints() {
  const results = [];
  const steps = [
    { name: "schema", cmd: "npm run lint:schema", optional: true },
    { name: "refs", cmd: "npm run lint:refs", optional: true },
    { name: "glossary", cmd: "npm run lint:glossary || true", optional: true },
    { name: "continuity", cmd: "node scripts/checks/continuity.js || true", optional: true }
  ];
  for (const s of steps) {
    const out = sh(s.cmd);
    results.push({ step: s.name, output: typeof out === "string" ? out : out.error || "" });
  }
  return results;
}

function writeSessionReport({query, intent, ids, packPath, artifacts, lintResults, contextPath}) {
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const p = `docs/session/${stamp}_${intent}.md`;
  const lines = [
    `# Session Report — ${intent}`,
    `- **Query:** ${query}`,
    `- **IDs:** ${ids?.join(", ") || "(none)"}`,
    `- **Pack:** ${packPath || "(none)"}`,
    `- **Context:** ${contextPath || "(none)"}`,
    `- **Artifacts:** ${(artifacts||[]).join(", ") || "(none)"}`,
    `\n## Lint/Checks`,
  ];
  for (const r of (lintResults||[])) {
    lines.push(`- ${r.step}: ${r.output ? "ok/ran" : "skipped"}`);
  }
  fs.writeFileSync(p, lines.join("\n"));
  return p;
}

function loadSessionState() {
  try {
    const sessionFile = "docs/session/state.json";
    if (fs.existsSync(sessionFile)) {
      return JSON.parse(fs.readFileSync(sessionFile, "utf8"));
    }
  } catch (e) {
    // Ignore errors and return default state
  }
  return {
    history: [],
    sticky_ids: [],
    last_intent: null
  };
}

function saveSessionState(state) {
  const sessionFile = "docs/session/state.json";
  fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));
}

function orchestrate(query, options = {}) {
  const { profile = "default", carry = false, clear = false } = options;
  ensureDirs();

  // Load and manage session state
  let sessionState = loadSessionState();

  if (clear) {
    // Reset session state to defaults
    sessionState = {
      history: [],
      sticky_ids: [],
      last_intent: null
    };
  }

  // Step 1: Build context first using context_builder.js
  const contextBuilderCmd = `node scripts/prompt/context_builder.js "${query}" --profile ${profile}`;
  const contextOutputPath = sh(contextBuilderCmd);

  // Read the context JSON to get the canonical IDs list
  let contextOrder = [];
  let contextPath = null;
  if (contextOutputPath && !contextOutputPath.error) {
    contextPath = contextOutputPath;
    try {
      const contextData = JSON.parse(fs.readFileSync(contextOutputPath, "utf8"));
      contextOrder = contextData.order || [];
    } catch (e) {
      console.warn("Warning: Could not read context builder output");
    }
  }

  // Get intent and resolve IDs (for session management)
  const intent = classify(query);
  const resolvedIds = resolveIDs(query);

  // Merge sticky_ids if --carry flag is set
  let finalIds = [...contextOrder];
  if (carry && sessionState.sticky_ids && sessionState.sticky_ids.length > 0) {
    // Merge sticky_ids to front, deduplicate, and cap
    const stickyIds = [...new Set(sessionState.sticky_ids)];
    finalIds = [...stickyIds, ...contextOrder.filter(id => !stickyIds.includes(id))];

    // Apply deterministic ordering by ID
    finalIds = [...new Set(finalIds)].sort();
  }

  // Apply hard cap of 50 entities to prevent token bloat
  finalIds = finalIds.slice(0, 50);

  // Export pack with final IDs
  const packPath = exportPack(finalIds);
  const artifacts = [];

  switch (intent) {
    case "brainstorm": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_brainstorm.md`;
      const header = `---\nintent: brainstorm\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Brainstorm Notes\n\n- Generate 5–8 options consistent with canon.\n- Label non-canon ideas as 'speculative'.\n`;
      fs.writeFileSync(outp, header);
      artifacts.push(outp);
      break;
    }
    case "outline": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_outline.md`;
      fs.writeFileSync(outp, `---\nintent: outline\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Outline Draft\n\nAct I:\nAct II:\nAct III:\n`);
      artifacts.push(outp);
      break;
    }
    case "revise_scene": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_revision_plan.md`;
      fs.writeFileSync(outp, `---\nintent: revise_scene\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Revision Plan\n- Target scene(s): (add file paths / IDs)\n- Change: (describe insertion/modification)\n- Constraints: continuity invariants, rules used\n`);
      artifacts.push(outp);
      break;
    }
    case "worldbuild_mechanics": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_mechanics_notes.md`;
      fs.writeFileSync(outp, `---\nintent: worldbuild_mechanics\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Mechanics Exploration\n- Hypotheses (speculative)\n- Tests/examples\n- Candidate canonical changes (PR into data/mechanics)\n`);
      artifacts.push(outp);
      break;
    }
    case "compile_artifacts": {
      if (fs.existsSync("scripts/build/build_bible.js")) {
        sh("node scripts/build/build_bible.js");
        artifacts.push("bible/Series_Bible.epub","bible/Series_Bible.pdf");
      }
      if (fs.existsSync("scripts/rag/export_chunks.js")) {
        sh("node scripts/rag/export_chunks.js");
        artifacts.push("out/rag/chunks.jsonl");
      }
      break;
    }
    case "export_pack_only":
    default: {
      if (packPath) artifacts.push(packPath);
      break;
    }
  }

  const lintResults = runLints();
  const report = writeSessionReport({ query, intent, finalIds, packPath, artifacts, lintResults, contextPath });

  // Update session state
  sessionState.last_intent = intent;
  sessionState.history.push({
    query,
    intent,
    ids: finalIds,
    timestamp: new Date().toISOString()
  });

  // Cap history at 50 entries
  if (sessionState.history.length > 50) {
    sessionState.history = sessionState.history.slice(-50);
  }

  // Update sticky_ids if --carry flag was used
  if (carry) {
    const uniqueOrderedIds = [...new Set(finalIds)];
    sessionState.sticky_ids = uniqueOrderedIds.slice(0, 8); // Cap at 8 most recent
  }

  saveSessionState(sessionState);

  const summary = { intent, ids: finalIds, packPath, artifacts, report, context: contextPath };

  process.stdout.write(JSON.stringify(summary, null, 2));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let query = "";
  let profile = "default";
  let carry = false;
  let clear = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const flag = arg.slice(2);
      const value = args[i + 1];
      if (flag === "profile" && value && !value.startsWith("--")) {
        profile = value;
        i++;
      } else if (flag === "carry") {
        carry = true;
      } else if (flag === "clear") {
        clear = true;
      } else {
        // Unknown flag, treat as part of query
        query += arg + " ";
      }
    } else {
      query += arg + " ";
    }
  }

  query = query.trim();
  if (!query) {
    console.error("Usage: node scripts/prompt/orchestrate.js \"your natural language request\" [--profile <name>] [--carry] [--clear]");
    process.exit(2);
  }

  return { query, profile, carry, clear };
}

if (require.main === module) {
  const { query, profile, carry, clear } = parseArgs();
  orchestrate(query, { profile, carry, clear });
}

module.exports = { orchestrate };
