import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.decorators.js';
import { JobsService } from './jobs.service.js';
import { parseJobImportBuffer } from './jobs-domain.js';

type UploadFile = { originalname: string; buffer: Buffer; size: number; mimetype: string };

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('categories')
  categories() {
    return this.jobs.categories();
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.jobs.list(user.id, {
      companySize: query.companySize,
      category: query.category,
      region: query.region,
      tech: query.tech,
      sort: query.sort,
      saved: query.saved === 'true',
      calendar: query.calendar === 'true',
      deadlineFrom: query.deadlineFrom,
      deadlineTo: query.deadlineTo,
    });
  }

  @Roles('ADMIN')
  @Post('import/preview')
  preview(@Body() body: unknown) {
    return this.jobs.preview(body);
  }

  @Roles('ADMIN')
  @Post('import/commit')
  commit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.jobs.commit(user.id, body);
  }

  @Roles('ADMIN')
  @Post('import/file/preview')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  previewFile(@UploadedFile() file?: UploadFile) {
    if (!file) throw new BadRequestException('파일이 필요합니다.');
    try {
      return this.jobs.preview(parseJobImportBuffer(file.buffer, file.originalname));
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '파일을 읽지 못했습니다.',
      );
    }
  }

  @Roles('ADMIN')
  @Post('import/file/commit')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  commitFile(@CurrentUser() user: AuthUser, @UploadedFile() file?: UploadFile) {
    if (!file) throw new BadRequestException('파일이 필요합니다.');
    try {
      return this.jobs.commit(user.id, parseJobImportBuffer(file.buffer, file.originalname));
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '파일을 읽지 못했습니다.',
      );
    }
  }

  @Post('saved')
  save(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z
      .object({
        jobId: z.string().uuid(),
        status: z.enum([
          'INTERESTED',
          'PLANNED',
          'APPLIED',
          'SCREENING',
          'INTERVIEW',
          'REJECTED',
          'ACCEPTED',
          'ON_HOLD',
        ]),
        memo: z.string().max(10_000).default(''),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.jobs.save(user.id, parsed.data.jobId, parsed.data.status, parsed.data.memo);
  }
}
