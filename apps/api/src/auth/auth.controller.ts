import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public, Roles, type AuthUser } from './auth.decorators.js';
import { PrismaService } from '../common/prisma.service.js';
import { SlackOidcService } from './slack-oidc.service.js';

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  githubUsername: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]{1,39}$/)
    .nullable()
    .optional(),
  preferredLanguage: z.string().trim().min(1).max(40),
  rankingOptIn: z.boolean(),
  commentNotifications: z.boolean(),
  deadlineNotifications: z.boolean(),
  reviewNotifications: z.boolean(),
});
const slackStartSchema = z.object({ login_hint: z.string().email().max(320).optional() });
const slackCallbackSchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(20).optional(),
  error: z.string().max(120).optional(),
});
const slackMockSchema = z.object({
  state: z.string().min(20),
  nonce: z.string().min(20),
  login_hint: z.string().email().max(320).optional(),
});
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly slack: SlackOidcService,
  ) {}

  private setCookies(response: Response, session: { accessToken: string; refreshToken: string }) {
    const secure = process.env.COOKIE_SECURE === 'true';
    response.cookie('cg_access', session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60_000,
    });
    response.cookie('cg_refresh', session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14) * 86_400_000,
    });
  }

  private clearSlackState(response: Response) {
    response.clearCookie('cg_slack_state', { path: '/api/v1/auth/slack' });
  }

  private webOrigin() {
    return process.env.WEB_ORIGIN || 'http://127.0.0.1:5173';
  }

  @Public()
  @Get('slack/config')
  slackConfig() {
    return { provider: 'slack', configured: this.slack.isConfigured() };
  }

  @Public()
  @Get('slack/start')
  async startSlack(@Query() query: unknown, @Res() response: Response) {
    const parsed = slackStartSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    await this.prisma.slackOAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.slackOAuthState.create({
      data: {
        stateHash: digest(state),
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    response.cookie('cg_slack_state', state, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/api/v1/auth/slack',
      maxAge: 10 * 60_000,
    });
    return response.redirect(
      this.slack.buildAuthorizationUrl({
        state,
        nonce,
        loginHint: this.slack.isMockEnabled() ? parsed.data.login_hint : undefined,
      }),
    );
  }

  @Public()
  @Get('slack/mock-authorize')
  mockSlackAuthorize(@Query() query: unknown, @Res() response: Response) {
    if (!this.slack.isMockEnabled())
      throw new ForbiddenException('Slack mock은 비활성화되어 있습니다.');
    const parsed = slackMockSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const callback = new URL(this.slack.getRedirectUri());
    callback.searchParams.set(
      'code',
      this.slack.createMockCode(
        parsed.data.login_hint || 'member@careerground.local',
        parsed.data.nonce,
      ),
    );
    callback.searchParams.set('state', parsed.data.state);
    return response.redirect(callback.toString());
  }

  @Public()
  @Get('slack/callback')
  async slackCallback(@Query() query: unknown, @Req() request: Request, @Res() response: Response) {
    const parsed = slackCallbackSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    try {
      if (parsed.data.error) throw new UnauthorizedException('Slack 로그인이 취소되었습니다.');
      if (!parsed.data.code || !parsed.data.state) {
        throw new UnauthorizedException('Slack callback 값이 누락되었습니다.');
      }
      const cookieState = request.cookies?.cg_slack_state as string | undefined;
      if (!cookieState || !safeEqual(cookieState, parsed.data.state)) {
        throw new UnauthorizedException('Slack OAuth state가 일치하지 않습니다.');
      }
      const state = await this.prisma.slackOAuthState.findUnique({
        where: { stateHash: digest(parsed.data.state) },
      });
      if (!state || state.usedAt || state.expiresAt < new Date()) {
        throw new UnauthorizedException('Slack OAuth state가 만료되었거나 이미 사용되었습니다.');
      }
      const consumed = await this.prisma.slackOAuthState.updateMany({
        where: { id: state.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new UnauthorizedException('Slack OAuth state 재사용을 차단했습니다.');
      const identity = await this.slack.exchangeCode(parsed.data.code, state.nonce);
      const session = await this.auth.completeSlackLogin(identity);
      this.setCookies(response, session);
      this.clearSlackState(response);
      return response.redirect(this.webOrigin());
    } catch (error) {
      this.clearSlackState(response);
      const url = new URL(this.webOrigin());
      url.searchParams.set(
        'auth_error',
        error instanceof Error ? error.message : 'Slack 로그인에 실패했습니다.',
      );
      return response.redirect(url.toString());
    }
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.cg_refresh as string | undefined;
    if (!token) throw new BadRequestException('refresh token이 없습니다.');
    const session = await this.auth.refresh(token);
    this.setCookies(response, session);
    return { user: session.user };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        slackTeamId: true,
        slackUserId: true,
        displayName: true,
        avatarUrl: true,
        githubUsername: true,
        preferredLanguage: true,
        rankingOptIn: true,
        dataDeletionRequested: true,
        preference: true,
      },
    });
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { commentNotifications, deadlineNotifications, reviewNotifications, ...profile } =
      parsed.data;
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...profile,
        avatarUrl: profile.avatarUrl || null,
        githubUsername: profile.githubUsername || null,
        preference: {
          upsert: {
            create: { commentNotifications, deadlineNotifications, reviewNotifications },
            update: { commentNotifications, deadlineNotifications, reviewNotifications },
          },
        },
      },
      select: {
        id: true,
        email: true,
        slackTeamId: true,
        slackUserId: true,
        displayName: true,
        avatarUrl: true,
        githubUsername: true,
        preferredLanguage: true,
        rankingOptIn: true,
        dataDeletionRequested: true,
        preference: true,
      },
    });
  }

  @Roles('ADMIN')
  @Get('users')
  users() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        slackTeamId: true,
        slackUserId: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.cg_refresh);
    response.clearCookie('cg_access', { path: '/' });
    response.clearCookie('cg_refresh', { path: '/api/v1/auth' });
    return { ok: true };
  }

  @Post('logout-all')
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.auth.logoutAll(user.id);
  }

  @Get('export')
  exportData(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        collections: { include: { items: true } },
        notes: true,
        savedJobs: true,
        solutions: true,
        learningProgress: true,
      },
    });
  }

  @Post('delete-request')
  requestDeletion(@CurrentUser() user: AuthUser, @Headers('x-request-id') _requestId?: string) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: { dataDeletionRequested: new Date() },
      select: { dataDeletionRequested: true, id: true },
    });
  }
}
