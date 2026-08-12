import { BadRequestException, Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from './auth.decorators.js';
import { PrismaService } from '../common/prisma.service.js';

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
  constructor(private readonly prisma: PrismaService) {}

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
