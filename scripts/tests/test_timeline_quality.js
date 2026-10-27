#!/usr/bin/env node

const assert = require('node:assert/strict');
const {
  parseEvent,
  normalizeStructuredEvent,
  deduplicateEvents,
  updateTimelineSpan,
  compareEventDates,
  checkTimelineConsistency
} = require('../checks/timeline_variance');

function report() {
  return {
    issues: { hard: [], soft: [] },
    summary: { timeline_span: null, duplicate_event_count: 0, event_conflicts: 0 }
  };
}

function event(id, timestamp, relationships = [], source = 'stories/novella/WORK/manuscript.md') {
  return normalizeStructuredEvent({ id, timestamp, summary: id, relationships }, source, 'WORK');
}

const twoHours = parseEvent('T0+2h', 'Two hours', 'fixture');
const halfHour = parseEvent('T0+0.5h', 'Half hour', 'fixture');
const twoDays = parseEvent('T0+2 days', 'Two days', 'fixture');
assert.equal(twoHours.date, '2000-01-01T02:00:00.000Z');
assert.equal(halfHour.date, '2000-01-01T00:30:00.000Z');
assert.equal(twoDays.date, '2000-01-03T00:00:00.000Z');
assert.equal(parseEvent('T0+2 pulls', 'Unknown unit', 'fixture').date, null);
assert.equal(parseEvent(new Date('2025-01-01T00:00:00.000Z'), 'YAML date', 'fixture').is_relative, false);
assert.equal(compareEventDates(twoHours, halfHour), 1);
console.log('Relative subperiod offsets parse without assigning unknown units.');

{
  const result = report();
  const canonical = event('event-one', 'T0+1h', [], 'data/timeline/events.yaml');
  const manuscript = event('event-one', 'T0+1h', [{ type: 'before', target: 'event-two' }]);
  const unique = deduplicateEvents([canonical, manuscript], result);
  assert.equal(unique.length, 1);
  assert.equal(result.summary.duplicate_event_count, 1);
  assert.equal(result.summary.event_conflicts, 0);
  assert.deepEqual(unique[0].sources, ['data/timeline/events.yaml', 'stories/novella/WORK/manuscript.md']);
  assert.deepEqual(unique[0].relationships, [{ type: 'before', target: 'event-two' }]);

  const conflict = event('event-one', 'T0+2h', [], 'stories/novella/OTHER/manuscript.md');
  deduplicateEvents([canonical, manuscript, conflict], result);
  assert.equal(result.summary.event_conflicts, 1);
  assert.equal(result.issues.soft.length, 1);
  assert.deepEqual(result.issues.soft[0].fields, ['original_date']);
}
console.log('Repeated event IDs retain provenance and report one conflict per ID.');

{
  const result = report();
  const first = event('first', 'T0+2h', [{ type: 'before', target: 'second' }]);
  const second = event('second', 'T0+1h');
  const third = event('third', 'T0+9h');
  checkTimelineConsistency([], [{ name: 'WORK', file: 'manuscript.md', events: [first, second, third] }], result);
  assert.equal(result.issues.hard.length, 1, 'one invalid relation must produce one finding');
  assert.match(result.issues.hard[0].issue, /supposed to be before/);

  const valid = report();
  checkTimelineConsistency([], [{ name: 'WORK', file: 'manuscript.md',
    events: [event('first', 'T0+1h', [{ type: 'before', target: 'second' }]), event('second', 'T0+2h')] }], valid);
  assert.equal(valid.issues.hard.length, 0);
}
console.log('Before relationships use local offsets and emit one finding per defect.');

{
  const result = report();
  const absolute = [
    parseEvent('2025-01-01', 'Start', 'fixture'),
    parseEvent('2025-01-03', 'End', 'fixture'),
    parseEvent('T0+9 days', 'Unrelated local time', 'fixture')
  ];
  updateTimelineSpan(absolute, result);
  assert.equal(result.summary.timeline_span.end, '2025-01-03T00:00:00.000Z');
  checkTimelineConsistency(absolute, [{ name: 'LATER', file: 'later.md', date: '2025-01-04', events: [] }], result);
  assert.equal(result.issues.soft.length, 1, 'out-of-span story must be reported once');

  const localOnly = report();
  updateTimelineSpan([parseEvent('T0+9 days', 'Local', 'fixture')], localOnly);
  assert.equal(localOnly.summary.timeline_span, null, 'local T0 values do not establish a global calendar span');
}
console.log('Absolute span checks do not multiply warnings or assign a cross-story T0 anchor.');
