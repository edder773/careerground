import { UnauthorizedException } from '@nestjs/common';

export type OpenAiIdentity = {
  userId: string;
  email: string;
  displayName: string;
};

type HeaderValue = string | string[] | undefined;
type IdentityHeaders = Record<string, HeaderValue>;

const singleHeader = (value: HeaderValue) => (typeof value === 'string' ? value.trim() : '');

export function parseOpenAiIdentity(headers: IdentityHeaders): OpenAiIdentity {
  const userId = singleHeader(headers['oai-authenticated-user-id']);
  const email = singleHeader(headers['oai-authenticated-user-email']).toLowerCase();
  if (!userId || userId.length > 255) {
    throw new UnauthorizedException('OpenAI 사용자 ID를 확인할 수 없습니다.');
  }
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UnauthorizedException('OpenAI 사용자 이메일을 확인할 수 없습니다.');
  }

  const encodedName = singleHeader(headers['oai-authenticated-user-full-name']);
  const encoding = singleHeader(headers['oai-authenticated-user-full-name-encoding']);
  let decodedName = '';
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try {
      decodedName = decodeURIComponent(encodedName).trim();
    } catch {
      decodedName = '';
    }
  }

  return {
    userId,
    email,
    displayName: (decodedName || email.split('@')[0] || email).slice(0, 80),
  };
}
