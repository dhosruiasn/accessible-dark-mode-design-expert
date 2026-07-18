#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const inventoryScript = path.join(scriptDirectory, 'theme-surface-inventory.mjs');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-surface-inventory-'));

function write(relativePath, content) {
  const destination = path.join(temporaryRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function run(...args) {
  return spawnSync(process.execPath, [inventoryScript, ...args], { encoding: 'utf8' });
}

try {
  write('src/theme.css', `
.card {
  color: #fff;
  background-image: linear-gradient(#fff, #000);
  transition: background-color 220ms ease;
}
.card:before { box-shadow: 0 1px 2px rgb(0 0 0 / 40%); }
@keyframes glow { from { filter: brightness(1); } }
`);
  write('src/icon.svg', '<svg><path fill="#123456" stroke="rgb(1 2 3)" /></svg>\n');
  write('src/page.astro', '<div style="background: #abcdef">Theme</div>\n');
  write('src/payment.js', `
const paymentStatus = 'paid';
const frame = '<iframe class="payment-widget"></iframe>';
`);
  write('node_modules/ignored.css', '.ignored { color: #ffffff; }\n');
  write('dist/ignored.svg', '<svg fill="#ffffff"></svg>\n');

  const json = run(temporaryRoot, '--json', '--limit=2');
  assert.equal(json.status, 0, json.stderr);
  const result = JSON.parse(json.stdout);
  assert.equal(result.scannedFiles, 4);
  assert.equal(result.shownCandidateLines, 2);
  assert.equal(result.truncated, true);
  assert.ok(result.counts['hardcoded-color'] >= 4);
  assert.equal(result.counts['theme-transition'], 1);
  assert.equal(result.counts['animation-or-view-transition'], 1);
  assert.ok(result.counts['visual-effect-or-image'] >= 2);
  assert.equal(result.counts['pseudo-element'], 1);
  assert.equal(result.counts['svg-color'], 1);
  assert.equal(result.counts['overlay-or-external-surface'], 1);

  const summary = run(temporaryRoot, '--json', '--summary-only');
  assert.equal(summary.status, 0, summary.stderr);
  const summaryResult = JSON.parse(summary.stdout);
  assert.equal(summaryResult.shownCandidateLines, 0);
  assert.deepEqual(summaryResult.candidates, []);

  const humanSummary = run(temporaryRoot, '--summary-only');
  assert.equal(humanSummary.status, 0, humanSummary.stderr);
  assert.match(humanSummary.stdout, /Category counts can overlap/);

  const invalidLimit = run(temporaryRoot, '--limit=not-a-number');
  assert.equal(invalidLimit.status, 2);
  assert.match(invalidLimit.stderr, /non-negative integer/);

  const unknownOption = run(temporaryRoot, '--unknown');
  assert.equal(unknownOption.status, 2);
  assert.match(unknownOption.stderr, /unknown option/);

  const missingRoot = run(path.join(temporaryRoot, 'missing'));
  assert.equal(missingRoot.status, 2);
  assert.match(missingRoot.stderr, /project directory not found/);

  process.stdout.write('All theme surface inventory tests passed.\n');
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
