/* global Request */
import { handleD1Api } from '../../deployment/sites/d1-api.ts';
import { ensureRuntimeSchema } from '../../deployment/sites/runtime-schema.ts';

export async function createGoogleTestSession(env, identity) {
  await ensureRuntimeSchema(env.DB);
  const response = await handleD1Api(
    new Request('https://performance.invalid/api/v1/auth/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(identity),
    }),
    { ...env, AUTH_TEST_MODE: 'true' },
  );
  if (!response.ok) throw new Error(`benchmark Google session setup failed: ${response.status}`);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('benchmark Google session cookie is missing');
  await response.arrayBuffer();
  return cookie;
}
