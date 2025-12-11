// scripts/prompt/orchestrate.js
// NL request → intent → IDs → prompt pack → action → lints (if available) → report.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { classify } = require("./route_intent.js");
const { resolve: resolveIDs } = require("./resolve_ids.js");
const { spawn } = require("child_process");
const { autotagScene } = require("./scene_autotag.js");

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

function runAuthoringOperation(intent, query, bodyContent) {
  return new Promise((resolve, reject) => {
    // Extract parameters from query using heuristic parsing
    const params = extractAuthoringParams(query, intent);

    // Build authoring command
    const args = ['--intent', intent];

    // Add parameters based on intent
    if (params.work) args.push('--work', params.work);
    if (params.kind) args.push('--kind', params.kind);
    if (params.title) args.push('--title', params.title);
    if (params.scene) args.push('--scene', params.scene);
    if (params.order) args.push('--order', params.order);
    if (params.notes) args.push('--notes', params.notes);
    if (params.outline) args.push('--outline', params.outline);

    // Spawn authoring process
    const authoringProcess = spawn('node', ['scripts/prompt/authoring.js', ...args]);

    let stdout = '';
    let stderr = '';

    // Pipe body content to authoring process
    if (bodyContent) {
      authoringProcess.stdin.write(bodyContent);
    }
    authoringProcess.stdin.end();

    authoringProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    authoringProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    authoringProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Authoring failed: ${stderr || 'unknown error'}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse authoring output: ${e.message}`));
        }
      }
    });
  });
}

function extractAuthoringParams(query, intent) {
  const q = query.toLowerCase();
  const params = {};

  // Extract work kind (use the values expected by authoring.js)
  if (/short story/.test(q)) {
    params.kind = 'short';
  } else if (/novella/.test(q)) {
    params.kind = 'novella';
  } else if (/novel/.test(q)) {
    params.kind = 'novel';
  } else {
    params.kind = 'novella'; // default
  }

  // Extract work identification (try WORK-ID first, then title)
  const workIdMatch = query.match(/([A-Z]{2,}-\d+)/);
  if (workIdMatch) {
    params.work = workIdMatch[1];
  } else {
    // Try to extract title from quotes or after "titled"
    const titleMatch = query.match(/titled "([^"]+)"|titled '([^']+)'|titled (.+?)(?= |$)|"([^"]+)"/i);
    if (titleMatch) {
      params.work = titleMatch[1] || titleMatch[2] || titleMatch[3];
      params.title = params.work;
    } else {
      // Try to extract work title from "in [title]" pattern
      const inTitleMatch = query.match(/in "([^"]+)"|in '([^']+)'|in ([^\s]+)/i);
      if (inTitleMatch) {
        params.work = inTitleMatch[1] || inTitleMatch[2] || inTitleMatch[3];
      } else {
        // Try to extract title from "named [title]" pattern
        const namedMatch = query.match(/named "([^"]+)"|named '([^']+)'|named ([^\s]+)/i);
        if (namedMatch) {
          params.work = namedMatch[1] || namedMatch[2] || namedMatch[3];
        } else {
          // Try to extract title from "called [title]" pattern
          const calledMatch = query.match(/called "([^"]+)"|called '([^']+)'|called ([^\s]+)/i);
          if (calledMatch) {
            params.work = calledMatch[1] || calledMatch[2] || calledMatch[3];
          } else {
            // Try to extract title from "for [title]" pattern
            const forMatch = query.match(/for "([^"]+)"|for '([^']+)'|for ([^\s]+)/i);
            if (forMatch) {
              params.work = forMatch[1] || forMatch[2] || forMatch[3];
            }
          }
        }
      }
    }
  }

  // Extract scene identification
  const sceneIdMatch = query.match(/(SC-\d+)/);
  if (sceneIdMatch) {
    params.scene = sceneIdMatch[1];
  } else if (intent === 'save_scene' || intent === 'replace_scene') {
    // Try to extract scene title from query
    const sceneTitleMatch = query.match(/scene "([^"]+)"|scene '([^']+)'|as a scene in "([^"]+)"|as a scene in '([^']+)'/);
    if (sceneTitleMatch) {
      params.scene = sceneTitleMatch[1] || sceneTitleMatch[2] || sceneTitleMatch[3] || sceneTitleMatch[4];
    }
  }

  // Extract order for save_scene
  if (intent === 'save_scene') {
    const orderMatch = query.match(/order (\d+)/);
    if (orderMatch) {
      params.order = orderMatch[1];
    } else {
      params.order = '1'; // default order
    }
  }

  // Extract notes title
  if (intent === 'save_notes') {
    const notesMatch = query.match(/notes "([^"]+)"|notes '([^']+)'|as notes titled "([^"]+)"|as notes titled '([^']+)'/);
    if (notesMatch) {
      params.notes = notesMatch[1] || notesMatch[2] || notesMatch[3] || notesMatch[4];
    } else {
      params.notes = 'Chat Highlights';
    }
  }

  // Extract outline title
  if (intent === 'update_outline') {
    const outlineMatch = query.match(/outline for "([^"]+)"|outline for '([^']+)'/);
    if (outlineMatch) {
      params.outline = outlineMatch[1] || outlineMatch[2];
    }
  }

  return params;
}

function getBodyContentForAuthoring() {
  return new Promise((resolve) => {
    let stdin = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      stdin += chunk;
    });
    process.stdin.on('end', () => {
      resolve(stdin);
    });
    // If no stdin data is coming, resolve with empty string
    setTimeout(() => {
      if (stdin === '') resolve('');
    }, 100);
  });
}

function writeSessionReport({query, intent, ids, packPath, artifacts, lintResults, contextPath, stickyIds}) {
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const p = `docs/session/${stamp}_${intent}.md`;
  const lines = [
    `# Session Report — ${intent}`,
    `- **Query:** ${query}`,
    `- **IDs:** ${ids?.join(", ") || "(none)"}`,
    `- **Pack:** ${packPath || "(none)"}`,
    `- **Context:** ${contextPath || "(none)"}`,
    `- **Artifacts:** ${(artifacts||[]).join(", ") || "(none)"}`,
    `- **Carried IDs:** ${stickyIds?.join(", ") || "(none)"}`,
    `- **Session State:** out/session/state.json`,
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
    const sessionFile = "out/session/state.json";
    if (fs.existsSync(sessionFile)) {
      return JSON.parse(fs.readFileSync(sessionFile, "utf8"));
    }
  } catch (e) {
    // Ignore errors and return default state
  }
  return {
    last_intent: null,
    active_work: null,
    sticky_ids: [],
    history: []
  };
}

function saveSessionState(state) {
  const sessionFile = "out/session/state.json";
  fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));
}

async function orchestrate(query, options = {}) {
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
    case "save_scene":
    case "save_notes":
    case "start_work":
    case "replace_scene":
    case "update_outline": {
      // Authoring operations take precedence
      try {
        // Get body content from stdin only for operations that need it
        const bodyContent = (intent === 'save_scene' || intent === 'replace_scene' || intent === 'save_notes' || intent === 'update_outline')
          ? await getBodyContentForAuthoring()
          : '';
        const authoringResult = await runAuthoringOperation(intent, query, bodyContent);

        // Add created files to artifacts
        if (authoringResult.files_created) {
          authoringResult.files_created.forEach(file => {
            if (typeof file === 'string') {
              artifacts.push(path.join(authoringResult.work_path || '', file));
            }
          });
        }
        if (authoringResult.scene_file) artifacts.push(authoringResult.scene_file);
        if (authoringResult.notes_file) artifacts.push(authoringResult.notes_file);
        if (authoringResult.updated_file) artifacts.push(authoringResult.updated_file);
        if (authoringResult.outline_file) artifacts.push(authoringResult.outline_file);
        if (authoringResult.backup_file) artifacts.push(authoringResult.backup_file);

        // Auto-tag scenes after save_scene and replace_scene operations
        if ((intent === 'save_scene' || intent === 'replace_scene') && authoringResult.scene_file) {
          try {
            const scenePath = authoringResult.scene_file;
            if (fs.existsSync(scenePath)) {
              autotagScene(scenePath, packPath, contextPath);
              console.log(`Auto-tagged scene: ${scenePath}`);
            }
          } catch (autotagError) {
            console.warn(`Warning: Auto-tagging failed for scene ${authoringResult.scene_file}: ${autotagError.message}`);
            // Continue pipeline - don't fail on autotag errors
          }
        }

        // Include authoring result in session report
        sessionState.authoring_result = authoringResult;
      } catch (error) {
        console.error(`Authoring operation failed: ${error.message}`);
        // Fall back to regular pack export
        if (packPath) artifacts.push(packPath);
      }
      break;
    }
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
  const report = writeSessionReport({ query, intent, finalIds, packPath, artifacts, lintResults, contextPath, stickyIds: sessionState.sticky_ids });

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

  // Check for --help flag first
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Forgotten Tides Orchestrator CLI
================================

SYNOPSIS
  node scripts/prompt/orchestrate.js "<query>" [options]

DESCRIPTION
  Orchestrates natural language requests into structured workflows:
  query → intent classification → ID resolution → prompt pack → artifacts → reports

EXAMPLES
  # Brainstorm new mechanics
  node scripts/prompt/orchestrate.js "brainstorm memory corridor stabilization techniques"

  # Outline a story with session carry
  node scripts/prompt/orchestrate.js "outline the Archivist's next mission" --carry

  # Worldbuild with specific profile
  node scripts/prompt/orchestrate.js "worldbuild faction politics" --profile storytelling

FLAGS
  --profile <name>   Use a specific context profile (default: "default")
  --carry            Carry forward sticky IDs from previous session
  --clear            Clear session state before processing
  --help, -h         Show this help message

ENVIRONMENT
  Requires Node.js 18+
  Assumes project root contains: out/, lore/, docs/, data/
  Writes to: out/prompts/, out/reports/, lore/ideas/, docs/session/
  Reads from: characters/, data/, stories/, data/lexicon/

INTENTS SUPPORTED
  brainstorm, outline, revise_scene, worldbuild_mechanics, compile_artifacts, export_pack_only, save_scene, save_notes, start_work, replace_scene, update_outline
`);
    process.exit(0);
  }

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
