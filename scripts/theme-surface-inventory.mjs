#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function usage() {
  return `Theme surface inventory

Usage:
  node theme-surface-inventory.mjs [project-directory] [options]

Options:
  --json              Emit machine-readable JSON
  --summary-only      Omit candidate source lines
  --limit=N           Show the first N candidate lines in path order (default: 160)
  --help              Show this help

Candidate snippets may contain project source. Review output before sharing it.
`;
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n\n${usage()}`);
  process.exit(2);
}

function parseArguments(args) {
  const options = {
    rootArgument: '.',
    rootWasSet: false,
    jsonOutput: false,
    summaryOnly: false,
    limit: 160,
  };

  for (const argument of args) {
    if (argument === '--help') {
      process.stdout.write(usage());
      process.exit(0);
    }
    if (argument === '--json') {
      options.jsonOutput = true;
      continue;
    }
    if (argument === '--summary-only') {
      options.summaryOnly = true;
      continue;
    }
    if (argument.startsWith('--limit=')) {
      const value = argument.slice('--limit='.length);
      if (!/^\d+$/.test(value)) fail('--limit must be a non-negative integer');
      options.limit = Number.parseInt(value, 10);
      continue;
    }
    if (argument.startsWith('--')) fail(`unknown option ${argument}`);
    if (options.rootWasSet) fail(`unexpected project directory ${argument}`);
    options.rootArgument = argument;
    options.rootWasSet = true;
  }

  return options;
}

const options = parseArguments(process.argv.slice(2));
const root = path.resolve(options.rootArgument);
const { jsonOutput, summaryOnly, limit } = options;

const extensions = new Set([
  '.astro', '.cjs', '.css', '.cts', '.html', '.js', '.jsx', '.less', '.mdx',
  '.mjs', '.mts', '.sass', '.scss', '.svelte', '.svg', '.ts', '.tsx', '.vue',
]);
const ignoredDirectories = new Set([
  '.agents', '.cache', '.claude', '.codex', '.git', '.next', '.nuxt', '.output',
  '.parcel-cache', '.storybook', '.svelte-kit', '.turbo', '.vercel', '.vite',
  'build', 'coverage', 'dist', 'node_modules', 'output', 'public/build',
  'storybook-static', 'vendor',
]);

const rules = [
  {
    id: 'hardcoded-color',
    description: 'Raw color literal that may bypass semantic tokens',
    pattern: /#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})(?![0-9a-f])|(?:color|hsla?|hwb|lab|lch|oklab|oklch|rgba?)\([^)]*\)/i,
  },
  {
    id: 'inline-style',
    description: 'Inline style or style object that may require runtime theming',
    pattern: /\bstyle\s*=\s*["'{]|\bstyle\.\w+\s*=/i,
  },
  {
    id: 'transition-all',
    description: 'Broad transition can animate unrelated theme or layout properties',
    pattern: /\btransition\s*:\s*all\b/i,
  },
  {
    id: 'theme-transition',
    description: 'Theme-sensitive transition to review for temporal mismatch',
    pattern: /\btransition(?:-property)?\s*:[^;]*(?:background|color|border|shadow|filter)/i,
  },
  {
    id: 'animation-or-view-transition',
    description: 'Animation or View Transition that may change theme-switch behavior',
    pattern: /(?:@keyframes\b|\banimation(?:-name)?\s*:|\bview-transition(?:-name)?\s*:)/i,
  },
  {
    id: 'visual-effect-or-image',
    description: 'Shadow, filter, blend, mask, gradient, or background image candidate',
    pattern: /(?:\b(?:backdrop-filter|background-image|box-shadow|filter|mask(?:-image)?|mix-blend-mode|text-shadow)\s*:|\b(?:conic|linear|radial)-gradient\s*\()/i,
  },
  {
    id: 'overlay-or-external-surface',
    description: 'Overlay, portal, map, iframe, or third-party surface candidate',
    pattern: /(?:\b(?:dialog|drawer|iframe|leaflet|map-container|map-view|mapbox|menu|modal|overlay|popover|portal|scrim|sheet|snackbar|toast|tooltip)(?:[-_a-z0-9]*\b)?|\bgoogle\.maps\b|\b(?:paypal|stripe)[-_.](?:button|buttons|container|element|elements|iframe|sdk|script|widget)\b|\bpayment[-_](?:container|element|iframe|modal|overlay|provider|widget)\b)/i,
  },
  {
    id: 'pseudo-element',
    description: 'Pseudo-element may own a selected state or themed surface',
    pattern: /::?(?:before|after)\b/i,
  },
  {
    id: 'svg-color',
    description: 'SVG fill or stroke may need a semantic theme role',
    pattern: /\b(?:fill|stroke)\s*[:=]\s*["']?(?:#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})(?![0-9a-f])|(?:color|hsla?|hwb|lab|lch|oklab|oklch|rgba?)\()/i,
  },
];

function shouldIgnore(relativePath) {
  const segments = relativePath.split(path.sep);
  return segments.some((segment, index) => {
    const prefix = segments.slice(0, index + 1).join('/');
    return ignoredDirectories.has(segment) || ignoredDirectories.has(prefix);
  });
}

function collectFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) files.push(...collectFiles(absolutePath));
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }
  return files;
}

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  fail(`project directory not found: ${root}`);
}

const files = collectFiles(root).sort();
const counts = Object.fromEntries(rules.map((rule) => [rule.id, 0]));
const candidates = [];
let totalCandidateLines = 0;

for (const file of files) {
  const relativeFile = path.relative(root, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const categories = rules.filter((rule) => rule.pattern.test(line)).map((rule) => rule.id);
    if (!categories.length) return;
    totalCandidateLines += 1;
    for (const category of categories) counts[category] += 1;
    if (candidates.length < limit) {
      candidates.push({
        file: relativeFile,
        line: index + 1,
        categories,
        snippet: line.trim().replace(/\s+/g, ' ').slice(0, 220),
      });
    }
  });
}

const result = {
  root,
  scannedFiles: files.length,
  totalCandidateLines,
  counts,
  rules: Object.fromEntries(rules.map((rule) => [rule.id, rule.description])),
  shownCandidateLines: summaryOnly ? 0 : candidates.length,
  truncated: !summaryOnly && totalCandidateLines > candidates.length,
  candidates: summaryOnly ? [] : candidates,
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(0);
}

process.stdout.write(`Theme surface inventory: ${root}\n`);
process.stdout.write(`Scanned ${files.length} source files. Candidates require human review.\n\n`);
process.stdout.write(
  `Matched ${totalCandidateLines} source lines. Category counts can overlap.\n\n`,
);
for (const rule of rules) {
  process.stdout.write(`${rule.id.padEnd(30)} ${String(counts[rule.id]).padStart(6)}  ${rule.description}\n`);
}

if (!summaryOnly && candidates.length) {
  process.stdout.write(`\nCandidate lines (showing up to ${limit}):\n`);
  for (const candidate of candidates) {
    process.stdout.write(
      `${candidate.file}:${candidate.line} [${candidate.categories.join(', ')}] ${candidate.snippet}\n`,
    );
  }
}

if (result.truncated) {
  process.stdout.write(
    `\nOutput truncated in path order. Increase --limit=N; --json changes the format but keeps the limit.\n`,
  );
}

process.stdout.write('\nThis inventory is not a pass/fail result. Review candidates against the coverage manifest.\n');
