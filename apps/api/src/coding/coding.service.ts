import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import type { ProblemStatus } from '../generated/prisma/enums.js';
import {
  denseRank,
  kstCalendarDate,
  mayEditComment,
  selectDeterministicProblem,
  solvedCounts,
} from './coding-domain.js';

export const cleanMarkdown = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();

@Injectable()
export class CodingService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.ensureTodayChallenge();
    } catch (error) {
      console.warn(
        '[daily-challenge] startup ensure deferred:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  listProblems(userId: string, query: { level?: number; tag?: string }) {
    return this.prisma.codingProblem.findMany({
      where: {
        active: true,
        level: query.level,
        ...(query.tag ? { tags: { has: query.tag } } : {}),
      },
      include: { progress: { where: { userId } }, _count: { select: { solutions: true } } },
      orderBy: [{ order: 'asc' }, { level: 'asc' }],
    });
  }

  createProblem(data: { sourceUrl: string; displayTitle: string; level: number; tags: string[] }) {
    const url = new URL(data.sourceUrl);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'school.programmers.co.kr' ||
      !url.pathname.includes('/learn/courses/')
    ) {
      throw new BadRequestException('허용된 프로그래머스 문제 링크가 아닙니다.');
    }
    url.search = '';
    url.hash = '';
    return this.prisma.codingProblem.create({ data: { ...data, sourceUrl: url.toString() } });
  }

  setProgress(
    userId: string,
    problemId: string,
    data: { status: ProblemStatus; favorite?: boolean; memo?: string },
  ) {
    return this.prisma.problemProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: {
        userId,
        problemId,
        ...data,
        solvedAt: data.status === 'SOLVED' ? new Date() : undefined,
      },
      update: { ...data, solvedAt: data.status === 'SOLVED' ? new Date() : null },
    });
  }

  async listSolutions(
    user: AuthUser,
    filters: { problemId?: string; language?: string; authorId?: string },
  ) {
    const solutions = await this.prisma.solution.findMany({
      where: {
        deletedAt: null,
        problemId: filters.problemId,
        language: filters.language,
        authorId: filters.authorId,
        visibility: 'MEMBERS',
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        problem: true,
        revisions: { orderBy: { revision: 'desc' }, take: 10 },
        reactions: true,
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, displayName: true } },
            replies: { include: { author: { select: { id: true, displayName: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
    return solutions.map((solution) => ({
      ...solution,
      canEdit: solution.authorId === user.id,
    }));
  }

  async saveSolution(
    userId: string,
    data: {
      id?: string;
      problemId: string;
      title: string;
      language: string;
      code: string;
      description: string;
      timeComplexity?: string;
      spaceComplexity?: string;
      lessons?: string;
      solved: boolean;
    },
  ) {
    if (data.solved && !data.code.trim())
      throw new BadRequestException('해결 기록에는 코드가 필요합니다.');
    const description = cleanMarkdown(data.description);
    const lessons = cleanMarkdown(data.lessons || '');
    if (data.id) {
      const current = await this.prisma.solution.findUnique({ where: { id: data.id } });
      if (!current) throw new NotFoundException();
      if (current.authorId !== userId) throw new ForbiddenException();
      const revision = current.currentRev + 1;
      return this.prisma.$transaction(async (tx) => {
        await tx.solutionRevision.create({
          data: { solutionId: current.id, revision, code: data.code, description },
        });
        const solution = await tx.solution.update({
          where: { id: current.id },
          data: {
            ...data,
            description,
            lessons,
            currentRev: revision,
            solvedAt: data.solved ? current.solvedAt || new Date() : null,
            visibility: 'MEMBERS',
            id: undefined,
          },
          include: { problem: true },
        });
        await tx.problemProgress.upsert({
          where: { userId_problemId: { userId, problemId: data.problemId } },
          create: {
            userId,
            problemId: data.problemId,
            status: data.solved ? 'SOLVED' : 'IN_PROGRESS',
            solvedAt: data.solved ? new Date() : null,
          },
          update: {
            status: data.solved ? 'SOLVED' : 'IN_PROGRESS',
            solvedAt: data.solved ? new Date() : null,
          },
        });
        return solution;
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const solution = await tx.solution.create({
        data: {
          ...data,
          id: undefined,
          authorId: userId,
          visibility: 'MEMBERS',
          description,
          lessons,
          solvedAt: data.solved ? new Date() : null,
        },
      });
      await tx.solutionRevision.create({
        data: { solutionId: solution.id, revision: 1, code: data.code, description },
      });
      await tx.problemProgress.upsert({
        where: { userId_problemId: { userId, problemId: data.problemId } },
        create: {
          userId,
          problemId: data.problemId,
          status: data.solved ? 'SOLVED' : 'IN_PROGRESS',
          solvedAt: data.solved ? new Date() : null,
        },
        update: {
          status: data.solved ? 'SOLVED' : 'IN_PROGRESS',
          solvedAt: data.solved ? new Date() : null,
        },
      });
      return solution;
    });
  }

  async react(userId: string, solutionId: string) {
    const existing = await this.prisma.solutionReaction.findUnique({
      where: { solutionId_userId_type: { solutionId, userId, type: 'HELPFUL' } },
    });
    if (existing) {
      await this.prisma.solutionReaction.delete({ where: { id: existing.id } });
      return { active: false };
    }
    await this.prisma.solutionReaction.create({ data: { solutionId, userId } });
    return { active: true };
  }

  async comment(user: AuthUser, solutionId: string, markdown: string, parentId?: string) {
    const solution = await this.prisma.solution.findUnique({ where: { id: solutionId } });
    if (!solution || solution.deletedAt) throw new NotFoundException();
    let notifyUserId = solution.authorId;
    if (parentId) {
      const parent = await this.prisma.solutionComment.findUnique({ where: { id: parentId } });
      if (!parent || parent.solutionId !== solutionId || parent.parentId)
        throw new BadRequestException('답글은 한 단계까지만 지원합니다.');
      notifyUserId = parent.authorId;
    }
    const created = await this.prisma.solutionComment.create({
      data: { solutionId, authorId: user.id, parentId, markdown: cleanMarkdown(markdown) },
    });
    if (notifyUserId !== user.id) {
      await this.prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: parentId ? 'REPLY' : 'COMMENT',
          title: parentId ? '새 답글' : '새 댓글',
          message: `${user.displayName}님이 의견을 남겼습니다.`,
          href: `/solutions?solution=${solutionId}`,
        },
      });
    }
    return created;
  }

  async updateComment(user: AuthUser, id: string, markdown: string) {
    const comment = await this.prisma.solutionComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (!mayEditComment(user, comment.authorId)) throw new ForbiddenException();
    return this.prisma.solutionComment.update({
      where: { id },
      data: { markdown: cleanMarkdown(markdown), editedAt: new Date() },
    });
  }

  async deleteComment(user: AuthUser, id: string) {
    const comment = await this.prisma.solutionComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (!mayEditComment(user, comment.authorId)) throw new ForbiddenException();
    return this.prisma.solutionComment.update({
      where: { id },
      data: { deletedAt: new Date(), markdown: '' },
    });
  }

  async moderateComment(adminId: string, id: string, hidden: boolean) {
    const comment = await this.prisma.solutionComment.update({
      where: { id },
      data: { hiddenAt: hidden ? new Date() : null, hiddenById: hidden ? adminId : null },
    });
    await this.audit.record({
      actorId: adminId,
      action: hidden ? 'COMMENT_HIDDEN' : 'COMMENT_RESTORED',
      targetType: 'SolutionComment',
      targetId: id,
    });
    return comment;
  }

  reportComment(userId: string, id: string, reason: string) {
    return this.prisma.commentReport.create({
      data: { commentId: id, reporterId: userId, reason: cleanMarkdown(reason) },
    });
  }

  @Cron('0 0 7 * * *', { timeZone: 'Asia/Seoul' })
  scheduledEnsure() {
    return this.ensureTodayChallenges();
  }

  async ensureTodayChallenges(now = new Date()) {
    const setting = await this.prisma.dailyChallengeSetting.upsert({
      where: { id: 1 },
      create: { id: 1, allowedLevels: [1, 2], repeatExclusionDays: 60 },
      update: { allowedLevels: [1, 2] },
    });
    return Promise.all(
      [1, 2].map((levelSlot) => this.ensureTodayChallengeLevel(now, levelSlot, setting)),
    );
  }

  async ensureTodayChallenge(now = new Date()) {
    return (await this.ensureTodayChallenges(now))[0];
  }

  private async ensureTodayChallengeLevel(
    now: Date,
    levelSlot: number,
    setting: {
      repeatExclusionDays: number;
      allowRepeatRelaxation: boolean;
    },
  ) {
    const kstDate = kstCalendarDate(now);
    const existing = await this.prisma.dailyChallenge.findUnique({
      where: { kstDate_levelSlot: { kstDate, levelSlot } },
      include: { problem: true },
    });
    if (existing) return existing;
    const candidatesForWindow = async (days: number) => {
      const cutoff = new Date(kstDate.getTime() - days * 86_400_000);
      const recent = await this.prisma.dailyChallenge.findMany({
        where: { kstDate: { gte: cutoff } },
        select: { problemId: true },
      });
      return this.prisma.codingProblem.findMany({
        where: {
          active: true,
          level: levelSlot,
          id: { notIn: recent.map((x) => x.problemId) },
        },
      });
    };
    let effectiveRepeatDays = setting.repeatExclusionDays;
    let candidates = await candidatesForWindow(effectiveRepeatDays);
    if (!candidates.length && setting.allowRepeatRelaxation) {
      const fallbackWindows = [...new Set([Math.floor(setting.repeatExclusionDays / 2), 0])].filter(
        (days) => days < setting.repeatExclusionDays,
      );
      for (const days of fallbackWindows) {
        const relaxedCandidates = await candidatesForWindow(days);
        if (!relaxedCandidates.length) continue;
        candidates = relaxedCandidates;
        effectiveRepeatDays = days;
        await this.audit.record({
          action: 'DAILY_CHALLENGE_REPEAT_WINDOW_RELAXED',
          targetType: 'DailyChallenge',
          targetId: kstDate.toISOString().slice(0, 10),
          metadata: {
            configuredDays: setting.repeatExclusionDays,
            effectiveDays: days,
            level: levelSlot,
          },
        });
        break;
      }
    }
    if (!candidates.length) {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'IMPORT_ERROR' as const,
          title: `오늘의 Lv. ${levelSlot} 문제 후보 없음`,
          message: `레벨 ${levelSlot}과 ${setting.repeatExclusionDays}일 제외 조건을 만족하는 문제가 없습니다.`,
          href: '/admin',
        })),
      });
      throw new ServiceUnavailableException(
        `오늘의 Lv. ${levelSlot} 문제 후보가 없습니다. 관리자 설정을 확인하세요.`,
      );
    }
    const seed = `${kstDate.toISOString().slice(0, 10)}:level-${levelSlot}`;
    const selected = selectDeterministicProblem(candidates, seed);
    if (!selected) throw new ServiceUnavailableException();
    try {
      const created = await this.prisma.dailyChallenge.create({
        data: {
          kstDate,
          levelSlot,
          problemId: selected.id,
          candidateCount: candidates.length,
          allowedLevels: [levelSlot],
          repeatWindowDays: effectiveRepeatDays,
          selectionSeed: createHash('sha256').update(seed).digest('hex').slice(0, 16),
          selectionReason:
            effectiveRepeatDays === setting.repeatExclusionDays
              ? '활성 문제 중 허용 레벨 및 반복 제외 기간을 만족한 후보를 날짜 seed로 결정'
              : `ADMIN 허용에 따라 반복 제외 기간을 ${setting.repeatExclusionDays}일에서 ${effectiveRepeatDays}일로 완화한 뒤 날짜 seed로 결정`,
        },
        include: { problem: true },
      });
      const users = await this.prisma.user.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: 'DAILY_CHALLENGE' as const,
          title: '오늘의 코딩테스트',
          message: `Lv. ${levelSlot} · ${selected.displayTitle}`,
          href: '/coding',
        })),
      });
      return created;
    } catch (error) {
      const winner = await this.prisma.dailyChallenge.findUnique({
        where: { kstDate_levelSlot: { kstDate, levelSlot } },
        include: { problem: true },
      });
      if (winner) return winner;
      throw error;
    }
  }

  async completeChallenge(userId: string, challengeId: string) {
    const participation = await this.prisma.dailyChallengeParticipation.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      create: { challengeId, userId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });
    return participation;
  }

  async reselectTodayChallenge(actorId: string, problemId: string, confirmKstDate: string) {
    const kstDate = kstCalendarDate(new Date());
    const dateKey = kstDate.toISOString().slice(0, 10);
    if (confirmKstDate !== dateKey)
      throw new BadRequestException(`확인 날짜로 ${dateKey}를 입력해야 합니다.`);
    const current = await this.prisma.dailyChallenge.findUnique({
      where: { kstDate_levelSlot: { kstDate, levelSlot: 1 } },
      include: { problem: true, _count: { select: { participations: true } } },
    });
    if (!current) throw new NotFoundException('오늘의 문제가 아직 생성되지 않았습니다.');
    if (current._count.participations > 0)
      throw new BadRequestException('참여 기록이 생긴 뒤에는 오늘의 문제를 재선정할 수 없습니다.');
    const next = await this.prisma.codingProblem.findFirst({
      where: { id: problemId, active: true, level: current.levelSlot },
    });
    if (!next)
      throw new NotFoundException(`활성 Lv. ${current.levelSlot} 문제를 찾을 수 없습니다.`);
    if (next.id === current.problemId) throw new BadRequestException('현재 문제와 동일합니다.');
    const updated = await this.prisma.dailyChallenge.update({
      where: { id: current.id },
      data: {
        problemId: next.id,
        candidateCount: 1,
        selectionSeed: `manual:${actorId.slice(0, 8)}`,
        selectionReason: `ADMIN이 ${dateKey} 확인 절차를 거쳐 수동 재선정`,
      },
      include: { problem: true },
    });
    await this.audit.record({
      actorId,
      action: 'DAILY_CHALLENGE_RESELECTED',
      targetType: 'DailyChallenge',
      targetId: current.id,
      metadata: { beforeProblemId: current.problemId, afterProblemId: next.id, kstDate: dateKey },
    });
    return updated;
  }

  async rankings() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, deletedAt: null, role: 'MEMBER' },
      select: { id: true, displayName: true },
    });
    const solutions = await this.prisma.solution.findMany({
      where: { solved: true, solvedAt: { not: null }, deletedAt: null },
      select: { authorId: true, problemId: true, solvedAt: true, code: true },
    });
    const normalized = solutions.flatMap((row) =>
      row.solvedAt
        ? [
            {
              userId: row.authorId,
              problemId: row.problemId,
              solvedAt: row.solvedAt,
              code: row.code,
            },
          ]
        : [],
    );
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const total = solvedCounts(normalized);
    const weekly = solvedCounts(normalized, weekStart);
    const monthly = solvedCounts(normalized, monthStart);
    const participations = await this.prisma.dailyChallengeParticipation.findMany({
      where: { completedAt: { not: null }, userId: { in: users.map((x) => x.id) } },
      include: { challenge: true },
    });
    const rows = users.map((user) => {
      const dates = participations
        .filter((x) => x.userId === user.id)
        .map((x) => x.challenge.kstDate.toISOString().slice(0, 10))
        .sort()
        .reverse();
      let streak = 0;
      let cursor = kstCalendarDate(now);
      for (const date of dates) {
        const expected = cursor.toISOString().slice(0, 10);
        if (date === expected) {
          streak += 1;
          cursor = new Date(cursor.getTime() - 86_400_000);
        } else if (
          streak === 0 &&
          date === new Date(cursor.getTime() - 86_400_000).toISOString().slice(0, 10)
        ) {
          cursor = new Date(cursor.getTime() - 86_400_000);
          streak += 1;
        } else break;
      }
      return {
        userId: user.id,
        displayName: user.displayName,
        score: total.get(user.id) || 0,
        weekly: weekly.get(user.id) || 0,
        monthly: monthly.get(user.id) || 0,
        streak,
        challengeCount: dates.length,
      };
    });
    return { calculatedAt: now.toISOString(), selfReported: true, rows: denseRank(rows) };
  }
}
