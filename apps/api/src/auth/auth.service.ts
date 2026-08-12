import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import type { AuthUser } from './auth.decorators.js';
import type { Role } from '../generated/prisma/enums.js';
import type { SlackIdentity } from './slack-oidc.service.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async completeSlackLogin(identity: SlackIdentity) {
    const linked = await this.prisma.user.findUnique({
      where: {
        slackTeamId_slackUserId: {
          slackTeamId: identity.teamId,
          slackUserId: identity.userId,
        },
      },
    });
    const sameEmail = linked
      ? null
      : await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (
      sameEmail?.slackTeamId &&
      (sameEmail.slackTeamId !== identity.teamId || sameEmail.slackUserId !== identity.userId)
    ) {
      throw new UnauthorizedException('이 이메일은 다른 Slack 계정에 연결되어 있습니다.');
    }
    let user = linked || sameEmail;
    if (!user) {
      const activeCount = await this.prisma.user.count({
        where: { isActive: true, deletedAt: null },
      });
      if (activeCount >= Number(process.env.MAX_ACTIVE_USERS || 10)) {
        throw new ForbiddenException('활성 사용자 상한에 도달했습니다.');
      }
    }
    if (user && (!user.isActive || user.deletedAt)) {
      throw new ForbiddenException('비활성화된 계정입니다.');
    }
    const adminIds = new Set(
      (process.env.SLACK_ADMIN_USER_IDS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const requestedRole: Role = adminIds.has(identity.userId) ? 'ADMIN' : 'MEMBER';
    const isNew = !user;
    user = user
      ? await this.prisma.user.update({
          where: { id: user.id },
          data: {
            slackTeamId: identity.teamId,
            slackUserId: identity.userId,
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl || user.avatarUrl,
            role: requestedRole === 'ADMIN' ? 'ADMIN' : user.role,
          },
        })
      : await this.prisma.user.create({
          data: {
            slackTeamId: identity.teamId,
            slackUserId: identity.userId,
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
            role: requestedRole,
            preference: { create: {} },
          },
        });
    await this.audit.record({
      actorId: user.id,
      action: isNew ? 'SLACK_ACCOUNT_CREATED' : 'SLACK_LOGIN',
      targetType: 'User',
      targetId: user.id,
      metadata: { slackTeamId: identity.teamId, slackUserId: identity.userId },
    });
    return this.issueSession(user);
  }

  async issueSession(user: { id: string; email: string; displayName: string; role: Role }) {
    const claims: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync({ ...claims, sub: user.id });
    const familyId = randomUUID();
    const refreshId = randomBytes(32).toString('base64url');
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, familyId, refreshId },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
        expiresIn: `${Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14)}d`,
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: digest(refreshToken),
        familyId,
        expiresAt: new Date(
          Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14) * 86_400_000,
        ),
      },
    });
    return { user: claims, accessToken, refreshToken };
  }

  async refresh(token: string) {
    let claims: { sub: string; familyId: string };
    try {
      claims = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
      });
    } catch {
      throw new UnauthorizedException('refresh token이 만료되었습니다.');
    }
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: digest(token) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: claims.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('재사용된 refresh token입니다. 모든 세션을 종료했습니다.');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: claims.sub } });
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(user);
  }

  logout(token?: string) {
    if (!token) return Promise.resolve({ ok: true });
    return this.prisma.refreshToken
      .updateMany({
        where: { tokenHash: digest(token), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .then(() => ({ ok: true }));
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
