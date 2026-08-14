import { BadRequestException, Injectable } from '@nestjs/common';
import { learningImportSchema, preserveSourceText } from '@careerground/contracts';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { dueAtFrom, nextReview } from './learning-domain.js';

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async preview(body: unknown) {
    const parsed = learningImportSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.learningSourceVersion.findUnique({
      where: { sha256: parsed.data.source.checksum },
    });
    return {
      valid: true,
      idempotent: Boolean(existing),
      source: parsed.data.source,
      unitCount: parsed.data.units.length,
      flashcardCount: parsed.data.units.reduce((sum, unit) => sum + unit.flashcards.length, 0),
      questionCount: parsed.data.units.reduce((sum, unit) => sum + unit.questions.length, 0),
    };
  }

  async commit(actorId: string, body: unknown) {
    const parsed = learningImportSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const input = parsed.data;
    const existing = await this.prisma.learningSourceVersion.findUnique({
      where: { sha256: input.source.checksum },
      include: { source: true },
    });
    if (existing) return { source: existing.source, idempotent: true };
    const source = await this.prisma.$transaction(async (tx) => {
      const created = await tx.learningSource.create({
        data: {
          title: input.source.title,
          subject: input.source.subject,
          category: input.source.category,
          status: 'READY',
          publishedById: actorId,
          versions: {
            create: {
              version: input.source.sourceVersion,
              sha256: input.source.checksum,
              extractionMeta: { importedPackage: true },
            },
          },
        },
      });
      for (const [position, unit] of input.units.entries()) {
        await tx.learningUnit.create({
          data: {
            sourceId: created.id,
            anchor: unit.anchor,
            title: unit.title,
            summary: preserveSourceText(unit.summaryMarkdown),
            concepts: unit.concepts,
            visuals: unit.visuals,
            position,
            published: true,
            revisions: {
              create: {
                revision: 1,
                markdown: preserveSourceText(unit.summaryMarkdown),
              },
            },
            flashcards: { create: unit.flashcards },
            questions: {
              create: unit.questions.map((question) => ({
                ...question,
                choices: question.choices || [],
              })),
            },
          },
        });
      }
      return created;
    });
    await this.audit.record({
      actorId,
      action: 'LEARNING_IMPORT_APPROVED',
      targetType: 'LearningSource',
      targetId: source.id,
      metadata: { unitCount: input.units.length, checksum: input.source.checksum },
    });
    return { source, idempotent: false };
  }

  list(userId: string) {
    return this.prisma.learningSource.findMany({
      where: { deletedAt: null, visibility: 'MEMBERS' },
      include: {
        units: {
          where: { published: true },
          include: { progress: { where: { userId } }, flashcards: true, questions: true },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async recordReview(userId: string, unitId: string, rating: number) {
    const now = new Date();
    const current = await this.prisma.learningProgress.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });
    const schedule = nextReview(
      { repetitionCount: current?.repetitionCount || 0, intervalDays: current?.intervalDays || 1 },
      rating,
    );
    const nextReviewAt = dueAtFrom(now, schedule.intervalDays);
    return this.prisma.$transaction(async (tx) => {
      const progress = await tx.learningProgress.upsert({
        where: { userId_unitId: { userId, unitId } },
        create: {
          userId,
          unitId,
          completed: true,
          understanding: rating,
          lastStudiedAt: now,
          nextReviewAt,
          ...schedule,
        },
        update: {
          completed: true,
          understanding: rating,
          lastStudiedAt: now,
          nextReviewAt,
          ...schedule,
        },
      });
      await tx.reviewSchedule.create({
        data: { userId, unitId, dueAt: nextReviewAt, rating, completedAt: now },
      });
      return progress;
    });
  }

  due(userId: string) {
    return this.prisma.learningProgress.findMany({
      where: { userId, nextReviewAt: { lte: new Date() } },
      include: { unit: { include: { source: true } } },
      orderBy: { nextReviewAt: 'asc' },
      take: 100,
    });
  }
}
