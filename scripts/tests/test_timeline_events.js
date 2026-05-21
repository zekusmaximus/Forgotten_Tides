#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
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

  execSync('node scripts/checks/timeline_variance.js', { stdio: 'inherit' });
  const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'out', 'reports', 'timeline_variance.json'), 'utf8'));
  assert(report.summary.total_events >= 1, 'timeline report counts parsed events');
  assert(report.summary.canonical_event_count >= 1, 'timeline report counts canonical events');
  assert(typeof report.summary.frontmatter_event_count === 'number', 'timeline report includes frontmatter event count');

  console.log('PASS: timeline events parsed and reported');
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}
