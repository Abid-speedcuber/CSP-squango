#!/usr/bin/env node

/**
 * Generate a boot preset from a regular preset.
 *
 * Usage:
 *   node generate-boot-preset.js path/to/Preset.json [output-file-or-directory]
 *
 * If the second argument is omitted, the output is written beside the input
 * as "<preset-name>.boot.json".
 */

const fs = require('node:fs');
const path = require('node:path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node generate-boot-preset.js <preset.json> [output-file-or-directory]');
  process.exitCode = 1;
  return;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read JSON preset "${filePath}": ${error.message}`);
  }
}

function outputPathFor(input, outputArgument) {
  const inputDirectory = path.dirname(input);
  const inputName = path.basename(input, path.extname(input));
  if (!outputArgument) {
    return path.join(inputDirectory, `${inputName}.boot.json`);
  }
  if (path.extname(outputArgument).toLowerCase() === '.json') {
    return outputArgument;
  }
  return path.join(outputArgument, `${inputName}.boot.json`);
}

function copyIfPresent(source, target, key) {
  if (source[key] !== undefined) target[key] = source[key];
}

function generateBootPreset(preset) {
  const boot = {};

  // These fields are needed to render the initial cards consistently.
  for (const key of [
    'displayNames',
    'perCaseSubtitles',
    'comments',
    'customAlgorithms',
    'colorScheme',
    'cornerStickerMode',
    'evilnessMap',
    'evilnessEnabled',
    'evilnessAffectsHomescreen',
    'hideInstructions',
    'parityOrientations',
    'tracingPositions',
  ]) {
    copyIfPresent(preset, boot, key);
  }

  // Boot data should use the same grouped settings schema as the source.
  copyIfPresent(preset, boot, 'preferences');

  // Training is intentionally not needed to render the homepage and is
  // therefore excluded from the boot file.

  // Preserve generated caches when the source preset contains them. A normal
  // slim preset generally does not, so the app will generate those values.
  for (const key of ['cachedParityAlgorithms', 'homepageShapeSVGCache']) {
    copyIfPresent(preset, boot, key);
  }

  // Keep only the fields understood by the current boot loader. This also
  // prevents progress, profile, and export-only data from leaking into boot.
  return boot;
}

try {
  const input = path.resolve(inputPath);
  const output = path.resolve(outputPathFor(input, process.argv[3]));
  const preset = readJson(input);
  const boot = generateBootPreset(preset);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(boot, null, 2)}\n`);
  console.log(`Generated ${output}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
