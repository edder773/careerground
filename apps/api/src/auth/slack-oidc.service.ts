import { createHash, timingSafeEqual } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type SlackIdentity = {
  teamId: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
};

type SlackTokenResponse = {
  ok?: boolean;
  error?: string;
  access_token?: string;
  id_token?: string;
};

type SlackUserInfo = {
  ok?: boolean;
  error?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  'https://slack.com/team_id'?: string;
  'https://slack.com/user_id'?: string;
};

const mockUsers: Record<string, Omit<SlackIdentity, 'email'>> = {
  'admin@careerground.local': {
    teamId: 'T_DEMO',
    userId: 'U_ADMIN',
    displayName: '데모 관리자',
  },
  'member@careerground.local': {
    teamId: 'T_DEMO',
    userId: 'U_MEMBER',
    displayName: '김그라운드',
  },
  'peer@careerground.local': {
    teamId: 'T_DEMO',
    userId: 'U_PEER',
    displayName: '이플레이어',
  },
  'visual@careerground.local': {
    teamId: 'T_DEMO',
    userId: 'U_VISUAL',
    displayName: '박비주얼',
  },
};

const sameValue = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

@Injectable()
export class SlackOidcService {
  private readonly jwks = createRemoteJWKSet(new URL('https://slack.com/openid/connect/keys'));

  isMockEnabled() {
    return process.env.SLACK_OIDC_MOCK === 'true' && process.env.NODE_ENV !== 'production';
  }

  isConfigured() {
    return (
      this.isMockEnabled() ||
      Boolean(
        process.env.SLACK_CLIENT_ID &&
        process.env.SLACK_CLIENT_SECRET &&
        process.env.SLACK_REDIRECT_URI,
      )
    );
  }

  getRedirectUri() {
    return process.env.SLACK_REDIRECT_URI || 'http://localhost:4000/api/v1/auth/slack/callback';
  }

  buildAuthorizationUrl(input: { state: string; nonce: string; loginHint?: string }) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Slack 로그인이 아직 설정되지 않았습니다.');
    }
    if (this.isMockEnabled()) {
      const url = new URL('/api/v1/auth/slack/mock-authorize', this.getRedirectUri());
      url.searchParams.set('state', input.state);
      url.searchParams.set('nonce', input.nonce);
      if (input.loginHint) url.searchParams.set('login_hint', input.loginHint);
      return url.toString();
    }
    const url = new URL('https://slack.com/openid/connect/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('client_id', process.env.SLACK_CLIENT_ID!);
    url.searchParams.set('state', input.state);
    url.searchParams.set('nonce', input.nonce);
    url.searchParams.set('redirect_uri', this.getRedirectUri());
    if (process.env.SLACK_ALLOWED_TEAM_ID) {
      url.searchParams.set('team', process.env.SLACK_ALLOWED_TEAM_ID);
    }
    return url.toString();
  }

  createMockCode(email: string, nonce: string) {
    if (!this.isMockEnabled()) throw new ForbiddenException('Slack mock은 비활성화되어 있습니다.');
    return `mock.${Buffer.from(JSON.stringify({ email, nonce })).toString('base64url')}`;
  }

  async exchangeCode(code: string, expectedNonce: string): Promise<SlackIdentity> {
    const identity = this.isMockEnabled()
      ? this.exchangeMockCode(code, expectedNonce)
      : await this.exchangeSlackCode(code, expectedNonce);
    const allowedTeam = process.env.SLACK_ALLOWED_TEAM_ID;
    if (allowedTeam && identity.teamId !== allowedTeam) {
      throw new ForbiddenException('허용된 Slack 워크스페이스 계정이 아닙니다.');
    }
    return identity;
  }

  private exchangeMockCode(code: string, expectedNonce: string): SlackIdentity {
    if (!code.startsWith('mock.'))
      throw new UnauthorizedException('Slack mock code가 유효하지 않습니다.');
    let value: { email?: string; nonce?: string };
    try {
      value = JSON.parse(Buffer.from(code.slice(5), 'base64url').toString('utf8')) as {
        email?: string;
        nonce?: string;
      };
    } catch {
      throw new UnauthorizedException('Slack mock code를 해석하지 못했습니다.');
    }
    if (!value.email || !value.nonce || !sameValue(value.nonce, expectedNonce)) {
      throw new UnauthorizedException('Slack nonce가 일치하지 않습니다.');
    }
    const normalizedEmail = value.email.toLowerCase();
    const known = mockUsers[normalizedEmail];
    if (known) return { ...known, email: normalizedEmail };
    return {
      teamId: 'T_DEMO',
      userId: `U_${createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 16)}`,
      email: normalizedEmail,
      displayName: normalizedEmail.split('@')[0] || 'Slack 멤버',
    };
  }

  private async exchangeSlackCode(code: string, expectedNonce: string): Promise<SlackIdentity> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Slack 로그인이 아직 설정되지 않았습니다.');
    }
    const clientId = process.env.SLACK_CLIENT_ID!;
    const clientSecret = process.env.SLACK_CLIENT_SECRET!;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.getRedirectUri(),
    });
    const tokenResponse = await fetch('https://slack.com/api/openid.connect.token', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const token = (await tokenResponse.json()) as SlackTokenResponse;
    if (!tokenResponse.ok || token.ok === false || !token.access_token || !token.id_token) {
      throw new UnauthorizedException(
        `Slack token 교환에 실패했습니다: ${token.error || 'invalid_response'}`,
      );
    }
    const { payload } = await jwtVerify(token.id_token, this.jwks, {
      issuer: 'https://slack.com',
      audience: clientId,
    });
    if (typeof payload.nonce !== 'string' || !sameValue(payload.nonce, expectedNonce)) {
      throw new UnauthorizedException('Slack nonce가 일치하지 않습니다.');
    }
    const userInfoResponse = await fetch('https://slack.com/api/openid.connect.userInfo', {
      method: 'POST',
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const userInfo = (await userInfoResponse.json()) as SlackUserInfo;
    const teamId = userInfo['https://slack.com/team_id'];
    const userId = userInfo['https://slack.com/user_id'] || userInfo.sub;
    if (
      !userInfoResponse.ok ||
      userInfo.ok === false ||
      !teamId ||
      !userId ||
      !userInfo.email ||
      userInfo.email_verified !== true ||
      userInfo.sub !== payload.sub
    ) {
      throw new UnauthorizedException(
        `Slack 사용자 확인에 실패했습니다: ${userInfo.error || 'invalid_identity'}`,
      );
    }
    return {
      teamId,
      userId,
      email: userInfo.email.toLowerCase(),
      displayName: userInfo.name?.trim() || userInfo.email.split('@')[0] || 'Slack 멤버',
      avatarUrl: userInfo.picture,
    };
  }
}
