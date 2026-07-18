#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_NAME = 'accessible-dark-mode-design-expert';
const LEGACY_SKILL_NAME = 'dark-mode-design-expert';
const MARKER_FILE = '.skill-sync.json';
const SCHEMA_VERSION = 1;
const initialRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class SyncConflictError extends Error {}

function usage() {
  return `Dark Mode Skill installation sync

Usage:
  node sync-installations.mjs --sync [--target all|codex|claude] [--dry-run]
  node sync-installations.mjs --check [--target all|codex|claude]
  node sync-installations.mjs --adopt [--target codex|claude] [--dry-run]
  node sync-installations.mjs --migrate-name [--target all|codex|claude] [--dry-run]

Options:
  --sync                 Copy canonical changes to managed installations
  --check                Exit 2 when an installation is missing or has drift
  --adopt                Mark an existing identical installation as managed
  --migrate-name         Rename a managed v1 installation and sync v2
  --target <target>      all, codex, or claude (default: all)
  --codex-dest <path>    Override the Codex installation directory
  --claude-dest <path>   Override the Claude installation directory
  --dry-run              Report adoption or sync changes without writing
  --help                 Show this help

The script preserves unknown destination files. It refuses to overwrite a
managed file changed locally since the last sync.
`;
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const options = {
    action: null,
    target: 'all',
    codexDest: null,
    claudeDest: null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help') {
      process.stdout.write(usage());
      process.exit(0);
    }

    if (['--sync', '--check', '--adopt', '--migrate-name'].includes(argument)) {
      if (options.action) {
        fail('choose exactly one of --sync, --check, --adopt, or --migrate-name');
      }
      options.action = argument === '--migrate-name' ? 'migrateName' : argument.slice(2);
      continue;
    }

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (['--target', '--codex-dest', '--claude-dest'].includes(argument)) {
      const value = argv[index + 1];
      if (!value) fail(`${argument} requires a value`);
      const key = argument === '--target'
        ? 'target'
        : argument === '--codex-dest'
          ? 'codexDest'
          : 'claudeDest';
      options[key] = value;
      index += 1;
      continue;
    }

    fail(`unknown option ${argument}`);
  }

  if (!options.action) fail('choose --sync, --check, --adopt, or --migrate-name');
  if (!['all', 'codex', 'claude'].includes(options.target)) {
    fail('--target must be all, codex, or claude');
  }
  if (options.action === 'check' && options.dryRun) {
    fail('--dry-run is unnecessary with --check');
  }
  if (options.action === 'adopt' && options.target === 'all') {
    fail('--adopt requires --target codex or --target claude');
  }

  return options;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`could not read ${filePath}: ${error.message}`);
  }
}

function readMarker(root, expectedSkillName = SKILL_NAME) {
  const markerPath = path.join(root, MARKER_FILE);
  if (!fs.existsSync(markerPath)) return null;
  const marker = readJson(markerPath);
  if (
    marker.schemaVersion !== SCHEMA_VERSION
    || marker.skillName !== expectedSkillName
    || typeof marker.canonicalSource !== 'string'
    || !marker.managedFiles
    || typeof marker.managedFiles !== 'object'
  ) {
    throw new Error(`invalid sync marker at ${markerPath}`);
  }
  return marker;
}

function resolveCanonicalRoot(root) {
  const marker = readMarker(root);
  if (!marker) return root;
  const candidate = path.resolve(marker.canonicalSource);
  if (!fs.existsSync(path.join(candidate, 'SKILL.md'))) {
    throw new Error(`canonical source no longer exists: ${candidate}`);
  }
  return candidate;
}

function validateSkillRoot(root, expectedSkillName = SKILL_NAME) {
  const skillPath = path.join(root, 'SKILL.md');
  if (!fs.existsSync(skillPath)) throw new Error(`SKILL.md not found in ${root}`);
  const text = fs.readFileSync(skillPath, 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const name = frontmatter?.[1].match(/^name:\s*([^\s]+)\s*$/m)?.[1];
  if (name !== expectedSkillName) {
    throw new Error(`expected skill name ${expectedSkillName} in ${skillPath}`);
  }
}

function shouldExclude(relativePath, repositorySource = false) {
  const parts = relativePath.split(path.sep);
  const repositoryOnly = new Set([
    '.gitignore',
    'CHANGELOG.md',
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
  ]);
  return (
    relativePath === MARKER_FILE
    || (repositorySource && repositoryOnly.has(relativePath))
    || (repositorySource && parts[0] === '.github')
    || (repositorySource && parts[0] === 'docs')
    || parts.includes('.git')
    || parts.includes('node_modules')
    || parts.includes('.DS_Store')
  );
}

function listFiles(root, { repositorySource = false } = {}) {
  const files = [];

  function visit(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(root, absolutePath);
      if (shouldExclude(relativePath, repositorySource)) continue;
      if (entry.isSymbolicLink()) {
        throw new Error(`symbolic links are not supported in the canonical skill: ${relativePath}`);
      }
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) files.push(relativePath);
    }
  }

  visit(root);
  return files;
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fileMap(root, options = {}) {
  return Object.fromEntries(
    listFiles(root, options).map((relativePath) => [
      relativePath,
      hashFile(path.join(root, relativePath)),
    ])
  );
}

function sourceFingerprint(files) {
  const digest = crypto.createHash('sha256');
  for (const [relativePath, hash] of Object.entries(files).sort()) {
    digest.update(relativePath);
    digest.update('\0');
    digest.update(hash);
    digest.update('\n');
  }
  return digest.digest('hex');
}

function createMarker(canonicalRoot, managedFiles) {
  return {
    schemaVersion: SCHEMA_VERSION,
    skillName: SKILL_NAME,
    canonicalSource: canonicalRoot,
    sourceFingerprint: sourceFingerprint(managedFiles),
    syncedAt: new Date().toISOString(),
    managedFiles: Object.fromEntries(Object.entries(managedFiles).sort()),
  };
}

function writeMarker(destination, marker) {
  fs.writeFileSync(
    path.join(destination, MARKER_FILE),
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
}

function selectedDestinations(options) {
  const codexHome = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), '.codex');
  const destinations = {
    codex: options.codexDest
      ? path.resolve(options.codexDest)
      : path.join(codexHome, 'skills', SKILL_NAME),
    claude: options.claudeDest
      ? path.resolve(options.claudeDest)
      : path.join(os.homedir(), '.claude', 'skills', SKILL_NAME),
  };

  return Object.entries(destinations)
    .filter(([name]) => options.target === 'all' || options.target === name);
}

function adoptDestination(name, destination, canonicalRoot, dryRun) {
  if (!fs.existsSync(destination)) {
    throw new Error(`[${name}] destination does not exist; use --sync to create it`);
  }
  if (readMarker(destination)) {
    process.stdout.write(`[${name}] already managed: ${destination}\n`);
    return;
  }

  validateSkillRoot(destination);
  const sourceFiles = fileMap(canonicalRoot, { repositorySource: true });
  const destinationFiles = fileMap(destination);
  const unexpected = [];
  const different = [];

  for (const [relativePath, destinationHash] of Object.entries(destinationFiles)) {
    if (!(relativePath in sourceFiles)) unexpected.push(relativePath);
    else if (sourceFiles[relativePath] !== destinationHash) different.push(relativePath);
  }

  if (unexpected.length || different.length) {
    const details = [
      ...unexpected.map((file) => `unrecognized file: ${file}`),
      ...different.map((file) => `different file: ${file}`),
    ];
    throw new SyncConflictError(
      `[${name}] cannot adopt ${destination}; ${details.join(', ')}`
    );
  }

  process.stdout.write(
    `[${name}] ${dryRun ? 'would adopt' : 'adopted'} ${Object.keys(destinationFiles).length} files at ${destination}\n`
  );
  if (!dryRun) writeMarker(destination, createMarker(canonicalRoot, destinationFiles));
}

function findSyncConflicts(sourceFiles, destinationFiles, marker) {
  const conflicts = [];

  for (const [relativePath, destinationHash] of Object.entries(destinationFiles)) {
    const previousHash = marker.managedFiles[relativePath];
    const sourceHash = sourceFiles[relativePath];

    if (previousHash && destinationHash !== previousHash && destinationHash !== sourceHash) {
      conflicts.push(`${relativePath} changed in the installation`);
    } else if (!previousHash && sourceHash && destinationHash !== sourceHash) {
      conflicts.push(`${relativePath} is unmanaged and conflicts with the source`);
    }
  }

  for (const [relativePath, previousHash] of Object.entries(marker.managedFiles)) {
    if (relativePath in sourceFiles) continue;
    const destinationHash = destinationFiles[relativePath];
    if (destinationHash && destinationHash !== previousHash) {
      conflicts.push(`${relativePath} changed locally but was removed from the source`);
    }
  }

  return conflicts;
}

function copyManagedFile(canonicalRoot, destination, relativePath) {
  const sourcePath = path.join(canonicalRoot, relativePath);
  const destinationPath = path.join(destination, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  fs.chmodSync(destinationPath, fs.statSync(sourcePath).mode);
}

function removeEmptyParents(startDirectory, stopDirectory) {
  let current = startDirectory;
  const stop = path.resolve(stopDirectory);
  while (path.resolve(current).startsWith(`${stop}${path.sep}`)) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) return;
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function migrateDestination(name, destination, canonicalRoot, dryRun) {
  const legacyDestination = path.join(path.dirname(destination), LEGACY_SKILL_NAME);
  const destinationExists = fs.existsSync(destination);
  const legacyExists = fs.existsSync(legacyDestination);

  if (destinationExists && legacyExists) {
    throw new SyncConflictError(
      `[${name}] both old and new installations exist; resolve them before migration`
    );
  }
  if (destinationExists) {
    process.stdout.write(`[${name}] already uses the new name: ${destination}\n`);
    syncDestination(name, destination, canonicalRoot, dryRun);
    return;
  }
  if (!legacyExists) {
    throw new Error(
      `[${name}] legacy installation not found at ${legacyDestination}; use --sync for a new install`
    );
  }

  validateSkillRoot(legacyDestination, LEGACY_SKILL_NAME);
  const marker = readMarker(legacyDestination, LEGACY_SKILL_NAME);
  if (!marker) {
    throw new SyncConflictError(
      `[${name}] legacy installation is unmanaged and cannot be migrated safely`
    );
  }

  const sourceFiles = fileMap(canonicalRoot, { repositorySource: true });
  const destinationFiles = fileMap(legacyDestination);
  const conflicts = findSyncConflicts(sourceFiles, destinationFiles, marker);
  if (conflicts.length) {
    throw new SyncConflictError(`[${name}] migration conflict: ${conflicts.join('; ')}`);
  }

  const filesToCopy = Object.entries(sourceFiles)
    .filter(([relativePath, hash]) => destinationFiles[relativePath] !== hash)
    .map(([relativePath]) => relativePath);
  const staleFiles = Object.keys(marker.managedFiles)
    .filter((relativePath) => !(relativePath in sourceFiles) && destinationFiles[relativePath]);

  process.stdout.write(
    `[${name}] ${dryRun ? 'would migrate' : 'migrated'} ${legacyDestination} to ${destination}; `
    + `${filesToCopy.length} changed/new and ${staleFiles.length} stale files\n`
  );
  if (dryRun) return;

  fs.renameSync(legacyDestination, destination);
  for (const relativePath of filesToCopy) {
    copyManagedFile(canonicalRoot, destination, relativePath);
  }
  for (const relativePath of staleFiles) {
    const destinationPath = path.join(destination, relativePath);
    fs.unlinkSync(destinationPath);
    removeEmptyParents(path.dirname(destinationPath), destination);
  }
  writeMarker(destination, createMarker(canonicalRoot, sourceFiles));
}

function syncDestination(name, destination, canonicalRoot, dryRun) {
  const sourceFiles = fileMap(canonicalRoot, { repositorySource: true });
  const destinationExists = fs.existsSync(destination);

  if (path.resolve(destination) === path.resolve(canonicalRoot)) {
    process.stdout.write(`[${name}] destination is the canonical source; skipped\n`);
    return;
  }

  if (!destinationExists) {
    process.stdout.write(
      `[${name}] ${dryRun ? 'would create' : 'created'} ${destination} with ${Object.keys(sourceFiles).length} files\n`
    );
    if (dryRun) return;
    fs.mkdirSync(destination, { recursive: true });
    for (const relativePath of Object.keys(sourceFiles)) {
      copyManagedFile(canonicalRoot, destination, relativePath);
    }
    writeMarker(destination, createMarker(canonicalRoot, sourceFiles));
    return;
  }

  validateSkillRoot(destination);
  const marker = readMarker(destination);
  if (!marker) {
    throw new SyncConflictError(
      `[${name}] unmanaged destination; run --adopt --target ${name} first`
    );
  }
  if (path.resolve(marker.canonicalSource) !== path.resolve(canonicalRoot)) {
    throw new SyncConflictError(
      `[${name}] marker points to another source: ${marker.canonicalSource}`
    );
  }

  const destinationFiles = fileMap(destination);
  const conflicts = findSyncConflicts(sourceFiles, destinationFiles, marker);
  if (conflicts.length) {
    throw new SyncConflictError(`[${name}] sync conflict: ${conflicts.join('; ')}`);
  }

  const filesToCopy = Object.entries(sourceFiles)
    .filter(([relativePath, hash]) => destinationFiles[relativePath] !== hash)
    .map(([relativePath]) => relativePath);
  const staleFiles = Object.keys(marker.managedFiles)
    .filter((relativePath) => !(relativePath in sourceFiles) && destinationFiles[relativePath]);

  process.stdout.write(
    `[${name}] ${dryRun ? 'would sync' : 'synced'} ${filesToCopy.length} changed/new and ${staleFiles.length} stale files at ${destination}\n`
  );
  if (dryRun) return;

  for (const relativePath of filesToCopy) {
    copyManagedFile(canonicalRoot, destination, relativePath);
  }
  for (const relativePath of staleFiles) {
    const destinationPath = path.join(destination, relativePath);
    fs.unlinkSync(destinationPath);
    removeEmptyParents(path.dirname(destinationPath), destination);
  }
  writeMarker(destination, createMarker(canonicalRoot, sourceFiles));
}

function checkDestination(name, destination, canonicalRoot) {
  if (!fs.existsSync(destination)) {
    process.stdout.write(`[${name}] MISSING ${destination}\n`);
    return false;
  }

  let marker;
  try {
    validateSkillRoot(destination);
    marker = readMarker(destination);
  } catch (error) {
    process.stdout.write(`[${name}] INVALID ${error.message}\n`);
    return false;
  }

  if (!marker) {
    process.stdout.write(`[${name}] UNMANAGED ${destination}\n`);
    return false;
  }

  const sourceFiles = fileMap(canonicalRoot, { repositorySource: true });
  const destinationFiles = fileMap(destination);
  const drift = [];

  if (path.resolve(marker.canonicalSource) !== path.resolve(canonicalRoot)) {
    drift.push('canonical source path differs');
  }
  for (const [relativePath, sourceHash] of Object.entries(sourceFiles)) {
    if (!destinationFiles[relativePath]) drift.push(`${relativePath} is missing`);
    else if (destinationFiles[relativePath] !== sourceHash) drift.push(`${relativePath} differs`);
  }
  for (const relativePath of Object.keys(marker.managedFiles)) {
    if (!(relativePath in sourceFiles) && destinationFiles[relativePath]) {
      drift.push(`${relativePath} is stale`);
    }
  }

  if (drift.length) {
    process.stdout.write(`[${name}] DRIFT ${drift.join('; ')}\n`);
    return false;
  }

  process.stdout.write(`[${name}] OK ${destination}\n`);
  return true;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const canonicalRoot = resolveCanonicalRoot(initialRoot);
  validateSkillRoot(canonicalRoot);
  const destinations = selectedDestinations(options);

  if (options.action === 'check') {
    const valid = destinations.map(([name, destination]) => (
      checkDestination(name, destination, canonicalRoot)
    ));
    if (valid.some((result) => !result)) process.exit(2);
    return;
  }

  for (const [name, destination] of destinations) {
    if (options.action === 'adopt') {
      adoptDestination(name, destination, canonicalRoot, options.dryRun);
    } else if (options.action === 'migrateName') {
      migrateDestination(name, destination, canonicalRoot, options.dryRun);
    } else {
      syncDestination(name, destination, canonicalRoot, options.dryRun);
    }
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof SyncConflictError ? 'Conflict' : 'Error'}: ${error.message}\n`);
  process.exit(error instanceof SyncConflictError ? 3 : 1);
}
