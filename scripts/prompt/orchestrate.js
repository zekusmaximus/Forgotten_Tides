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

function writeSessionReport({query, intent, ids, packPath, artifacts, lintResults}) {
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const p = `docs/session/${stamp}_${intent}.md`;
  const lines = [
    `# Session Report — ${intent}`,
    `- **Query:** ${query}`,
    `- **IDs:** ${ids?.join(", ") || "(none)"}`,
    `- **Pack:** ${packPath || "(none)"}`,
    `- **Artifacts:** ${(artifacts||[]).join(", ") || "(none)"}`,
    `\n## Lint/Checks`,
  ];
  for (const r of (lintResults||[])) {
    lines.push(`- ${r.step}: ${r.output ? "ok/ran" : "skipped"}`);
  }
  fs.writeFileSync(p, lines.join("\n"));
  return p;
}

function orchestrate(query) {
  ensureDirs();
  const intent = classify(query);
  const ids = resolveIDs(query);
  const packPath = exportPack(ids);
  const artifacts = [];

  switch (intent) {
    case "brainstorm": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_brainstorm.md`;
      const header = `---\nintent: brainstorm\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(ids)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Brainstorm Notes\n\n- Generate 5–8 options consistent with canon.\n- Label non-canon ideas as 'speculative'.\n`;
      fs.writeFileSync(outp, header);
      artifacts.push(outp);
      break;
    }
    case "outline": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_outline.md`;
      fs.writeFileSync(outp, `---\nintent: outline\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(ids)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Outline Draft\n\nAct I:\nAct II:\nAct III:\n`);
      artifacts.push(outp);
      break;
    }
    case "revise_scene": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_revision_plan.md`;
      fs.writeFileSync(outp, `---\nintent: revise_scene\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(ids)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Revision Plan\n- Target scene(s): (add file paths / IDs)\n- Change: (describe insertion/modification)\n- Constraints: continuity invariants, rules used\n`);
      artifacts.push(outp);
      break;
    }
    case "worldbuild_mechanics": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_mechanics_notes.md`;
      fs.writeFileSync(outp, `---\nintent: worldbuild_mechanics\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(ids)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Mechanics Exploration\n- Hypotheses (speculative)\n- Tests/examples\n- Candidate canonical changes (PR into data/mechanics)\n`);
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
  const report = writeSessionReport({ query, intent, ids, packPath, artifacts, lintResults });
  const summary = { intent, ids, packPath, artifacts, report };

  process.stdout.write(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  const q = process.argv.slice(2).join(" ").trim();
  if (!q) {
    console.error("Usage: node scripts/prompt/orchestrate.js \"your natural language request\"");
    process.exit(2);
  }
  orchestrate(q);
}

module.exports = { orchestrate };
