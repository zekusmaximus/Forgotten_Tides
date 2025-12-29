#!/usr/bin/env node
const path = require('path');
const { loadFrontmatter, ensureDir } = require('../lib/file_loader');
const { writeJsonReport, writeMarkdownReport } = require('../lib/reporters');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { scene: null, previous: null };
  args.forEach((arg, idx) => {
    if (arg === '--scene') out.scene = args[idx + 1];
    if (arg === '--previous') out.previous = args[idx + 1];
  });
  return out;
}

function toneMetrics(text) {
  const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const dialogueLines = text.split('\n').filter(line => line.trim().startsWith('"') || line.trim().startsWith('“'));
  const violenceMarkers = (text.match(/\b(kill|blood|weapon|stab|shoot)\b/gi) || []).length;
  return {
    avg_sentence_length: sentences.length ? (words.length / sentences.length) : 0,
    dialogue_ratio: words.length ? (dialogueLines.join(' ').split(/\s+/).filter(Boolean).length / words.length) : 0,
    violence_markers: violenceMarkers
  };
}

function diffArray(oldArr = [], newArr = [], keySelector) {
  const toKey = keySelector || (v => JSON.stringify(v));
  const removed = oldArr.filter(item => !newArr.some(n => toKey(n) === toKey(item)));
  const added = newArr.filter(item => !oldArr.some(o => toKey(o) === toKey(item)));
  return { added, removed };
}

function summarizeDiff(oldScene, newScene) {
  const findings = [];
  const stakesDiff = diffArray([oldScene.data.stakes], [newScene.data.stakes], v => JSON.stringify(v || {}));
  if (stakesDiff.added.length || stakesDiff.removed.length) {
    findings.push(`- Stakes changed`);
  }
  const knowledgeDiff = diffArray(oldScene.data.knowledge_delta || [], newScene.data.knowledge_delta || [], v => `${v.entity}-${v.change}`);
  if (knowledgeDiff.added.length || knowledgeDiff.removed.length) {
    findings.push(`- Knowledge delta changed (+${knowledgeDiff.added.length} / -${knowledgeDiff.removed.length})`);
  }
  const moralDiff = diffArray(oldScene.data.moral_actions || [], newScene.data.moral_actions || [], v => `${v.actor}-${v.action}-${v.weight}`);
  if (moralDiff.added.length || moralDiff.removed.length) {
    findings.push(`- Moral actions changed (+${moralDiff.added.length} / -${moralDiff.removed.length})`);
  }
  const toneOld = toneMetrics(oldScene.content || '');
  const toneNew = toneMetrics(newScene.content || '');
  findings.push(`- Tone proxy: avg sentence ${toneOld.avg_sentence_length.toFixed(1)} -> ${toneNew.avg_sentence_length.toFixed(1)}, dialogue ratio ${(toneOld.dialogue_ratio * 100).toFixed(1)}% -> ${(toneNew.dialogue_ratio * 100).toFixed(1)}%`);
  return findings;
}

function main() {
  const args = parseArgs();
  if (!args.scene || !args.previous) {
    console.error('Usage: node scripts/prompt/scene_diff.js --scene <new> --previous <old>');
    process.exit(1);
  }
  const newScene = loadFrontmatter(path.resolve(args.scene));
  const oldScene = loadFrontmatter(path.resolve(args.previous));
  const findings = summarizeDiff(oldScene, newScene);
  const sceneId = newScene.data.id || path.basename(args.scene);
  const jsonPath = writeJsonReport(`scene_diff_${sceneId}.json`, { scene: sceneId, findings });
  const mdLines = [`# Scene Diff — ${sceneId}`, '', ...findings];
  const mdPath = writeMarkdownReport(`scene_diff_${sceneId}.md`, mdLines);
  console.log(`Scene diff written to ${jsonPath} and ${mdPath}`);
}

main();
