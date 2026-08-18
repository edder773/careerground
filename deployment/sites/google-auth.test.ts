import { beforeEach, describe, expect, it } from 'vitest';
import {
  GOOGLE_CLIENT_ID,
  hashSessionToken,
  newSessionToken,
  resetGoogleKeyCacheForTests,
  sessionTokenFrom,
  verifyGoogleCredential,
} from './google-auth.js';

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

async function keyFixture() {
  const pair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  publicJwk.kid = 'test-key';
  return { pair, publicJwk };
}

async function credential(
  privateKey: CryptoKey,
  overrides: Record<string, unknown> = {},
  now = 1_800_000_000,
) {
  const header = encode({ alg: 'RS256', kid: 'test-key', typ: 'JWT' });
  const payload = encode({
    aud: GOOGLE_CLIENT_ID,
    email: 'Member@Example.test',
    email_verified: true,
    exp: now + 3600,
    iat: now - 30,
    iss: 'https://accounts.google.com',
    name: 'Google Member',
    sub: 'google-subject-1',
    ...overrides,
  });
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${Buffer.from(signature).toString('base64url')}`;
}

describe('Google authentication primitives', () => {
  beforeEach(() => resetGoogleKeyCacheForTests());

  it('verifies the Google signature and required OpenID claims', async () => {
    const { pair, publicJwk } = await keyFixture();
    const fetcher = async () =>
      new Response(JSON.stringify({ keys: [publicJwk] }), {
        headers: { 'cache-control': 'public, max-age=3600' },
      });
    await expect(
      verifyGoogleCredential(
        await credential(pair.privateKey),
        GOOGLE_CLIENT_ID,
        fetcher as typeof fetch,
        1_800_000_000,
      ),
    ).resolves.toEqual({
      subject: 'google-subject-1',
      email: 'member@example.test',
      displayName: 'Google Member',
    });
  });

  it('rejects a token issued for another client', async () => {
    const { pair, publicJwk } = await keyFixture();
    const fetcher = async () => new Response(JSON.stringify({ keys: [publicJwk] }));
    await expect(
      verifyGoogleCredential(
        await credential(pair.privateKey, { aud: 'another-client' }),
        GOOGLE_CLIENT_ID,
        fetcher as typeof fetch,
        1_800_000_000,
      ),
    ).rejects.toThrow('GOOGLE_TOKEN_AUDIENCE_INVALID');
  });

  it('rejects expired or unverified Google identities', async () => {
    const { pair, publicJwk } = await keyFixture();
    const fetcher = async () => new Response(JSON.stringify({ keys: [publicJwk] }));
    await expect(
      verifyGoogleCredential(
        await credential(pair.privateKey, { exp: 1_799_999_000 }),
        GOOGLE_CLIENT_ID,
        fetcher as typeof fetch,
        1_800_000_000,
      ),
    ).rejects.toThrow('GOOGLE_TOKEN_EXPIRED');
    resetGoogleKeyCacheForTests();
    await expect(
      verifyGoogleCredential(
        await credential(pair.privateKey, { email_verified: false }),
        GOOGLE_CLIENT_ID,
        fetcher as typeof fetch,
        1_800_000_000,
      ),
    ).rejects.toThrow('GOOGLE_EMAIL_UNVERIFIED');
  });

  it('issues opaque session tokens and only stores a deterministic hash', async () => {
    const token = newSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(
      sessionTokenFrom(
        new Request('https://careerground.example', {
          headers: { cookie: `other=x; careerground_session=${token}` },
        }),
      ),
    ).toBe(token);
  });
});
