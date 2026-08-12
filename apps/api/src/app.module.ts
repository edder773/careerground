import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AccessGuard } from './auth/access.guard.js';
import { PrismaService } from './common/prisma.service.js';
import { AuditService } from './common/audit.service.js';
import { HealthController } from './health.controller.js';
import { CollectionsController } from './collections/collections.controller.js';
import { CollectionsService } from './collections/collections.service.js';
import { CodingController, DailyChallengeInternalController } from './coding/coding.controller.js';
import { CodingService } from './coding/coding.service.js';
import { JobsController } from './jobs/jobs.controller.js';
import { JobsService } from './jobs/jobs.service.js';
import { LearningController } from './learning/learning.controller.js';
import { LearningService } from './learning/learning.service.js';
import { UtilityController } from './utility/utility.controller.js';
import { UtilityService } from './utility/utility.service.js';
import { StorageService } from './learning/storage.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  controllers: [
    HealthController,
    AuthController,
    CollectionsController,
    CodingController,
    DailyChallengeInternalController,
    JobsController,
    LearningController,
    UtilityController,
  ],
  providers: [
    PrismaService,
    AuditService,
    AuthService,
    CollectionsService,
    CodingService,
    JobsService,
    LearningService,
    StorageService,
    UtilityService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
})
export class AppModule {}
