#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const THRESHOLDS = Object.freeze({
  'aa-normal': 4.5,
  'aa-large': 3,
  'aaa-normal': 7,
  'aaa-large': 4.5,
  'non-text': 3,
});

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function usage() {
  return `Contrast Ratio Calculator

Usage:
  node contrast-ratio.mjs <foreground> <background> [options]
  node contrast-ratio.mjs --file <pairs.json> [options]

Options:
  --underlay <color>     Opaque color beneath a translucent background
  --file <path>          JSON array of pairs; each pair may include label,
                         foreground, background, underlay, and require
  --format <text|json>   Output format (default: text)
  --require <criterion>  Apply one criterion to every pair and exit 2 on failure:
                         aa-normal, aa-large, aaa-normal, aaa-large, or non-text.
                         Without this option, batch pairs may set require individually.
  --help                 Show this help

Supported colors:
  #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  rgb()/rgba() with comma or modern space/slash syntax
  hsl()/hsla() with degree hue and percentage saturation/lightness
  black, white, transparent

Examples:
  node contrast-ratio.mjs '#f8fafc' '#0c1222'
  node contrast-ratio.mjs 'rgb(255 255 255 / 60%)' '#121212'
  node contrast-ratio.mjs --file pairs.json --format json --require aa-normal
`;
}

function parseArguments(argv) {
  const options = {
    format: 'text',
    file: null,
    underlay: null,
    require: null,
    positional: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      process.stdout.write(usage());
      process.exit(0);
    }

    if (arg === '--file' || arg === '--format' || arg === '--underlay' || arg === '--require') {
      const value = argv[index + 1];
      if (!value) fail(`${arg} requires a value`);
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--')) fail(`unknown option ${arg}`);
    options.positional.push(arg);
  }

  if (!['text', 'json'].includes(options.format)) {
    fail(`unsupported format ${options.format}; use text or json`);
  }

  if (options.require && !(options.require in THRESHOLDS)) {
    fail(`unsupported criterion ${options.require}`);
  }

  if (options.file && options.positional.length > 0) {
    fail('use either --file or positional foreground/background colors, not both');
  }

  if (!options.file && options.positional.length !== 2) {
    fail('provide foreground and background colors, or use --file');
  }

  return options;
}

function assertRange(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }
  return value;
}

function parseNumber(value, label) {
  const input = value.trim();
  const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (!numberPattern.test(input)) {
    throw new Error(`${label} must be a valid number`);
  }
  return Number(input);
}

function parseAlpha(value) {
  const input = value.trim();
  if (input.endsWith('%')) {
    return assertRange(parseNumber(input.slice(0, -1), 'alpha') / 100, 0, 1, 'alpha');
  }
  return assertRange(parseNumber(input, 'alpha'), 0, 1, 'alpha');
}

function parseRgbChannel(value) {
  const input = value.trim();
  if (input.endsWith('%')) {
    return assertRange(
      parseNumber(input.slice(0, -1), 'RGB percentage'),
      0,
      100,
      'RGB percentage'
    ) * (255 / 100);
  }
  return assertRange(parseNumber(input, 'RGB channel'), 0, 255, 'RGB channel');
}

function splitFunctionalColor(body) {
  const slashParts = body.split('/');
  if (slashParts.length > 2) throw new Error('color has more than one alpha separator');

  const channelPart = slashParts[0].trim();
  let alphaPart = slashParts[1]?.trim() ?? null;
  let channels = channelPart.includes(',')
    ? channelPart.split(',').map((part) => part.trim())
    : channelPart.split(/\s+/).filter(Boolean);

  if (channels.length === 4 && alphaPart === null) {
    alphaPart = channels.pop();
  }

  return { channels, alpha: alphaPart === null ? 1 : parseAlpha(alphaPart) };
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (tValue) => {
    let t = tValue;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: hueToRgb(h + 1 / 3) * 255,
    g: hueToRgb(h) * 255,
    b: hueToRgb(h - 1 / 3) * 255,
  };
}

function parseColor(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('color must be a non-empty string');
  }

  const input = value.trim().toLowerCase();
  const named = {
    black: '#000000',
    white: '#ffffff',
    transparent: '#00000000',
  };

  if (input in named) return parseColor(named[input]);

  const hex = input.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let digits = hex[1];
    if (![3, 4, 6, 8].includes(digits.length)) {
      throw new Error(`unsupported hex length in ${value}`);
    }
    if (digits.length <= 4) {
      digits = [...digits].map((digit) => digit + digit).join('');
    }
    if (digits.length === 6) digits += 'ff';
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: Number.parseInt(digits.slice(6, 8), 16) / 255,
    };
  }

  const rgb = input.match(/^rgba?\((.*)\)$/i);
  if (rgb) {
    const { channels, alpha } = splitFunctionalColor(rgb[1]);
    if (channels.length !== 3) throw new Error(`rgb() requires three channels: ${value}`);
    return {
      r: parseRgbChannel(channels[0]),
      g: parseRgbChannel(channels[1]),
      b: parseRgbChannel(channels[2]),
      a: alpha,
    };
  }

  const hsl = input.match(/^hsla?\((.*)\)$/i);
  if (hsl) {
    const { channels, alpha } = splitFunctionalColor(hsl[1]);
    if (channels.length !== 3) throw new Error(`hsl() requires three channels: ${value}`);
    const hueInput = channels[0].replace(/deg$/i, '');
    const hue = parseNumber(hueInput, 'HSL hue');
    const saturationInput = channels[1];
    const lightnessInput = channels[2];
    if (!saturationInput.endsWith('%') || !lightnessInput.endsWith('%')) {
      throw new Error('hsl() saturation and lightness must be percentages');
    }
    const saturation = assertRange(
      parseNumber(saturationInput.slice(0, -1), 'HSL saturation'),
      0,
      100,
      'HSL saturation'
    );
    const lightness = assertRange(
      parseNumber(lightnessInput.slice(0, -1), 'HSL lightness'),
      0,
      100,
      'HSL lightness'
    );
    return { ...hslToRgb(hue, saturation, lightness), a: alpha };
  }

  throw new Error(`unsupported color syntax: ${value}`);
}

function composite(foreground, background) {
  if (background.a !== 1) {
    throw new Error('compositing requires an opaque background');
  }
  const alpha = foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function linearize(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  return (
    0.2126 * linearize(color.r)
    + 0.7152 * linearize(color.g)
    + 0.0722 * linearize(color.b)
  );
}

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function toHex(color) {
  const channel = (value) => Math.round(value).toString(16).padStart(2, '0');
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function resolvePair(pair, fallbackUnderlay, globalRequirement) {
  if (!pair || typeof pair !== 'object') throw new Error('each pair must be an object');
  const foregroundInput = pair.foreground;
  const backgroundInput = pair.background;
  const underlayInput = pair.underlay ?? fallbackUnderlay;
  const requirement = globalRequirement ?? pair.require ?? null;

  if (requirement && !(requirement in THRESHOLDS)) {
    throw new Error(`unsupported criterion ${requirement}`);
  }

  let foreground = parseColor(foregroundInput);
  let background = parseColor(backgroundInput);

  if (background.a < 1) {
    if (!underlayInput) {
      throw new Error('a translucent background requires underlay');
    }
    const underlay = parseColor(underlayInput);
    if (underlay.a !== 1) throw new Error('underlay must be opaque');
    background = composite(background, underlay);
  }

  if (foreground.a < 1) foreground = composite(foreground, background);

  const ratio = contrastRatio(foreground, background);
  return {
    label: pair.label ?? null,
    foreground: foregroundInput,
    background: backgroundInput,
    underlay: underlayInput ?? null,
    requirement,
    compositedForeground: toHex(foreground),
    compositedBackground: toHex(background),
    ratio,
    ratioDisplay: `${ratio.toFixed(2)}:1`,
    passes: {
      aaNormalText: ratio >= THRESHOLDS['aa-normal'],
      aaLargeText: ratio >= THRESHOLDS['aa-large'],
      aaaNormalText: ratio >= THRESHOLDS['aaa-normal'],
      aaaLargeText: ratio >= THRESHOLDS['aaa-large'],
      nonText: ratio >= THRESHOLDS['non-text'],
    },
  };
}

function readPairs(options) {
  if (!options.file) {
    return [{
      foreground: options.positional[0],
      background: options.positional[1],
      underlay: options.underlay,
    }];
  }

  const filePath = path.resolve(options.file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`could not read ${filePath}: ${error.message}`);
  }

  const pairs = Array.isArray(data) ? data : data.pairs;
  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new Error('batch JSON must be a non-empty array or an object with a pairs array');
  }
  return pairs;
}

function formatText(result, index, total) {
  const heading = result.label || (total > 1 ? `Pair ${index + 1}` : 'Contrast result');
  return [
    heading,
    `  Input: ${result.foreground} on ${result.background}${result.underlay ? ` over ${result.underlay}` : ''}`,
    `  Composited: ${result.compositedForeground} on ${result.compositedBackground}`,
    `  Ratio: ${result.ratioDisplay}`,
    ...(result.requirement ? [`  Required: ${result.requirement}`] : []),
    `  AA normal text (4.5:1): ${result.passes.aaNormalText ? 'PASS' : 'FAIL'}`,
    `  AA large text / non-text (3:1): ${result.passes.aaLargeText ? 'PASS' : 'FAIL'}`,
    `  AAA normal text (7:1): ${result.passes.aaaNormalText ? 'PASS' : 'FAIL'}`,
    `  AAA large text (4.5:1): ${result.passes.aaaLargeText ? 'PASS' : 'FAIL'}`,
  ].join('\n');
}

function criterionPasses(result, criterion) {
  if (!criterion) return true;
  const map = {
    'aa-normal': result.passes.aaNormalText,
    'aa-large': result.passes.aaLargeText,
    'aaa-normal': result.passes.aaaNormalText,
    'aaa-large': result.passes.aaaLargeText,
    'non-text': result.passes.nonText,
  };
  return map[criterion];
}

const options = parseArguments(process.argv.slice(2));

let results;
try {
  results = readPairs(options).map((pair) => (
    resolvePair(pair, options.underlay, options.require)
  ));
} catch (error) {
  fail(error.message);
}

if (options.format === 'json') {
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} else {
  const output = results.map((result, index) => formatText(result, index, results.length)).join('\n\n');
  process.stdout.write(`${output}\n\nPass/fail uses the unrounded ratio; the two-decimal value is display only.\n`);
}

if (results.some((result) => !criterionPasses(result, result.requirement))) {
  process.exit(2);
}
