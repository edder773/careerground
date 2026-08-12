type Fetcher = { fetch(request: Request): Promise<Response> };

type SitesEnv = {
  ASSETS: Fetcher;
  API_ORIGIN?: string;
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

async function proxyApi(request: Request, env: SitesEnv) {
  const url = new URL(request.url);
  if (!env.API_ORIGIN) {
    if (url.pathname === '/api/v1/auth/slack/config') {
      return json({ provider: 'slack', configured: false });
    }
    if (url.pathname === '/api/v1/health' || url.pathname === '/api/v1/health/ready') {
      return json({ status: 'frontend-ready', api: 'not-configured' }, 503);
    }
    return json(
      {
        code: 'API_NOT_CONFIGURED',
        message: '운영 API 연결 전입니다. Slack App과 API origin을 설정해 주세요.',
      },
      503,
    );
  }
  const upstream = new URL(`${url.pathname}${url.search}`, env.API_ORIGIN);
  const headers = new Headers(request.headers);
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
