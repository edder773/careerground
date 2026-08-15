import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { AuthUser } from '../auth/auth.decorators.js';
import type { CompanySize } from '../generated/prisma/enums.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';

@Injectable()
export class UtilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async dashboard(userId: string) {
    const now = new Date();
    const deadline = new Date(now.getTime() + 7 * 86_400_000);
    const [recentJobs, expiringJobs, dueReviews, recentActivity] = await Promise.all([
      this.prisma.jobPosting.count({
        where: { status: 'ACTIVE', createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } },
      }),
      this.prisma.savedJob.count({
        where: { userId, job: { status: 'ACTIVE', deadlineAt: { gte: now, lte: deadline } } },
      }),
      this.prisma.learningProgress.count({ where: { userId, nextReviewAt: { lte: now } } }),
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { actorId: userId },
            { action: { in: ['LEARNING_IMPORT_APPROVED', 'JOB_IMPORT_APPROVED'] } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);
    return { recentJobs, expiringJobs, dueReviews, recentActivity };
  }

  async search(user: AuthUser, query: string) {
    const q = query.trim();
    if (q.length < 2) throw new BadRequestException('검색어는 2자 이상이어야 합니다.');
    const [folders, jobs, problems, solutions, learning] = await Promise.all([
      this.prisma.collection.findMany({
        where: { userId: user.id, deletedAt: null, name: { contains: q, mode: 'insensitive' } },
        take: 10,
      }),
      this.prisma.jobPosting.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { company: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: { company: true },
        take: 10,
      }),
      this.prisma.codingProblem.findMany({
        where: { active: true, displayTitle: { contains: q, mode: 'insensitive' } },
        take: 10,
      }),
      this.prisma.solution.findMany({
        where: {
          deletedAt: null,
          OR: [{ visibility: 'MEMBERS' }, { authorId: user.id }],
          title: { contains: q, mode: 'insensitive' },
        },
        include: { author: { select: { displayName: true } } },
        take: 10,
      }),
      this.prisma.learningUnit.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { source: true },
        take: 10,
      }),
    ]);
    return { query: q, folders, jobs, problems, solutions, learning };
  }

  notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  readNotification(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  readAll(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  adminOverview() {
    return Promise.all([
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.jobImportBatch.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.processingJob.findMany({
        where: { status: { in: ['FAILED', 'REQUIRES_REVIEW'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.commentReport.findMany({
        where: { status: 'OPEN' },
        include: { comment: true, reporter: { select: { displayName: true } } },
        take: 20,
      }),
    ]).then(([activeUsers, importBatches, processingQueue, commentReports]) => ({
      activeUsers,
      maxActiveUsers: Number(process.env.MAX_ACTIVE_USERS || 10),
      importBatches,
      processingQueue,
      commentReports,
    }));
  }

  auditLogs() {
    return this.prisma.auditLog.findMany({
      include: { actor: { select: { displayName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  dailySetting() {
    return this.prisma.dailyChallengeSetting.upsert({
      where: { id: 1 },
      create: { id: 1, allowedLevels: [1, 2], repeatExclusionDays: 60 },
      update: {},
    });
  }

  async updateCompany(
    actorId: string,
    companyId: string,
    size: CompanySize,
    evidence: string,
    evidenceUrl?: string,
  ) {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { size, sizeEvidence: evidence, evidenceUrl },
    });
    await this.audit.record({
      actorId,
      action: 'COMPANY_CLASSIFICATION_UPDATED',
      targetType: 'Company',
      targetId: companyId,
      metadata: { size, evidenceUrl },
    });
    return company;
  }

  async updateDailySetting(
    actorId: string,
    allowedLevels: number[],
    repeatExclusionDays: number,
    allowRepeatRelaxation: boolean,
  ) {
    const setting = await this.prisma.dailyChallengeSetting.upsert({
      where: { id: 1 },
      create: { id: 1, allowedLevels, repeatExclusionDays, allowRepeatRelaxation },
      update: { allowedLevels, repeatExclusionDays, allowRepeatRelaxation },
    });
    await this.audit.record({
      actorId,
      action: 'DAILY_CHALLENGE_SETTING_UPDATED',
      targetType: 'DailyChallengeSetting',
      targetId: '1',
      metadata: { allowedLevels, repeatExclusionDays, allowRepeatRelaxation },
    });
    return setting;
  }

  @Cron('0 30 6 * * *', { timeZone: 'Asia/Seoul' })
  async deadlineNotifications() {
    const now = new Date();
    for (const days of [7, 3, 1]) {
      const start = new Date(now.getTime() + days * 86_400_000);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86_400_000);
      const saved = await this.prisma.savedJob.findMany({
        where: { job: { deadlineAt: { gte: start, lt: end }, status: 'ACTIVE' } },
        include: { job: true },
      });
      for (const item of saved) {
        const title = `관심 공고 마감 D-${days}`;
        const duplicate = await this.prisma.notification.findFirst({
          where: {
            userId: item.userId,
            title,
            href: `/jobs/${item.jobId}`,
            createdAt: { gte: new Date(now.getTime() - 86_400_000) },
          },
        });
        if (!duplicate)
          await this.prisma.notification.create({
            data: {
              userId: item.userId,
              type: 'JOB_DEADLINE',
              title,
              message: item.job.title,
              href: `/jobs/${item.jobId}`,
            },
          });
      }
    }
  }

  @Cron('0 20 3 * * *', { timeZone: 'Asia/Seoul' })
  cleanupNotifications() {
    return this.prisma.notification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { readAt: { lt: new Date(Date.now() - 90 * 86_400_000) } },
        ],
      },
    });
  }
}
