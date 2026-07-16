const { performance } = require('perf_hooks');

const LOCKED_IDS_ORIG = [
  'char-0001',
  'char-0002',
  'char-0003',
  'char-0004',
  'loc-0001',
  'loc-0003'
];

function hasLockedReferenceOrig(data) {
  const refs = [];
  if (data.cross_refs) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.cross_refs[k])) refs.push(...data.cross_refs[k]);
    });
  }
  if (data.references) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.references[k])) refs.push(...data.references[k]);
    });
  }
  return refs.some(r => LOCKED_IDS_ORIG.includes(String(r).toLowerCase()));
}

const LOCKED_IDS_SET = new Set(LOCKED_IDS_ORIG.map(id => id.toLowerCase()));

function hasLockedReferenceOptimized(data) {
  const refs = [];
  if (data.cross_refs) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.cross_refs[k])) refs.push(...data.cross_refs[k]);
    });
  }
  if (data.references) {
    ['characters', 'locations', 'factions', 'mechanics', 'stories'].forEach(k => {
      if (Array.isArray(data.references[k])) refs.push(...data.references[k]);
    });
  }
  return refs.some(r => LOCKED_IDS_SET.has(String(r).toLowerCase()));
}

const data = {
  cross_refs: {
    characters: Array.from({length: 1000}, (_, i) => `char-${1000 + i}`),
    locations: Array.from({length: 1000}, (_, i) => `loc-${1000 + i}`),
    factions: Array.from({length: 1000}, (_, i) => `fac-${1000 + i}`),
    mechanics: Array.from({length: 1000}, (_, i) => `mech-${1000 + i}`),
    stories: Array.from({length: 1000}, (_, i) => `story-${1000 + i}`),
  },
  references: {
    characters: Array.from({length: 1000}, (_, i) => `char-${1000 + i}`),
    locations: Array.from({length: 1000}, (_, i) => `loc-${1000 + i}`),
    factions: Array.from({length: 1000}, (_, i) => `fac-${1000 + i}`),
    mechanics: Array.from({length: 1000}, (_, i) => `mech-${1000 + i}`),
    stories: Array.from({length: 1000}, (_, i) => `story-${1000 + i}`),
  }
};

const ITERATIONS = 10000;

console.log("Measuring Original implementation...");
const startOrig = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  hasLockedReferenceOrig(data);
}
const endOrig = performance.now();
console.log(`Original time: ${endOrig - startOrig} ms`);


console.log("\nMeasuring Optimized implementation...");
const startOpt = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  hasLockedReferenceOptimized(data);
}
const endOpt = performance.now();
console.log(`Optimized time: ${endOpt - startOpt} ms`);

console.log(`\nImprovement: ${(((endOrig - startOrig) - (endOpt - startOpt)) / (endOrig - startOrig) * 100).toFixed(2)}%`);
