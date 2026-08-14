import { readFile } from 'node:fs/promises';
import { validateTroubleshootingDocument } from './document-validation.js';

const index = process.argv.indexOf('--file');
const path = index >= 0 ? process.argv[index + 1] : undefined;
if (!path) throw new Error('사용법: pnpm troubleshoot:validate --file <path>');
const text = await readFile(path, 'utf8');
const errors = validateTroubleshootingDocument(text, path);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`${path}: valid`);
