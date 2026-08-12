import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        requestId: input.requestId,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }
}
