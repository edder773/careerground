export const GOOGLE_CLIENT_ID =
  '790295034558-q9a41jpu912age0eo0dpdu5pcdh1ipo5.apps.googleusercontent.com';

export const SESSION_COOKIE_NAME = 'careerground_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type GoogleIdentity = {
  subject: string;
  email: string;
  displayName: string;
};

type GoogleTokenHeader = {
  alg?: unknown;
  kid?: unknown;
};

type GoogleTokenPayload = {
  aud?: unknown;
  email?: unknown;
  email_verified?: unknown;
  exp?: unknown;
  iat?: unknown;
  iss?: unknown;
  name?: unknown;
  nbf?: unknown;
  sub?: unknown;
};

type GoogleJsonWebKey = JsonWebKey & { kid?: string; kty?: string };
type JsonWebKeySet = { keys?: GoogleJsonWebKey[] };

export const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const CLOCK_SKEW_SECONDS = 60;
let cachedKeys: { expiresAt: number; keys: GoogleJsonWebKey[] } | null = null;

const decodeBase64Url = (value: string) => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const decodeJsonPart = <T>(value: string): T => {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
  } catch {
    throw new Error('GOOGLE_TOKEN_MALFORMED');
  }
};

const cacheMaxAge = (response: Response) => {
  const match = response.headers.get('cache-control')?.match(/max-age=(\d+)/i);
  return Math.max(60, Math.min(Number(match?.[1] || 3600), 24 * 60 * 60));
};

async function googleKeys(fetcher: typeof fetch) {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;
  const response = await fetcher(GOOGLE_JWKS_URL, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('GOOGLE_JWKS_UNAVAILABLE');
  const body = (await response.json()) as JsonWebKeySet;
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error('GOOGLE_JWKS_INVALID');
  }
  cachedKeys = {
    keys: body.keys,
    expiresAt: now + cacheMaxAge(response) * 1000,
  };
  return body.keys;
}

export async function verifyGoogleCredential(
  credential: string,
  expectedClientId = GOOGLE_CLIENT_ID,
  fetcher: typeof fetch = fetch,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<GoogleIdentity> {
  if (!credential || credential.length > 16_384) throw new Error('GOOGLE_TOKEN_MALFORMED');
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('GOOGLE_TOKEN_MALFORMED');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart<GoogleTokenHeader>(encodedHeader);
  const payload = decodeJsonPart<GoogleTokenPayload>(encodedPayload);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('GOOGLE_TOKEN_ALGORITHM_INVALID');
  }
  let keys = await googleKeys(fetcher);
  let jwk = keys.find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA');
  if (!jwk) {
    cachedKeys = null;
    keys = await googleKeys(fetcher);
    jwk = keys.find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA');
  }
  if (!jwk) throw new Error('GOOGLE_TOKEN_KEY_UNKNOWN');
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!verified) throw new Error('GOOGLE_TOKEN_SIGNATURE_INVALID');

  const audiences = new Set(
    (Array.isArray(payload.aud) ? payload.aud : [payload.aud]).filter(
      (audience): audience is string => typeof audience === 'string',
    ),
  );
  if (!audiences.has(expectedClientId)) throw new Error('GOOGLE_TOKEN_AUDIENCE_INVALID');
  if (typeof payload.iss !== 'string' || !GOOGLE_ISSUERS.has(payload.iss)) {
    throw new Error('GOOGLE_TOKEN_ISSUER_INVALID');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds - CLOCK_SKEW_SECONDS) {
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSeconds + CLOCK_SKEW_SECONDS) {
    throw new Error('GOOGLE_TOKEN_ISSUED_AT_INVALID');
  }
  if (typeof payload.nbf === 'number' && payload.nbf > nowSeconds + CLOCK_SKEW_SECONDS) {
    throw new Error('GOOGLE_TOKEN_NOT_ACTIVE');
  }
  if (payload.email_verified !== true) throw new Error('GOOGLE_EMAIL_UNVERIFIED');
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255) {
    throw new Error('GOOGLE_SUBJECT_INVALID');
  }
  if (
    typeof payload.email !== 'string' ||
    payload.email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
  ) {
    throw new Error('GOOGLE_EMAIL_INVALID');
  }
  const email = payload.email.toLowerCase();
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  return {
    subject: payload.sub,
    email,
    displayName: (name || email.split('@')[0] || email).slice(0, 80),
  };
}

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

export function newSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function sessionTokenFrom(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  return null;
}

export function sessionCookie(token: string, secure = true) {
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearSessionCookie(secure = true) {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Lax',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');
}

export function resetGoogleKeyCacheForTests() {
  cachedKeys = null;
}
