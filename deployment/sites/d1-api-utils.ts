import { normalizedText } from './domain.js';
import { RouteError } from './d1-api-contract.js';

export const responseJson = (
  body: unknown,
  status = 200,
  requestId?: string,
  extraHeaders: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(requestId ? { 'x-request-id': requestId } : {}),
      ...extraHeaders,
    },
  });

export const cleanText = normalizedText;

export const bool = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

export const int = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

export type CursorPage<T> = { items: T[]; nextCursor: string | null; total: number };

export const cursorPageRequested = (search: URLSearchParams) => search.get('page') === 'cursor';

export const cursorLimit = (search: URLSearchParams, fallback: number, maximum: number) =>
  Math.min(maximum, Math.max(1, int(search.get('limit'), fallback)));

export const ftsMatchQuery = (query: string) =>
  query
    .replace(/["*:^{}()[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((token) => `"${token}"*`)
    .join(' AND ');

export const encodeCursor = (value: Record<string, unknown>) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

export const decodeCursor = <T extends Record<string, unknown>>(value: string | null): T | null => {
  if (!value) return null;
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
  }
};

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new RouteError(400, '올바른 JSON 요청 본문이 필요합니다.', 'INVALID_JSON');
  }
}

export async function readJsonWithLimit(request: Request, maxBytes: number) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RouteError(413, '요청 본문이 너무 큽니다.', 'PAYLOAD_TOO_LARGE');
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new RouteError(400, '올바른 JSON 요청 본문이 필요합니다.', 'INVALID_JSON');
  }
}
