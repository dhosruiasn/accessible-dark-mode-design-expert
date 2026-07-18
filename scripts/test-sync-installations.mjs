#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const synchronizer = path.join(scriptDirectory, 'sync-installations.mjs');
const canonicalRoot = path.resolve(scriptDirectory, '..');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dark-mode-skill-sync-'));
const skillName = 'accessible-dark-mode-design-expert';
const legacySkillName = 'dark-mode-design-expert';
const codexDestination = path.join(temporaryRoot, 'codex', skillName);
const claudeDestination = path.join(temporaryRoot, 'claude', skillName);

function runWithDestinations(scriptPath, codexPath, claudePath, ...argumentsList) {
  return spawnSync(process.execPath, [
    scriptPath,
    ...argumentsList,
    '--codex-dest',
    codexPath,
    '--claude-dest',
    claudePath,
  ], { encoding: 'utf8' });
}

function run(scriptPath, ...argumentsList) {
  return runWithDestinations(
    scriptPath,
    codexDestination,
    claudeDestination,
    ...argumentsList
  );
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

try {
  const initialSync = run(synchronizer, '--sync');
  assert.equal(initialSync.status, 0, initialSync.stderr);
  assert.equal(fs.existsSync(path.join(codexDestination, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(claudeDestination, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(codexDestination, '.skill-sync.json')), true);
  assert.equal(fs.existsSync(path.join(codexDestination, 'README.md')), false);
  assert.equal(fs.existsSync(path.join(codexDestination, 'CHANGELOG.md')), false);
  assert.equal(fs.existsSync(path.join(codexDestination, '.gitignore')), false);
  assert.equal(fs.existsSync(path.join(codexDestination, 'docs')), false);
  assert.equal(fs.existsSync(path.join(codexDestination, 'LICENSE')), true);
  assert.equal(fs.existsSync(path.join(codexDestination, 'NOTICE.md')), true);

  const initialCheck = run(synchronizer, '--check');
  assert.equal(initialCheck.status, 0, initialCheck.stdout);

  const unknownFile = path.join(codexDestination, 'personal-note.txt');
  fs.writeFileSync(unknownFile, 'preserve me\n');
  const preserveUnknown = run(synchronizer, '--sync');
  assert.equal(preserveUnknown.status, 0, preserveUnknown.stderr);
  assert.equal(fs.readFileSync(unknownFile, 'utf8'), 'preserve me\n');

  const managedSkill = path.join(codexDestination, 'SKILL.md');
  fs.appendFileSync(managedSkill, '\nlocal change\n');
  const conflict = run(synchronizer, '--sync', '--target', 'codex');
  assert.equal(conflict.status, 3);
  assert.match(conflict.stderr, /changed in the installation/);

  const drift = run(synchronizer, '--check', '--target', 'codex');
  assert.equal(drift.status, 2);
  assert.match(drift.stdout, /DRIFT/);

  fs.copyFileSync(path.join(canonicalRoot, 'SKILL.md'), managedSkill);
  const markerPath = path.join(codexDestination, '.skill-sync.json');
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  const obsoletePath = path.join(codexDestination, 'obsolete.txt');
  fs.writeFileSync(obsoletePath, 'old managed file\n');
  marker.managedFiles['obsolete.txt'] = hash('old managed file\n');
  fs.writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`);

  const staleCleanup = run(synchronizer, '--sync', '--target', 'codex');
  assert.equal(staleCleanup.status, 0, staleCleanup.stderr);
  assert.equal(fs.existsSync(obsoletePath), false);

  const installedSynchronizer = path.join(
    codexDestination,
    'scripts',
    'sync-installations.mjs'
  );
  const installedCheck = run(installedSynchronizer, '--check');
  assert.equal(installedCheck.status, 0, installedCheck.stdout);

  const migrationParent = path.join(temporaryRoot, 'migration-codex');
  const migrationDestination = path.join(migrationParent, skillName);
  const legacyDestination = path.join(migrationParent, legacySkillName);
  const migrationSeed = runWithDestinations(
    synchronizer,
    legacyDestination,
    claudeDestination,
    '--sync',
    '--target',
    'codex'
  );
  assert.equal(migrationSeed.status, 0, migrationSeed.stderr);

  const legacyMarkerPath = path.join(legacyDestination, '.skill-sync.json');
  const legacyMarker = JSON.parse(fs.readFileSync(legacyMarkerPath, 'utf8'));
  for (const relativePath of Object.keys(legacyMarker.managedFiles)) {
    const filePath = path.join(legacyDestination, relativePath);
    const content = fs.readFileSync(filePath, 'utf8')
      .replaceAll(skillName, legacySkillName)
      .replaceAll('Accessible Dark Mode Design Expert', 'Dark Mode Design Expert');
    fs.writeFileSync(filePath, content);
    legacyMarker.managedFiles[relativePath] = hash(content);
  }
  legacyMarker.skillName = legacySkillName;
  legacyMarker.canonicalSource = path.join(temporaryRoot, legacySkillName);
  fs.writeFileSync(legacyMarkerPath, `${JSON.stringify(legacyMarker, null, 2)}\n`);
  fs.writeFileSync(path.join(legacyDestination, 'personal-note.txt'), 'preserve me\n');

  const migration = runWithDestinations(
    synchronizer,
    migrationDestination,
    claudeDestination,
    '--migrate-name',
    '--target',
    'codex'
  );
  assert.equal(migration.status, 0, migration.stderr);
  assert.equal(fs.existsSync(legacyDestination), false);
  assert.equal(fs.existsSync(migrationDestination), true);
  assert.equal(
    fs.readFileSync(path.join(migrationDestination, 'personal-note.txt'), 'utf8'),
    'preserve me\n'
  );
  assert.match(
    fs.readFileSync(path.join(migrationDestination, 'SKILL.md'), 'utf8'),
    new RegExp(`^name: ${skillName}$`, 'm')
  );
  const migratedMarker = JSON.parse(
    fs.readFileSync(path.join(migrationDestination, '.skill-sync.json'), 'utf8')
  );
  assert.equal(migratedMarker.skillName, skillName);

  process.stdout.write('All installation sync tests passed.\n');
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
