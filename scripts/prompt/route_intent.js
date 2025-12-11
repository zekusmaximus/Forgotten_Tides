// scripts/prompt/route_intent.js
// Classify a natural-language request into a task intent.

function classify(s) {
  const q = (s || "").toLowerCase();

  const rules = [
    { intent: "save_scene", tests: [/save this as a scene|add scene|place this as a scene/] },
    { intent: "save_notes", tests: [/save notes|highlights of this chat|capture notes/] },
    { intent: "start_work", tests: [/start a new (short story|novella|novel)|create work/] },
    { intent: "replace_scene", tests: [/replace the scene|overwrite scene with this revision/] },
    { intent: "update_outline", tests: [/save these changes to the outline|update outline/] },
    { intent: "revise_scene", tests: [/revise|rewrite|insert|line[- ]?edit|edit\b/] },
    { intent: "outline", tests: [/outline|beatsheet|beat[- ]?sheet|structure|three[- ]?act|act\b|synopsis/] },
    { intent: "worldbuild_mechanics", tests: [/mechanic|rule|system|physics|magic|memory corridor|ftl|rule(s)?\b|mechanics\b/] },
    { intent: "compile_artifacts", tests: [/compile|build (bible|epub|pdf)|publish|generate bible|rag export/] },
    { intent: "export_pack_only", tests: [/prompt pack|context pack|export pack|pack only/] },
    { intent: "brainstorm", tests: [/brainstorm|ideas?|concepts?|pitch|logline|seed/] }
  ];

  for (const r of rules) {
    for (const t of r.tests) if (t.test(q)) return r.intent;
  }

  if (/scene|chapter|novella|novel|story/i.test(q)) return "outline";
  return "brainstorm";
}

if (require.main === module) {
  const q = process.argv.slice(2).join(" ");
  process.stdout.write(classify(q));
}

module.exports = { classify };
