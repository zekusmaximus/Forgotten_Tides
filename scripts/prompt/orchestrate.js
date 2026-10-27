// scripts/prompt/orchestrate.js
// NL request → intent → IDs → prompt pack → action → lints (if available) → report.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { classify } = require("./route_intent.js");
const { spawn } = require("child_process");
const { autotagScene } = require("./scene_autotag.js");
const { extract } = require("./extract_metadata.js");
const OrderingEngine = require("./ordering.js");
const { resolveWithin } = require("../lib/path_safety.js");
const { buildCompilation } = require("../compile_stories.js");

const ROOT = path.join(__dirname, '../..');

// Run a Node script with arguments passed as an argv array (no shell).
// Prevents command injection from user-controlled values such as `query`.
function runNode(script, args = [], options = {}) {
  const root = options.root || ROOT;
  try {
    return execFileSync(process.execPath, [path.join(root, script), ...args.map(String)], { stdio: "pipe", cwd: root })
      .toString()
      .trim();
  } catch (e) {
    const detail = String(e.stderr || e.message || e).trim();
    throw new Error(`${script} failed${e.status != null ? ` (exit ${e.status})` : ''}: ${detail}`);
  }
}

function ensureDirs(root = ROOT) {
  ["out/prompts","out/reports","out/session/reports","lore/ideas"].forEach(d=>{
    fs.mkdirSync(path.join(root, d), { recursive: true });
  });
}

function exportPack(ids, options = {}) {
  if (!ids?.length) return null;
  const root = options.root || ROOT;
  const execute = options.execute || runNode;
  const exported = execute("scripts/prompt/export_prompt_pack.js", ids, { root });
  const normalized = typeof exported === 'string' ? exported.trim().replace(/\\/g, '/') : '';
  const match = normalized.match(/^out\/prompts\/([^/]+_pack\.json)$/);
  if (!match) throw new Error(`Prompt exporter returned an invalid path: ${String(exported)}`);
  const target = resolveWithin(root, 'out', 'prompts', match[1]);
  const markdown = resolveWithin(root, 'out', 'prompts', match[1].replace(/\.json$/, '.md'));
  if (!fs.existsSync(target) || !fs.existsSync(markdown)) {
    throw new Error(`Prompt exporter did not create the reported JSON and Markdown files: ${normalized}`);
  }
  return normalized;
}

function runLints(options = {}) {
  const root = options.root || ROOT;
  const execute = options.execute || execFileSync;
  const results = [];
  const steps = [
    { name: "schema", script: "scripts/lint/schema_validate.js", required: true },
    { name: "refs", script: "scripts/lint/unresolved_refs.js", required: true },
    { name: "glossary", script: "scripts/lint/glossary_enforcer.js", required: false },
    { name: "continuity", script: "scripts/checks/continuity.js", required: true }
  ];
  for (const s of steps) {
    try {
      const output = execute(process.execPath, [path.join(root, s.script)], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
      results.push({ step: s.name, status: 0, required: s.required, output: String(output).trim() });
    } catch (error) {
      results.push({ step: s.name, status: error.status ?? 1, required: s.required,
        output: String(error.stderr || error.message || error).trim() });
    }
  }
  return results;
}

function runAuthoringOperation(intent, query, bodyContent, params = null, options = {}) {
  return new Promise((resolve, reject) => {
    // Use provided params or extract from query
    const finalParams = params || extractAuthoringParams(query, intent);

    // Build authoring command
    const args = ['--intent', intent];

    // Add parameters based on intent
    if (finalParams.work) args.push('--work', finalParams.work);
    if (finalParams.kind) args.push('--kind', finalParams.kind);
    if (finalParams.title) args.push('--title', finalParams.title);
    if (finalParams.scene) args.push('--scene', finalParams.scene);
    if (finalParams.order) args.push('--order', finalParams.order);
    if (finalParams.notes) args.push('--notes', finalParams.notes);
    if (finalParams.outline) args.push('--outline', finalParams.outline);

    // Spawn authoring process
    const root = options.root || ROOT;
    const authoringProcess = spawn(process.execPath, [path.join(root, 'scripts/prompt/authoring.js'), ...args], { cwd: root });

    let stdout = '';
    let stderr = '';

    // Pipe body content to authoring process
    authoringProcess.stdin.on('error', reject);
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

    authoringProcess.on('error', reject);
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

function convertOrderToAuthoringFormat(extractedOrder) {
  if (!extractedOrder) return null;

  const { mode, value } = extractedOrder;

  switch (mode) {
    case 'index': return String(value);
    // The authoring command requires a numeric initial order. The ordering
    // engine applies the requested relative placement after the scene exists.
    case 'first':
    case 'last':
    case 'before':
    case 'after':
    case 'midpoint': return '0';
    default: return null;
  }
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
    const titleMatch = intent === 'start_work'
      ? query.match(/titled "([^"]+)"|titled '([^']+)'|titled (.+?)(?= |$)|"([^"]+)"/i)
      : null;
    if (titleMatch) {
      params.work = titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4];
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

function getBodyContentForAuthoring(stream = process.stdin) {
  if (stream.isTTY) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    let stdin = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      stdin += chunk;
    });
    stream.once('end', () => {
      resolve(stdin);
    });
    stream.once('error', reject);
    if (stream.readableEnded) resolve(stdin);
  });
}

function writeSessionReport({query, intent, ids, packPath, packMdPath, artifacts, lintResults, contextPath, stickyIds}, root = ROOT) {
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const relative = `out/session/reports/${stamp}_${intent}.md`;
  const p = path.join(root, relative);
  const lines = [
    `# Session Report — ${intent}`,
    `- **Query:** ${query}`,
    `- **IDs:** ${ids?.join(", ") || "(none)"}`,
    `- **Pack (JSON):** ${packPath || "(none)"}`,
    `- **Pack (MD):** ${packMdPath || "(none)"}`,
    `- **Context:** ${contextPath || "(none)"}`,
    `- **Artifacts:** ${(artifacts||[]).join(", ") || "(none)"}`,
    `- **Carried IDs:** ${stickyIds?.join(", ") || "(none)"}`,
    `- **Session State:** out/session/state.json`,
    `\n## Lint/Checks`,
  ];
  for (const r of (lintResults||[])) {
    lines.push(`- ${r.step}: exit ${r.status}${r.required ? ' (required)' : ' (advisory)'}`);
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, lines.join("\n"));
  return relative;
}

function loadSessionState(root = ROOT) {
  const sessionFile = path.join(root, "out/session/state.json");
  if (fs.existsSync(sessionFile)) {
    const state = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
    if (!state || typeof state !== 'object' || !Array.isArray(state.history) || !Array.isArray(state.sticky_ids)) {
      throw new Error(`Invalid session state: ${sessionFile}`);
    }
    return state;
  }
  return {
    last_intent: null,
    active_work: null,
    sticky_ids: [],
    history: []
  };
}

function saveSessionState(state, root = ROOT) {
  const sessionFile = path.join(root, "out/session/state.json");
  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));
}

async function orchestrate(query, options = {}) {
  const { profile = "default", carry = false, clear = false } = options;
  const root = options.root || ROOT;
  const services = options.services || {};
  const runNodeStep = services.runNode || runNode;
  const authoringStep = services.runAuthoringOperation || runAuthoringOperation;
  const bodyStep = services.getBodyContentForAuthoring || getBodyContentForAuthoring;
  const lintStep = services.runLints || runLints;
  const extractStep = services.extract || extract;
  ensureDirs(root);

  // Load and manage session state
  let sessionState = clear ? null : loadSessionState(root);

  if (clear) {
    // Reset session state to defaults
    sessionState = {
      history: [],
      sticky_ids: [],
      last_intent: null,
      active_work: null
    };
  }

  // Step 1: Build context first using context_builder.js
  // Pass query/profile as argv entries instead of interpolating into a shell
  // string, so shell metacharacters in user input cannot execute commands.
  const contextOutputPath = runNodeStep("scripts/prompt/context_builder.js", [query, "--profile", profile], { root });

  // Read the context JSON to get the canonical IDs list
  const contextPath = String(contextOutputPath).trim().replace(/\\/g, '/');
  const contextMatch = contextPath.match(/^out\/prompts\/([^/]+_context\.json)$/);
  if (!contextMatch) throw new Error(`Context builder returned an invalid path: ${contextPath}`);
  const contextFile = resolveWithin(root, 'out', 'prompts', contextMatch[1]);
  const contextData = JSON.parse(fs.readFileSync(contextFile, "utf8"));
  if (!Array.isArray(contextData.order)) throw new Error(`Context builder output has no order array: ${contextPath}`);
  const contextOrder = contextData.order;

  // Get intent and resolve IDs (for session management)
  const intent = classify(query);

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
  const packPath = exportPack(finalIds, { root, execute: runNodeStep });
  const packMdPath = packPath ? packPath.replace(".json", ".md") : null;
  const artifacts = [];

  switch (intent) {
    case "save_scene":
    case "save_notes":
    case "start_work":
    case "replace_scene":
    case "update_outline": {
      // Authoring operations take precedence
      try {
        // Perform NL extraction for authoring operations
        // A creation request names a new work. Looking up existing titles can
        // mistake "First Corridor" for "First Corridor Revisited".
        const extractedData = intent === 'start_work' ? {} : extractStep(query, root);

        // Handle clarification cases
        if (extractedData.needs_clarification) {
          throw new Error(`Clarification needed: ${extractedData.needs_clarification.question}`);
        }

        // Get body content from stdin only for operations that need it
        const bodyContent = (intent === 'save_scene' || intent === 'replace_scene' || intent === 'save_notes' || intent === 'update_outline')
          ? await bodyStep()
          : '';
        if (intent !== 'start_work' && !bodyContent.trim()) {
          throw new Error(`${intent} requires non-empty body content on stdin`);
        }

        // Map extracted data to authoring parameters
        const params = {
          work: extractedData.work?.id || null,
          kind: extractedData.work?.kind || null,
          title: extractedData.work?.title || null,
          scene: extractedData.scene?.id || null,
          order: extractedData.order ? convertOrderToAuthoringFormat(extractedData.order) : null,
          notes: extractedData.outline_section || null,
          outline: extractedData.outline_section || null
        };

        // Fallback to original parameter extraction if NL extraction didn't find values
        const fallbackParams = extractAuthoringParams(query, intent);
        const finalParams = {
          work: params.work || fallbackParams.work,
          kind: params.kind || fallbackParams.kind,
          title: params.title || fallbackParams.title || (intent === 'start_work' ? fallbackParams.work : null),
          scene: fallbackParams.scene || (intent === 'replace_scene' ? params.scene : null),
          order: params.order || fallbackParams.order,
          notes: params.notes || fallbackParams.notes,
          outline: params.outline || fallbackParams.outline
        };

        if (intent === 'start_work' && (!finalParams.work || !finalParams.kind || !finalParams.title)) {
          throw new Error('start_work requires a work title and kind');
        }
        const authoringResult = await authoringStep(intent, query, bodyContent, finalParams, { root });
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
            const scenePath = path.join(root, authoringResult.scene_file);
            if (fs.existsSync(scenePath)) {
              autotagScene(scenePath, packPath, contextPath);
              console.log(`Auto-tagged scene: ${scenePath}`);
            }
          } catch (autotagError) {
            console.warn(`Warning: Auto-tagging failed for scene ${authoringResult.scene_file}: ${autotagError.message}`);
            // Continue pipeline - don't fail on autotag errors
          }
        }

        // Apply ordering after save_scene operations
        if (intent === 'save_scene' && authoringResult.scene_file && extractedData.order) {
          try {
            const sceneFile = path.join(root, authoringResult.scene_file);
            const workDir = path.dirname(path.dirname(sceneFile));
            const sceneRelPath = path.relative(workDir, sceneFile);

            // Load current include list
            const includeList = OrderingEngine.load(workDir);

            // Insert the new scene with the specified ordering
            const newIncludeList = OrderingEngine.insert(includeList, sceneRelPath, extractedData.order);

            // Save the updated include list
            OrderingEngine.save(workDir, newIncludeList);
            console.log(`Applied ordering: ${extractedData.order.mode} ${extractedData.order.value || ''}`);
          } catch (orderingError) {
            throw new Error(`Ordering failed: ${orderingError.message}`);
          }
        }

        // Include authoring result in session report
        sessionState.authoring_result = authoringResult;
      } catch (error) {
        throw new Error(`Authoring operation failed: ${error.message}`);
      }
      break;
    }
    case "brainstorm": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_brainstorm.md`;
      const header = `---\nintent: brainstorm\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Brainstorm Notes\n\n- Generate 5–8 options consistent with canon.\n- Label non-canon ideas as 'speculative'.\n`;
      fs.writeFileSync(path.join(root, outp), header);
      artifacts.push(outp);
      break;
    }
    case "outline": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_outline.md`;
      fs.writeFileSync(path.join(root, outp), `---\nintent: outline\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n# Outline Draft\n\nAct I:\nAct II:\nAct III:\n`);
      artifacts.push(outp);
      break;
    }
    case "revise_scene": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_revision_plan.md`;
      fs.writeFileSync(path.join(root, outp), `---\nintent: revise_scene\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Revision Plan\n- Target scene(s): (add file paths / IDs)\n- Change: (describe insertion/modification)\n- Constraints: continuity invariants, rules used\n`);
      artifacts.push(outp);
      break;
    }
    case "worldbuild_mechanics": {
      const stamp = new Date().toISOString().replace(/[:.]/g,"-");
      const outp = `lore/ideas/${stamp}_mechanics_notes.md`;
      fs.writeFileSync(path.join(root, outp), `---\nintent: worldbuild_mechanics\nsource_query: "${query.replace(/"/g,'\\"')}"\nids: ${JSON.stringify(finalIds)}\npack: ${JSON.stringify(packPath)}\n---\n\n## Mechanics Exploration\n- Hypotheses (speculative)\n- Tests/examples\n- Candidate canonical changes (PR into data/mechanics)\n`);
      artifacts.push(outp);
      break;
    }
    case "compile_artifacts": {
      if (/\b(?:bible|rag|pdf|epub)\b/i.test(query)) {
        throw new Error('This command compiles story Markdown only. Use scripts/compile_stories.sh for ePub; Bible, PDF, and RAG builds are not configured.');
      }
      const markdown = buildCompilation(root);
      const artifact = 'out/compiled/forgotten_tides_stories.md';
      const output = resolveWithin(root, 'out', 'compiled', 'forgotten_tides_stories.md');
      fs.mkdirSync(path.dirname(output), { recursive: true });
      const temporary = resolveWithin(root, 'out', 'compiled',
        `.stories-${process.pid}-${crypto.randomBytes(8).toString('hex')}.tmp`);
      try {
        fs.writeFileSync(temporary, markdown, { flag: 'wx' });
        fs.renameSync(temporary, output);
      } finally {
        fs.rmSync(temporary, { force: true });
      }
      artifacts.push(artifact);
      break;
    }
    case "export_pack_only":
    default: {
      if (packPath) artifacts.push(packPath);
      break;
    }
  }

  const lintResults = lintStep({ root });
  const report = writeSessionReport({ query, intent, ids: finalIds, packPath, packMdPath, artifacts, lintResults, contextPath, stickyIds: sessionState.sticky_ids }, root);
  const failedRequired = lintResults.filter(result => result.required && result.status !== 0);
  if (failedRequired.length) {
    throw new Error(`Required checks failed: ${failedRequired.map(result => `${result.step} (exit ${result.status})`).join(', ')}. Report: ${report}`);
  }

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

  saveSessionState(sessionState, root);

  const summary = { intent, ids: finalIds, packPath, artifacts, report, context: contextPath,
    checks: lintResults.map(result => ({ step: result.step, status: result.status })) };

  console.log(`\n--- Orchestration Complete ---`);
  console.log(`Intent: ${intent}`);
  console.log(`Report: ${report}`);
  if (packMdPath) console.log(`Pack (MD): ${packMdPath}`);
  process.stdout.write(JSON.stringify(summary, null, 2));
  return summary;
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
  Requires Node.js 20+
  Assumes project root contains: out/, lore/, docs/, data/
  Writes to: out/prompts/, out/reports/, out/session/, lore/ideas/
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
  orchestrate(query, { profile, carry, clear }).catch(error => {
    console.error(`Orchestration failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { orchestrate, exportPack, getBodyContentForAuthoring, runLints, runAuthoringOperation,
  convertOrderToAuthoringFormat, writeSessionReport };
