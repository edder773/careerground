export const normalizedText = (value: unknown, fallback = '') =>
  (typeof value === 'string' ? value : fallback).trim();

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
