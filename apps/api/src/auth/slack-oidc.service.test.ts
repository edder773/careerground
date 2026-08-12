import { UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlackOidcService } from './slack-oidc.service.js';

describe('SlackOidcService', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SLACK_OIDC_MOCK', 'true');
    vi.stubEnv('SLACK_REDIRECT_URI', 'http://127.0.0.1:4000/api/v1/auth/slack/callback');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('builds a Slack-only mock authorization boundary for deterministic tests', () => {
    const service = new SlackOidcService();
    const url = new URL(
      service.buildAuthorizationUrl({ state: 'state-value', nonce: 'nonce-value' }),
    );
    expect(url.pathname).toBe('/api/v1/auth/slack/mock-authorize');
    expect(url.searchParams.get('state')).toBe('state-value');
    expect(url.searchParams.get('nonce')).toBe('nonce-value');
  });

  it('maps a verified mock Slack identity without exposing another login method', async () => {
    const service = new SlackOidcService();
    const code = service.createMockCode('member@careerground.local', 'expected-nonce');
    await expect(service.exchangeCode(code, 'expected-nonce')).resolves.toMatchObject({
      teamId: 'T_DEMO',
      userId: 'U_MEMBER',
      email: 'member@careerground.local',
    });
  });

  it('rejects a Slack code when the nonce does not match', async () => {
    const service = new SlackOidcService();
    const code = service.createMockCode('member@careerground.local', 'different-nonce');
    await expect(service.exchangeCode(code, 'expected-nonce')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('never enables the mock provider in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const service = new SlackOidcService();
    expect(service.isMockEnabled()).toBe(false);
    expect(service.isConfigured()).toBe(false);
  });
});
