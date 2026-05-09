#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');
const targets = ['refactor/js', 'refactor/database', 'refactor/res/shapeImages'];

const result = spawnSync(process.execPath, [eslintBin, ...targets, '--format', 'json'], {
  cwd: root,
  encoding: 'utf8'
});

if (result.error) {
  console.error(result.error.message);
  process.exit(2);
}

if (result.stderr) process.stderr.write(result.stderr);

let reports;
try {
  reports = JSON.parse(result.stdout || '[]');
} catch {
  process.stdout.write(result.stdout || '');
  process.exit(result.status || 2);
}

let errors = 0;
let warnings = 0;

for (const report of reports) {
  const messages = report.messages || [];
  if (messages.length === 0) continue;

  const relativePath = path.relative(root, report.filePath);
  console.log(`\n${relativePath}`);
  for (const message of messages) {
    const severity = message.severity === 2 ? 'error' : 'warn';
    if (message.severity === 2) errors++;
    else warnings++;
    console.log(`  ${message.line}:${message.column}  ${severity}  ${message.ruleId}  ${message.message}`);
  }
}

if (errors === 0 && warnings === 0) {
  console.log('Refactor lint passed with 0 issues.');
} else {
  console.log(`\nRefactor lint finished: ${errors} error(s), ${warnings} warning(s).`);
}

process.exit(errors > 0 ? 1 : 0);
