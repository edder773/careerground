import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseOpenAiIdentity } from './openai-identity.js';

describe('parseOpenAiIdentity', () => {
  it('decodes the optional percent-encoded OpenAI full name', () => {
    expect(
      parseOpenAiIdentity({
        'oai-authenticated-user-id': 'site-user-1',
        'oai-authenticated-user-email': 'USER@example.com',
        'oai-authenticated-user-full-name': '%EA%B9%80%20%EA%B7%B8%EB%9D%BC%EC%9A%B4%EB%93%9C',
        'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
      }),
    ).toEqual({
      userId: 'site-user-1',
      email: 'user@example.com',
      displayName: '김 그라운드',
    });
  });

  it('falls back safely when the optional name is malformed', () => {
    expect(
      parseOpenAiIdentity({
        'oai-authenticated-user-id': 'site-user-1',
        'oai-authenticated-user-email': 'member@example.com',
        'oai-authenticated-user-full-name': '%E0%A4%A',
        'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
      }).displayName,
    ).toBe('member');
  });

  it('rejects a request missing the stable user ID', () => {
    expect(() =>
      parseOpenAiIdentity({ 'oai-authenticated-user-email': 'member@example.com' }),
    ).toThrow(UnauthorizedException);
  });
});
