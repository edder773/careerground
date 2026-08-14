import type { EvidenceManifest } from './types.js';

export const validationStatus = (text: string): EvidenceManifest['checks'][number]['status'] => {
  const exitCodes = [...text.matchAll(/exit code:\s*(-?\d+)/gi)];
  if (exitCodes.length > 0) return Number(exitCodes.at(-1)?.[1]) === 0 ? 'passed' : 'failed';
  if (/\b(failed|failure|error)\b/i.test(text)) return 'failed';
  if (/\bpassed\b/i.test(text)) return 'passed';
  return 'not-run';
};
