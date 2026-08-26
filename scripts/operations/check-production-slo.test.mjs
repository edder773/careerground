import { describe, expect, it, vi } from 'vitest';
import { formatSloSummary, runProductionSlo } from './check-production-slo.mjs';

const apiHeaders = {
  'content-security-policy': "default-src 'self'; frame-ancestors 'none'; object-src 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
  'x-request-id': 'request-test-1',
  'server-timing': 'app;dur=12.3',
};

const staticHtml = `<!doctype html><html><head>
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; script-src 'self' https://accounts.google.com/gsi/client" />
</head><body><div id="root"></div></body></html>`;

const healthyReady = {
  status: 'ok',
  database: 'd1',
  schema: {
    ready: true,
    expectedVersion: '0035_sync_validator_jobs_20260825',
    appliedVersion: '0035_sync_validator_jobs_20260825',
  },
  canary: { jobs: 147, problems: 427, learning: 102, searchRows: 679 },
};

const jsonResponse = (body, init = {}) =>
  new globalThis.Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });

const requestFixture = ({ ready = healthyReady, html = staticHtml, readinessMs = [120] } = {}) => {
  let readinessIndex = 0;
  return vi.fn(async (url) => {
    const path = new globalThis.URL(url).pathname;
    if (path === '/api/v1/health/live') {
      return {
        response: jsonResponse({ status: 'ok', database: 'd1' }, { headers: apiHeaders }),
        durationMs: 80,
      };
    }
    if (path === '/api/v1/health/ready') {
      const durationMs = readinessMs[Math.min(readinessIndex, readinessMs.length - 1)];
      readinessIndex += 1;
      return { response: jsonResponse(ready, { headers: apiHeaders }), durationMs };
    }
    if (path === '/api/v1/auth/me') {
      return { response: jsonResponse({ code: 'UNAUTHORIZED' }, { status: 401 }), durationMs: 90 };
    }
    if (path === '/favicon.svg') {
      return { response: new globalThis.Response('<svg/>', { status: 200 }), durationMs: 20 };
    }
    if (path === '/') {
      return { response: new globalThis.Response(html, { status: 200 }), durationMs: 50 };
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
};

describe('production SLO checker', () => {
  it('accepts Sites static meta policies while requiring API response headers', async () => {
    const request = requestFixture({ readinessMs: [110, 140, 125] });

    const report = await runProductionSlo({ request, readinessSamples: 3 });

    expect(report.passed).toBe(true);
    expect(report.latency.readinessColdStartMs).toBe(110);
    expect(report.latency.readinessWarmP95Ms).toBe(140);
    expect(report.schema?.appliedVersion).toBe('0035_sync_validator_jobs_20260825');
    expect(request).toHaveBeenCalledTimes(7);
    expect(formatSloSummary(report)).toContain('Result: **PASS**');
  });

  it('fails with an actionable result when a static CSP fallback is missing', async () => {
    const report = await runProductionSlo({
      request: requestFixture({ html: '<div id="root"></div>' }),
      readinessSamples: 1,
    });

    expect(report.passed).toBe(false);
    expect(report.failures).toContain(
      'static-security.content-security-policy: missing CSP meta policy',
    );
    expect(report.failures).toContain(
      'static-security.referrer-policy: missing referrer meta policy',
    );
  });

  it('requires the Google script origin as an exact CSP source token', async () => {
    const html = staticHtml.replace(
      'https://accounts.google.com/gsi/client',
      'https://malicious.example/https://accounts.google.com/gsi/client',
    );
    const report = await runProductionSlo({
      request: requestFixture({ html }),
      readinessSamples: 2,
    });

    expect(report.passed).toBe(false);
    expect(
      report.failures.some((failure) =>
        failure.startsWith('static-security.content-security-policy:'),
      ),
    ).toBe(true);
  });

  it('rejects empty catalog canaries and readiness latency over budget', async () => {
    const report = await runProductionSlo({
      request: requestFixture({
        ready: { ...healthyReady, canary: { ...healthyReady.canary, jobs: 0 } },
        readinessMs: [2_750, 2_800, 2_900],
      }),
      readinessSamples: 3,
      coldStartBudgetMs: 2_500,
      warmLatencyBudgetMs: 2_500,
    });

    expect(report.passed).toBe(false);
    expect(report.latency.readinessColdStartMs).toBe(2_750);
    expect(report.latency.readinessWarmP95Ms).toBe(2_900);
    expect(report.failures.some((failure) => failure.startsWith('readiness.cold-start:'))).toBe(
      true,
    );
    expect(report.failures.some((failure) => failure.startsWith('readiness.warm-p95:'))).toBe(true);
    expect(
      report.failures.some((failure) => failure.startsWith('readiness.sample-1.contract:')),
    ).toBe(true);
  });

  it('continues collecting evidence after a request-level failure', async () => {
    const fixture = requestFixture();
    const request = vi.fn(async (url, init) => {
      if (new globalThis.URL(url).pathname === '/favicon.svg') throw new Error('network timeout');
      return fixture(url, init);
    });

    const report = await runProductionSlo({ request, readinessSamples: 1 });

    expect(report.passed).toBe(false);
    expect(report.failures).toContain('static-favicon.request: network timeout');
    expect(report.checks.some((check) => check.id === 'auth-boundary.contract')).toBe(true);
  });
});
