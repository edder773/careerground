import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { IS_PUBLIC, ROLES, type AuthUser } from './auth.decorators.js';
import type { Role } from '../generated/prisma/enums.js';
import { AuthService } from './auth.service.js';
import { parseOpenAiIdentity } from './openai-identity.js';

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const configuredSecret = process.env.SITES_AUTH_SHARED_SECRET;
    const providedSecret = request.headers['x-careerground-sites-secret'];
    const trustedProxy =
      configuredSecret &&
      typeof providedSecret === 'string' &&
      safeEqual(configuredSecret, providedSecret);
    const trustedTestBoundary =
      process.env.NODE_ENV !== 'production' && process.env.OPENAI_AUTH_MOCK === 'true';
    if (!trustedProxy && !trustedTestBoundary) {
      throw new UnauthorizedException('신뢰할 수 있는 OpenAI 인증 프록시가 필요합니다.');
    }
    const identity = parseOpenAiIdentity(request.headers);
    request.user = await this.auth.resolveOpenAiUser(identity);
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(request.user.role)) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }
    return true;
  }
}
