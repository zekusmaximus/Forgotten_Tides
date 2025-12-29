#!/usr/bin/env node
const path = require('path');
const { collectScenes } = require('../lib/scene_indexer');
const { writeJsonReport, writeMarkdownReport, renderFindings } = require('../lib/reporters');
const { getMode } = require('../lib/mode');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { work: null, strict: false, warnOnly: false, jsonOnly: false };
  args.forEach((arg, idx) => {
    if (arg === '--work') out.work = args[idx + 1];
    if (arg === '--strict') out.strict = true;
    if (arg === '--warn-only') out.warnOnly = true;
    if (arg === '--json') out.jsonOnly = true;
  });
  return out;
}

function buildPromiseIndex(scenes) {
  const promises = {};
  scenes.forEach((scene, idx) => {
    const links = scene.data.promise_links || [];
    links.forEach(link => {
      if (!promises[link.id]) {
        promises[link.id] = { setups: [], payoffs: [], reminders: [] };
      }
      const bucket = link.role === 'payoff' ? 'payoffs' : link.role === 'reminder' ? 'reminders' : 'setups';
      promises[link.id][bucket].push({ scene, index: idx, status: link.status || 'open' });
    });
  });
  return promises;
}

function lintPromises(promises) {
  const findings = [];
  Object.entries(promises).forEach(([id, data]) => {
    if (data.setups.length === 0 && data.payoffs.length > 0) {
      data.payoffs.forEach(entry => {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), entry.scene.path),
          message: `Payoff for promise "${id}" has no recorded setup`
        });
      });
    }
    if (data.setups.length > 0 && data.payoffs.length === 0) {
      const lastSetup = data.setups[data.setups.length - 1];
      findings.push({
        severity: 'warning',
        file: path.relative(process.cwd(), lastSetup.scene.path),
        message: `Promise "${id}" is set up but never paid off`
      });
    }
    if (data.setups.length > 0 && data.payoffs.length > 0) {
      const firstPayoff = data.payoffs[0];
      const lastSetup = data.setups[data.setups.length - 1];
      if (firstPayoff.index <= lastSetup.index) {
        findings.push({
          severity: 'warning',
          file: path.relative(process.cwd(), firstPayoff.scene.path),
          message: `Promise "${id}" payoff appears before its final setup`
        });
      }
    }
  });
  return findings;
}

function main() {
  const args = parseArgs();
  const mode = getMode();
  const scenes = collectScenes({ work: args.work });
  const promiseIndex = buildPromiseIndex(scenes);
  const findings = lintPromises(promiseIndex);

  const scopeLabel = args.work ? args.work : 'all';
  const jsonPath = writeJsonReport(`promise_payoff_${scopeLabel}.json`, {
    scope: scopeLabel,
    mode,
    total_scenes: scenes.length,
    findings
  });

  const mdLines = renderFindings(`Promise/Payoff Report (${scopeLabel})`, findings);
  const mdPath = args.jsonOnly ? null : writeMarkdownReport(`promise_payoff_${scopeLabel}.md`, mdLines);

  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity !== 'error').length;
  if (!args.jsonOnly) {
    console.log(`Promise/Payoff report written to ${jsonPath}${mdPath ? ` and ${mdPath}` : ''}`);
    console.log(`Findings: ${errorCount} errors, ${warningCount} warnings`);
  }

  if (errorCount > 0 && !args.warnOnly) {
    process.exit(1);
  }
  if (args.strict && findings.length > 0 && !args.warnOnly) {
    process.exit(1);
  }
}

main();
