const { classify } = require('./route_intent');

// Test cases for new authoring intents
const testCases = [
  // save_scene tests
  { input: "save this as a scene", expected: "save_scene" },
  { input: "add scene", expected: "save_scene" },
  { input: "place this as a scene", expected: "save_scene" },

  // save_notes tests
  { input: "save notes", expected: "save_notes" },
  { input: "highlights of this chat", expected: "save_notes" },
  { input: "capture notes", expected: "save_notes" },

  // start_work tests
  { input: "start a new short story", expected: "start_work" },
  { input: "start a new novella", expected: "start_work" },
  { input: "start a new novel", expected: "start_work" },
  { input: "create work", expected: "start_work" },

  // replace_scene tests
  { input: "replace the scene", expected: "replace_scene" },
  { input: "overwrite scene with this revision", expected: "replace_scene" },

  // update_outline tests
  { input: "save these changes to the outline", expected: "update_outline" },
  { input: "update outline", expected: "update_outline" },

  // Existing intents should still work
  { input: "revise the scene", expected: "revise_scene" },
  { input: "create outline", expected: "outline" },
  { input: "brainstorm ideas", expected: "brainstorm" }
];

let passed = 0;
let failed = 0;

console.log("Running intent routing tests...");

testCases.forEach((test, index) => {
  const result = classify(test.input);
  if (result === test.expected) {
    console.log(`✓ Test ${index + 1}: "${test.input}" → ${result}`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1}: "${test.input}" → ${result} (expected ${test.expected})`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}