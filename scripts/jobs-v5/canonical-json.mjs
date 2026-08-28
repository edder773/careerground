import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';

const DEFAULT_UNORDERED_ARRAY_KEYS = new Set(['sources', 'techStack', 'tags', 'excludedReasons']);

function canonicalValue(value, parentKey, unorderedArrayKeys) {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => canonicalValue(entry, '', unorderedArrayKeys));
    if (unorderedArrayKeys.has(parentKey)) {
      normalized.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    } else if (parentKey === 'items') {
      normalized.sort((left, right) =>
        String(left?.canonicalJobKey || left?.id || '').localeCompare(
          String(right?.canonicalJobKey || right?.id || ''),
        ),
      );
    }
    return normalized;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, canonicalValue(value[key], key, unorderedArrayKeys)]),
    );
  }
  return value;
}

export function canonicalStringify(
  value,
  { unorderedArrayKeys = DEFAULT_UNORDERED_ARRAY_KEYS } = {},
) {
  return JSON.stringify(canonicalValue(value, '', unorderedArrayKeys));
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export const rawSha256 = (raw) => sha256(Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw)));
export const canonicalSha256 = (value) => sha256(Buffer.from(canonicalStringify(value), 'utf8'));

export function normalizeDownloadDisplayName(fileName) {
  const extensionIndex = fileName.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : '';
  let stem = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  let previous;
  do {
    previous = stem;
    stem = stem.replace(/\s*\(\d+\)$/u, '');
  } while (stem !== previous);
  return `${stem}${extension}`;
}

export function canonicalizeHttpUrl(value) {
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Only HTTP(S) URLs are supported.');
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) {
    if (/^(?:utm_|fbclid$|gclid$)/iu.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/u, '');
  return url.toString();
}
