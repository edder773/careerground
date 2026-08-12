type Fetcher = { fetch(request: Request): Promise<Response> };

type SitesEnv = {
  ASSETS: Fetcher;
  API_ORIGIN?: string;
  SITES_AUTH_SHARED_SECRET?: string;
  OPENAI_ADMIN_EMAILS?: string;
};

type SitesExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

function currentOpenAiUser(request: Request, env: SitesEnv) {
  const userId = request.headers.get('oai-authenticated-user-id')?.trim();
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  if (!userId || !email) return null;
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const encoding = request.headers.get('oai-authenticated-user-full-name-encoding');
  let displayName = email.split('@')[0] || email;
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try {
      displayName = decodeURIComponent(encodedName).trim() || displayName;
    } catch {
      // A malformed optional name must not invalidate an otherwise valid identity.
    }
  }
  const adminEmails = new Set(
    (env.OPENAI_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  return {
    id: userId.slice(0, 255),
    email: email.slice(0, 320),
    displayName: displayName.slice(0, 80),
    role: adminEmails.has(email) ? 'ADMIN' : 'MEMBER',
  };
}

async function proxyApi(request: Request, env: SitesEnv) {
  const url = new URL(request.url);
  if (!env.API_ORIGIN) {
    if (url.pathname === '/api/v1/auth/me' && request.method === 'GET') {
      const user = currentOpenAiUser(request, env);
      return user ? json({ user }) : json({ message: 'OpenAI 로그인이 필요합니다.' }, 401);
    }
    if (url.pathname === '/api/v1/health' || url.pathname === '/api/v1/health/ready') {
      return json({ status: 'frontend-ready', api: 'not-configured' }, 503);
    }
    return json(
      {
        code: 'API_NOT_CONFIGURED',
        message: 'OpenAI 로그인은 완료되었지만 운영 데이터 API가 아직 연결되지 않았습니다.',
      },
      503,
    );
  }
  const upstream = new URL(`${url.pathname}${url.search}`, env.API_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete('x-careerground-sites-secret');
  if (env.SITES_AUTH_SHARED_SECRET) {
    headers.set('x-careerground-sites-secret', env.SITES_AUTH_SHARED_SECRET);
  }
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
  const response = await fetch(
    new Request(upstream, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    }),
  );
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('access-control-allow-origin');
  responseHeaders.delete('access-control-allow-credentials');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

const worker = {
  async fetch(request: Request, env: SitesEnv, _context: SitesExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1/')) return proxyApi(request, env);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') return asset;
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return asset;
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};

export default worker;
