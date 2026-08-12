import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import type { AuthUser } from './auth.decorators.js';
import type { Role } from '../generated/prisma/enums.js';
import type { OpenAiIdentity } from './openai-identity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async resolveOpenAiUser(identity: OpenAiIdentity): Promise<AuthUser> {
    const linked = await this.prisma.user.findUnique({
      where: { openAiUserId: identity.userId },
    });
    const sameEmail = linked
      ? null
      : await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (sameEmail?.openAiUserId && sameEmail.openAiUserId !== identity.userId) {
      throw new UnauthorizedException('이 이메일은 다른 OpenAI 계정에 연결되어 있습니다.');
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
    const adminEmails = new Set(
      (process.env.OPENAI_ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );
    const requestedRole: Role = adminEmails.has(identity.email) ? 'ADMIN' : 'MEMBER';
    const isNew = !user;
    const isLinkingExistingUser = !linked && Boolean(sameEmail);
    user = user
      ? await this.prisma.user.update({
          where: { id: user.id },
          data: {
            openAiUserId: identity.userId,
            email: identity.email,
            role: requestedRole === 'ADMIN' ? 'ADMIN' : user.role,
          },
        })
      : await this.prisma.user.create({
          data: {
            openAiUserId: identity.userId,
            email: identity.email,
            displayName: identity.displayName,
            role: requestedRole,
            preference: { create: {} },
          },
        });
    if (isNew || isLinkingExistingUser) {
      await this.audit.record({
        actorId: user.id,
        action: isNew ? 'OPENAI_ACCOUNT_CREATED' : 'OPENAI_IDENTITY_LINKED',
        targetType: 'User',
        targetId: user.id,
        metadata: { provider: 'openai-sites' },
      });
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      onboardingCompleted: Boolean(user.onboardingCompletedAt),
    };
  }
}
