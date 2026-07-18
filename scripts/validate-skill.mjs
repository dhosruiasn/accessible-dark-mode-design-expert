#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..'));
const errors = [];

function report(message) {
  errors.push(message);
}

function walk(directory, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolutePath, predicate));
    else if (entry.isFile() && predicate(absolutePath)) files.push(absolutePath);
  }
  return files.sort();
}

function yamlScalar(text, key) {
  const match = text.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return null;
  const value = match[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      report(`invalid quoted YAML value for ${key}`);
      return null;
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

const skillPath = path.join(root, 'SKILL.md');
if (!fs.existsSync(skillPath)) {
  report('SKILL.md not found');
} else {
  const skill = fs.readFileSync(skillPath, 'utf8');
  const frontmatterMatch = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    report('SKILL.md has invalid YAML frontmatter boundaries');
  } else {
    const frontmatter = frontmatterMatch[1];
    const keys = frontmatter
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-zA-Z0-9-]+):/)?.[1])
      .filter(Boolean);
    const unexpected = keys.filter((key) => !['name', 'description'].includes(key));
    if (unexpected.length) {
      report(`unexpected SKILL.md frontmatter keys: ${unexpected.join(', ')}`);
    }

    const name = yamlScalar(frontmatter, 'name');
    const description = yamlScalar(frontmatter, 'description');
    if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      report('skill name must be hyphen-case and at most 64 characters');
    }
    if (!description || description.length > 1024 || /[<>]/.test(description)) {
      report('description must be non-empty, at most 1024 characters, and contain no angle brackets');
    }

    const openaiPath = path.join(root, 'agents', 'openai.yaml');
    if (!fs.existsSync(openaiPath)) {
      report('agents/openai.yaml not found');
    } else {
      const openai = fs.readFileSync(openaiPath, 'utf8');
      const displayName = yamlScalar(openai, 'display_name');
      const shortDescription = yamlScalar(openai, 'short_description');
      const defaultPrompt = yamlScalar(openai, 'default_prompt');
      if (!displayName) report('agents/openai.yaml display_name is missing');
      if (!shortDescription || shortDescription.length < 25 || shortDescription.length > 64) {
        report('short_description must contain 25–64 characters');
      }
      if (!defaultPrompt || !name || !defaultPrompt.includes(`$${name}`)) {
        report('default_prompt must mention the skill with $skill-name');
      }
    }
  }

  const lineCount = skill.split(/\r?\n/).length;
  if (lineCount > 500) report(`SKILL.md has ${lineCount} lines; maximum is 500`);
}

const markdownFiles = walk(root, (file) => file.endsWith('.md'));
for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(root, file);
  const fences = content.match(/^```/gm)?.length ?? 0;
  if (fences % 2 !== 0) report(`${relativeFile} has unbalanced code fences`);

  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    let target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) report(`${relativeFile} links to missing ${target}`);
  }
}

for (const file of walk(root, (candidate) => candidate.endsWith('.json'))) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    report(`${path.relative(root, file)} contains invalid JSON: ${error.message}`);
  }
}

for (const file of walk(path.join(root, 'scripts'), (candidate) => candidate.endsWith('.mjs'))) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) {
    report(`${path.relative(root, file)} failed syntax validation: ${check.stderr.trim()}`);
  }
}

if (errors.length) {
  for (const error of errors) process.stderr.write(`- ${error}\n`);
  process.exit(1);
}

process.stdout.write(
  `Skill is valid: ${markdownFiles.length} Markdown files and all bundled scripts checked.\n`
);
