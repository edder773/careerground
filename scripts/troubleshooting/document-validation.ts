import { scanSensitive } from './redact.js';

const frontmatterValue = (text: string, key: string) =>
  text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();

export function validateTroubleshootingDocument(text: string, path = '') {
  const errors: string[] = [];
  const generated = frontmatterValue(text, 'generatedByAI');
  if (!generated) errors.push('frontmatter missing generatedByAI:');
  if (generated === 'true' && !frontmatterValue(text, 'model'))
    errors.push('AI-generated document missing model:');
  if (!path.endsWith('/README.md') && path !== 'README.md') {
    for (const key of ['pr', 'commit', 'evidence'])
      if (!frontmatterValue(text, key)) errors.push(`frontmatter missing ${key}:`);
  }
  for (const finding of scanSensitive(text))
    if (!finding.includes('[REDACTED')) errors.push(`sensitive value: ${finding.slice(0, 40)}`);
  if (/\b(?:100%|0ms|zero regressions)\b/i.test(text))
    errors.push('unsupported absolute metric claim');
  return errors;
}
