import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { jobImportSchema } from '@careerground/contracts';
import type { ApplicationStatus, CompanySize } from '../generated/prisma/enums.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { analyzeJobImport, canonicalizeJobUrl, normalizeCompany } from './jobs-domain.js';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private parse(body: unknown) {
    const parsed = jobImportSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return parsed.data;
  }

  async preview(body: unknown) {
    const input = this.parse(body);
    const canonical = input.items.map((item) => canonicalizeJobUrl(item.sourceUrl));
    const existing = await this.prisma.jobPosting.findMany({
      where: { canonicalUrl: { in: canonical } },
      select: { canonicalUrl: true },
    });
    const analysis = analyzeJobImport(input, new Set(existing.map((row) => row.canonicalUrl)));
    const checksum = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const previous = await this.prisma.jobImportBatch.findUnique({ where: { checksum } });
    return { checksum, idempotent: Boolean(previous), previousBatchId: previous?.id, ...analysis };
  }

  async commit(actorId: string, body: unknown) {
    const input = this.parse(body);
    const checksum = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const previous = await this.prisma.jobImportBatch.findUnique({ where: { checksum } });
    if (previous) return { batch: previous, idempotent: true };
    const preview = await this.preview(input);
    const result = await this.prisma.$transaction(async (tx) => {
      for (const row of preview.rows) {
        if (row.outcome === 'REJECT' || row.outcome === 'DUPLICATE') continue;
        const item = row.item;
        const source = await tx.jobSource.upsert({
          where: { name: item.sourceName },
          create: { name: item.sourceName, lastSuccessAt: new Date(item.collectedAt) },
          update: { lastSuccessAt: new Date(item.collectedAt), lastError: null },
        });
        const normalized = normalizeCompany(item.companyName);
        let company = await tx.company.findFirst({
          where: {
            OR: [
              { normalizedName: normalized },
              { aliases: { some: { normalizedAlias: normalized } } },
            ],
          },
        });
        if (!company) {
          company = await tx.company.create({
            data: {
              name: item.companyName,
              normalizedName: normalized,
              size: item.companySize as CompanySize,
              sizeEvidence: item.companySizeEvidence,
            },
          });
        } else if (company.size === 'UNCLASSIFIED' && item.companySize !== 'UNCLASSIFIED') {
          company = await tx.company.update({
            where: { id: company.id },
            data: { size: item.companySize as CompanySize, sizeEvidence: item.companySizeEvidence },
          });
        }
        const canonicalUrl = canonicalizeJobUrl(item.sourceUrl);
        const data = {
          sourceId: source.id,
          companyId: company.id,
          sourcePostingId: item.sourceId,
          sourceUrl: item.sourceUrl,
          canonicalUrl,
          title: item.title,
          category: item.category,
          careerScope: item.careerScope,
          careerEvidence: item.careerEvidence,
          companySizeEvidence: item.companySizeEvidence,
          employmentType: item.employmentType,
          region: item.region,
          remote: item.remote,
          techStack: item.techStack,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          deadlineAt: item.deadlineAt ? new Date(item.deadlineAt) : null,
          rolling: item.rolling,
          collectedAt: new Date(item.collectedAt),
          lastVerifiedAt: new Date(item.lastVerifiedAt),
          fingerprint: row.fingerprint,
          summary: item.summary,
          status: row.outcome === 'REVIEW' ? ('NEEDS_REVIEW' as const) : item.status,
        };
        await tx.jobPosting.upsert({ where: { canonicalUrl }, create: data, update: data });
      }
      return tx.jobImportBatch.create({
        data: {
          checksum,
          importVersion: input.version,
          sourceCount: input.sourceCount,
          originalCount: preview.counts.original,
          createdCount: preview.counts.create,
          updatedCount: preview.counts.update,
          duplicateCount: preview.counts.duplicate,
          rejectedCount: preview.counts.rejected,
          expiredCount: 0,
          needsReviewCount: preview.counts.review,
          report: preview.rows.map(({ index, outcome, reason, canonicalUrl }) => ({
            index,
            outcome,
            reason,
            canonicalUrl,
          })),
          approvedById: actorId,
        },
      });
    });
    await this.audit.record({
      actorId,
      action: 'JOB_IMPORT_APPROVED',
      targetType: 'JobImportBatch',
      targetId: result.id,
      metadata: { checksum, counts: preview.counts },
    });
    return { batch: result, idempotent: false };
  }

  async list(
    userId: string,
    filters: {
      companySize?: string;
      category?: string;
      region?: string;
      tech?: string;
      sort?: string;
      saved?: boolean;
      deadlineFrom?: string;
      deadlineTo?: string;
    },
  ) {
    const deadlineFrom = filters.deadlineFrom ? new Date(filters.deadlineFrom) : undefined;
    const deadlineTo = filters.deadlineTo ? new Date(filters.deadlineTo) : undefined;
    if (
      (deadlineFrom && Number.isNaN(deadlineFrom.getTime())) ||
      (deadlineTo && Number.isNaN(deadlineTo.getTime())) ||
      (deadlineFrom && deadlineTo && deadlineFrom >= deadlineTo)
    ) {
      throw new BadRequestException('올바른 마감일 조회 범위가 필요합니다.');
    }
    const orderBy =
      filters.sort === 'deadline'
        ? { deadlineAt: 'asc' as const }
        : filters.sort === 'company'
          ? { company: { name: 'asc' as const } }
          : { createdAt: 'desc' as const };
    return this.prisma.jobPosting.findMany({
      where: {
        status: { in: ['ACTIVE', 'DEADLINE_UNKNOWN'] },
        careerScope: { in: ['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE'] },
        company: filters.companySize ? { size: filters.companySize as CompanySize } : undefined,
        category: filters.category,
        region: filters.region ? { contains: filters.region, mode: 'insensitive' } : undefined,
        techStack: filters.tech ? { has: filters.tech } : undefined,
        savedBy: filters.saved ? { some: { userId } } : undefined,
        deadlineAt:
          deadlineFrom || deadlineTo
            ? {
                ...(deadlineFrom ? { gte: deadlineFrom } : {}),
                ...(deadlineTo ? { lt: deadlineTo } : {}),
              }
            : undefined,
      },
      select: {
        id: true,
        title: true,
        category: true,
        region: true,
        remote: true,
        techStack: true,
        deadlineAt: true,
        rolling: true,
        summary: true,
        sourceUrl: true,
        company: { select: { name: true, size: true } },
        source: { select: { name: true, lastSuccessAt: true } },
        savedBy: { where: { userId }, select: { status: true, memo: true } },
      },
      orderBy,
      take: 100,
    });
  }

  async categories() {
    const rows = await this.prisma.jobPosting.findMany({
      where: {
        status: { in: ['ACTIVE', 'DEADLINE_UNKNOWN'] },
        careerScope: { in: ['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE'] },
      },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
      take: 100,
    });
    return rows.map((row) => row.category);
  }

  save(userId: string, jobId: string, status: ApplicationStatus, memo: string) {
    return this.prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId, status, memo },
      update: { status, memo },
    });
  }
}
