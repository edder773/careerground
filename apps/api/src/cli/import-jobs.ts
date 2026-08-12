import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { JobsService } from '../jobs/jobs.service.js';
import { parseJobImportBuffer } from '../jobs/jobs-domain.js';
import { PrismaService } from '../common/prisma.service.js';

const filePath = process.argv[2];
if (!filePath) throw new Error('사용법: pnpm jobs:import <file> [--commit]');
const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
try {
  const input = parseJobImportBuffer(await readFile(filePath), basename(filePath));
  const jobs = app.get(JobsService);
  if (process.argv.includes('--commit')) {
    const admin = await app
      .get(PrismaService)
      .user.findFirstOrThrow({ where: { role: 'ADMIN', isActive: true } });
    console.log(JSON.stringify(await jobs.commit(admin.id, input), null, 2));
  } else {
    console.log(JSON.stringify(await jobs.preview(input), null, 2));
  }
} finally {
  await app.close();
}
