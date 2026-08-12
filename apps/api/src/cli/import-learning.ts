import { readFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { LearningService } from '../learning/learning.service.js';
import { PrismaService } from '../common/prisma.service.js';

const filePath = process.argv[2];
if (!filePath) throw new Error('사용법: pnpm learning:import <file> [--commit]');
const input = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
try {
  const learning = app.get(LearningService);
  if (process.argv.includes('--commit')) {
    const admin = await app
      .get(PrismaService)
      .user.findFirstOrThrow({ where: { role: 'ADMIN', isActive: true } });
    console.log(JSON.stringify(await learning.commit(admin.id, input), null, 2));
  } else {
    console.log(JSON.stringify(await learning.preview(input), null, 2));
  }
} finally {
  await app.close();
}
