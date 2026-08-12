import { readFile } from 'node:fs/promises';
import { scanSensitive } from './redact.js';

const index = process.argv.indexOf('--file');
const path = index >= 0 ? process.argv[index + 1] : undefined;
if (!path) throw new Error('사용법: pnpm troubleshoot:validate --file <path>');
const text = await readFile(path, 'utf8');
const errors: string[] = [];
for (const key of ['generatedByAI:', 'model:', 'pr:', 'commit:', 'evidence:'])
  if (!text.includes(key)) errors.push(`frontmatter missing ${key}`);
for (const finding of scanSensitive(text))
  if (!finding.includes('[REDACTED')) errors.push(`sensitive value: ${finding.slice(0, 40)}`);
if (/\b(?:100%|0ms|zero regressions)\b/i.test(text))
  errors.push('unsupported absolute metric claim');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`${path}: valid`);
