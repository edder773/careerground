import { createHash, randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { learningImportSchema } from '@careerground/contracts';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { StorageService } from './storage.service.js';
import { dueAtFrom, nextReview } from './learning-domain.js';

const allowed = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['text/markdown', '.md'],
  ['text/plain', '.txt'],
  ['text/csv', '.csv'],
]);
type UploadFile = { originalname: string; buffer: Buffer; size: number; mimetype: string };

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async upload(
    actorId: string,
    file: UploadFile,
    meta: { title: string; subject: string; category: string; version: string },
  ) {
    const extension = `.${file.originalname.split('.').pop()?.toLowerCase()}`;
    if (!allowed.has(file.mimetype) || allowed.get(file.mimetype) !== extension)
      throw new BadRequestException('허용되지 않거나 MIME과 확장자가 일치하지 않는 파일입니다.');
    const maxBytes = Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024;
    if (file.size > maxBytes)
      throw new BadRequestException(`파일은 ${process.env.MAX_UPLOAD_MB || 20}MB 이하여야 합니다.`);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.prisma.learningSourceVersion.findUnique({
      where: { sha256 },
      include: { source: true },
    });
    if (duplicate)
      throw new ConflictException({
        message: '동일한 파일이 이미 등록되어 있습니다.',
        sourceId: duplicate.sourceId,
        title: duplicate.source.title,
      });
    const storageKey = `learning/${sha256.slice(0, 2)}/${sha256}-${randomUUID()}${extension}`;
    await this.storage.put(storageKey, file.buffer);
    const requiresManual = ['.pdf', '.docx'].includes(extension);
    return this.prisma.learningSource.create({
      data: {
        title: meta.title,
        subject: meta.subject,
        category: meta.category,
        publishedById: actorId,
        status: requiresManual ? 'REQUIRES_MANUAL_PROCESSING' : 'UPLOADED',
        versions: {
          create: {
            version: meta.version,
            fileName: file.originalname,
            mimeType: file.mimetype,
            storageKey,
            sha256,
            extractionMeta: { requiresManualExtraction: requiresManual },
          },
        },
      },
      include: { versions: true },
    });
  }

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
            summary: sanitizeHtml(unit.summaryMarkdown, { allowedTags: [], allowedAttributes: {} }),
            concepts: unit.concepts,
            position,
            published: true,
            revisions: {
              create: {
                revision: 1,
                markdown: sanitizeHtml(unit.summaryMarkdown, {
                  allowedTags: [],
                  allowedAttributes: {},
                }),
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

  aiStatus() {
    const enabled = process.env.AI_LEARNING_ENABLED === 'true';
    return {
      enabled,
      configured:
        enabled && Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_LEARNING_MODEL),
      message: !enabled
        ? 'AI 학습 생성을 사용하지 않도록 설정했습니다.'
        : !process.env.OPENAI_API_KEY
          ? '관리자가 OPENAI_API_KEY를 설정해야 합니다.'
          : 'AI 처리를 사용할 수 있습니다.',
    };
  }
}
