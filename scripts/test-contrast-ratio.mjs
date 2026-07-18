#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const calculator = path.join(scriptDirectory, 'contrast-ratio.mjs');

function run(...argumentsList) {
  return spawnSync(process.execPath, [calculator, ...argumentsList], {
    encoding: 'utf8',
  });
}

function parseSingleJson(result) {
  assert.equal(result.status, 0, result.stderr);
  const values = JSON.parse(result.stdout);
  assert.equal(values.length, 1);
  return values[0];
}

const blackOnWhite = parseSingleJson(run('#000000', '#ffffff', '--format', 'json'));
assert.equal(blackOnWhite.ratio, 21);
assert.equal(blackOnWhite.passes.aaaNormalText, true);

const rgba = parseSingleJson(run(
  'rgb(255 255 255 / 60%)',
  '#121212',
  '--format',
  'json'
));
const hsla = parseSingleJson(run(
  'hsl(0 0% 100% / 60%)',
  '#121212',
  '--format',
  'json'
));
assert.equal(rgba.compositedForeground, '#a0a0a0');
assert.equal(rgba.ratio, hsla.ratio);

const roundedBoundary = run('#777777', '#ffffff', '--require', 'aa-normal');
assert.equal(roundedBoundary.status, 2);
assert.match(roundedBoundary.stdout, /Ratio: 4\.48:1/);
assert.match(roundedBoundary.stdout, /AA normal text \(4\.5:1\): FAIL/);

const missingUnderlay = run('white', 'rgb(0 0 0 / 50%)');
assert.equal(missingUnderlay.status, 1);
assert.match(missingUnderlay.stderr, /translucent background requires underlay/);

const invalidChannel = run('rgb(12oops 0 0)', 'white');
assert.equal(invalidChannel.status, 1);
assert.match(invalidChannel.stderr, /RGB channel must be a valid number/);

const invalidHue = run('hsl(blue 50% 50%)', 'white');
assert.equal(invalidHue.status, 1);
assert.match(invalidHue.stderr, /HSL hue must be a valid number/);

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'dark-mode-contrast-'));
try {
  const batchPath = path.join(temporaryDirectory, 'pairs.json');
  writeFileSync(batchPath, JSON.stringify([
    {
      label: 'passing text',
      foreground: '#f8fafc',
      background: '#0c1222',
      require: 'aa-normal',
    },
    {
      label: 'unrounded boundary',
      foreground: '#777777',
      background: '#ffffff',
      require: 'aa-normal',
    },
  ]));

  const mixedRequirements = run('--file', batchPath, '--format', 'json');
  assert.equal(mixedRequirements.status, 2);
  const mixedResults = JSON.parse(mixedRequirements.stdout);
  assert.equal(mixedResults[1].passes.aaNormalText, false);

  const globalOverride = run('--file', batchPath, '--require', 'aa-large');
  assert.equal(globalOverride.status, 0, globalOverride.stderr);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

process.stdout.write('All contrast calculator tests passed.\n');
