#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const nodeAssert = require('node:assert/strict');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const timelinePath = path.join(process.cwd(), 'data', 'timeline', 'events.yaml');
  const data = yaml.load(fs.readFileSync(timelinePath, 'utf8')) || {};
  assert(Array.isArray(data.events), 'data/timeline/events.yaml exposes an events array');
  assert(data.events.some(event => event.canon_tier === 'primary_canon'), 'timeline includes at least one primary canon event');
  // Seeding assertions (Phase 1 foundational): story-0001 + bible T0-T5 seeded
  assert(data.events.some(e => e.id === 'event-0001' && e.source && e.source.includes('the_archivists_wake')), 'seeded origin event-0001 present');
  assert(data.events.filter(e => /^bible-t[0-5]$/i.test(e.id) || (e.id && e.id.startsWith('bible-t'))).length >= 5 || data.events.some(e => /T0|T5/.test(e.timestamp || '')), 'bible T0-T5 events seeded into yaml or report');

  execSync('node scripts/checks/timeline_variance.js', { stdio: 'inherit' });
  const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'out', 'reports', 'timeline_variance.json'), 'utf8'));
  assert(report.summary.total_events >= 1, 'timeline report counts parsed events');
  assert(report.summary.canonical_event_count >= 1, 'timeline report counts canonical events');
  assert(typeof report.summary.frontmatter_event_count === 'number', 'timeline report includes frontmatter event count');
  // Post-seed: frontmatter_event_count > 0 and origin coverage
  assert(report.summary.frontmatter_event_count > 0, 'frontmatter event count > 0 after seeding');
  assert(report.events && report.events.some(e => e.id === 'event-0001' || (e.source && e.source.includes('the_archivists_wake'))), 'report contains seeded origin events');
  assert(report.summary.event_conflicts === 0, 'shared event IDs agree with manuscript timestamps and summaries');

  const manuscriptPath = path.join(process.cwd(), 'stories', 'short_story', 'spend_what_you_can_afford', 'manuscript.md');
  const manuscriptRaw = fs.readFileSync(manuscriptPath, 'utf8');
  const frontmatter = manuscriptRaw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert(frontmatter, 'story-0022 has YAML frontmatter');
  const manuscript = yaml.load(frontmatter[1]);
  const source = 'stories/short_story/spend_what_you_can_afford/manuscript.md';
  const sharedEvents = data.events.filter(event => event.source === source);
  const manuscriptEvents = manuscript.events || [];
  assert(sharedEvents.length === manuscriptEvents.length, 'story-0022 has one shared record per manuscript event');
  const sharedById = new Map(sharedEvents.map(event => [event.id, event]));
  for (const event of manuscriptEvents) {
    const shared = sharedById.get(event.id);
    assert(shared, `shared timeline contains ${event.id}`);
    assert(shared.timestamp === event.timestamp, `${event.id} has one timestamp`);
    assert(shared.summary === event.summary, `${event.id} has one summary`);
    assert(shared.canon_tier === event.canon_tier, `${event.id} has one canon tier`);
    nodeAssert.deepStrictEqual(shared.relationships || [], event.relationships || [],
      `${event.id} has matching timeline relationships`);
  }

  console.log('PASS: timeline events parsed and reported');
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}
