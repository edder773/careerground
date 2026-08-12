import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.decorators.js';
import { LearningService } from './learning.service.js';

type UploadFile = { originalname: string; buffer: Buffer; size: number; mimetype: string };

@ApiTags('learning')
@Controller('learning')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.learning.list(user.id);
  }

  @Get('due')
  due(@CurrentUser() user: AuthUser) {
    return this.learning.due(user.id);
  }

  @Get('ai-status')
  aiStatus() {
    return this.learning.aiStatus();
  }

  @Roles('ADMIN')
  @Post('sources/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadFile | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    if (!file) throw new BadRequestException('파일이 필요합니다.');
    const parsed = z
      .object({
        title: z.string().trim().min(1).max(200),
        subject: z.string().trim().min(1).max(100),
        category: z.string().trim().min(1).max(100),
        version: z.string().trim().min(1).max(40),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.learning.upload(user.id, file, parsed.data);
  }

  @Roles('ADMIN')
  @Post('import/preview')
  preview(@Body() body: unknown) {
    return this.learning.preview(body);
  }

  @Roles('ADMIN')
  @Post('import/commit')
  commit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.learning.commit(user.id, body);
  }

  @Post('review')
  review(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z
      .object({ unitId: z.string().uuid(), rating: z.number().int().min(0).max(5) })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.learning.recordReview(user.id, parsed.data.unitId, parsed.data.rating);
  }
}
