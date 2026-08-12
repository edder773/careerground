import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public, Roles, type AuthUser } from './auth.decorators.js';
import { PrismaService } from '../common/prisma.service.js';

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});
const inviteSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
const activateSchema = z.object({
  token: z.string().min(20),
  displayName: z.string().trim().min(2).max(80),
  password: z.string().min(12).max(200),
});
const resetPasswordSchema = z.object({ password: z.string().min(12).max(200) });
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
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

  @Public()
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const session = await this.auth.login(parsed.data.email, parsed.data.password);
    this.setCookies(response, session);
    return { user: session.user };
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

  @Public()
  @Post('activate')
  async activate(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const session = await this.auth.activate(
      parsed.data.token,
      parsed.data.displayName,
      parsed.data.password,
    );
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
  @Post('invites')
  async invite(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.createInvite(user.id, parsed.data.email, parsed.data.role);
  }

  @Roles('ADMIN')
  @Get('users')
  users() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  @Roles('ADMIN')
  @Post('users/:id/reset-password')
  resetPassword(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.resetUserPassword(actor.id, id, parsed.data.password);
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
  async exportData(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      omit: { passwordHash: true },
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
