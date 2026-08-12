import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import type { AuthUser } from './auth.decorators.js';
import type { Role } from '../generated/prisma/enums.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.isActive || !(await verify(user.passwordHash, password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
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

  async createInvite(actorId: string, email: string, role: Role) {
    const activeCount = await this.prisma.user.count({
      where: { isActive: true, deletedAt: null },
    });
    if (activeCount >= Number(process.env.MAX_ACTIVE_USERS || 10)) {
      throw new ForbiddenException('활성 사용자 상한에 도달했습니다.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) throw new BadRequestException('이미 등록된 이메일입니다.');
    const token = randomBytes(32).toString('base64url');
    const invite = await this.prisma.invite.create({
      data: {
        email: email.toLowerCase().trim(),
        role,
        tokenHash: digest(token),
        createdById: actorId,
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
    await this.audit.record({
      actorId,
      action: 'INVITE_CREATED',
      targetType: 'Invite',
      targetId: invite.id,
    });
    return { inviteId: invite.id, token, expiresAt: invite.expiresAt };
  }

  async activate(token: string, displayName: string, password: string) {
    if (password.length < 12) throw new BadRequestException('비밀번호는 12자 이상이어야 합니다.');
    const invite = await this.prisma.invite.findUnique({ where: { tokenHash: digest(token) } });
    if (!invite || invite.acceptedAt || invite.revokedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('초대가 유효하지 않습니다.');
    }
    const passwordHash = await hash(password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          displayName: displayName.trim(),
          passwordHash,
          role: invite.role,
          preference: { create: {} },
        },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return created;
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

  async resetUserPassword(actorId: string, userId: string, password: string) {
    if (password.length < 12)
      throw new BadRequestException('임시 비밀번호는 12자 이상이어야 합니다.');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(password) },
      select: { id: true, email: true, displayName: true },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      actorId,
      action: 'USER_PASSWORD_RESET',
      targetType: 'User',
      targetId: userId,
      metadata: { sessionsRevoked: true },
    });
    return user;
  }
}
