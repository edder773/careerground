import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { codeLanguageSchema } from '@careerground/contracts';
import { CurrentUser, Public, Roles, type AuthUser } from '../auth/auth.decorators.js';
import { CodingService } from './coding.service.js';

const solutionSchema = z.object({
  id: z.string().uuid().optional(),
  problemId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  language: codeLanguageSchema,
  code: z.string().max(100_000),
  description: z.string().max(30_000),
  timeComplexity: z.string().max(100).optional(),
  spaceComplexity: z.string().max(100).optional(),
  lessons: z.string().max(20_000).optional(),
  solved: z.boolean(),
});

@ApiTags('coding')
@Controller('coding')
export class CodingController {
  constructor(private readonly coding: CodingService) {}

  @Get('problems')
  problems(
    @CurrentUser() user: AuthUser,
    @Query('level') level?: string,
    @Query('tag') tag?: string,
  ) {
    return this.coding.listProblems(user.id, { level: level ? Number(level) : undefined, tag });
  }

  @Roles('ADMIN')
  @Post('problems')
  createProblem(@Body() body: unknown) {
    const parsed = z
      .object({
        sourceUrl: z.string().url(),
        displayTitle: z.string().trim().min(1).max(160),
        level: z.number().int().min(0).max(5),
        tags: z.array(z.string().max(40)).max(20),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.createProblem(parsed.data);
  }

  @Patch('problems/:id/progress')
  progress(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z
      .object({
        status: z.enum(['UNTRIED', 'IN_PROGRESS', 'SOLVED', 'RETRY']),
        favorite: z.boolean().optional(),
        memo: z.string().max(10_000).optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.setProgress(user.id, id, parsed.data);
  }

  @Get('solutions')
  solutions(
    @CurrentUser() user: AuthUser,
    @Query('problemId') problemId?: string,
    @Query('language') language?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.coding.listSolutions(user, { problemId, language, authorId });
  }

  @Post('solutions')
  saveSolution(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = solutionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.saveSolution(user.id, parsed.data);
  }

  @Post('solutions/:id/reaction')
  react(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coding.react(user.id, id);
  }

  @Post('solutions/:id/comments')
  comment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z
      .object({
        markdown: z.string().trim().min(1).max(4_000),
        parentId: z.string().uuid().optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.comment(user, id, parsed.data.markdown, parsed.data.parentId);
  }

  @Patch('comments/:id')
  updateComment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z.object({ markdown: z.string().trim().min(1).max(4_000) }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.updateComment(user, id, parsed.data.markdown);
  }

  @Delete('comments/:id')
  deleteComment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coding.deleteComment(user, id);
  }

  @Post('comments/:id/report')
  report(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z.object({ reason: z.string().trim().min(3).max(500) }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.reportComment(user.id, id, parsed.data.reason);
  }

  @Roles('ADMIN')
  @Patch('comments/:id/moderation')
  moderate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z.object({ hidden: z.boolean() }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.moderateComment(user.id, id, parsed.data.hidden);
  }

  @Get('daily-challenge')
  daily() {
    return this.coding.ensureTodayChallenge();
  }

  @Post('daily-challenge/:id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coding.completeChallenge(user.id, id);
  }

  @Roles('ADMIN')
  @Post('daily-challenge/reselect')
  reselect(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z
      .object({
        problemId: z.string().uuid(),
        confirmKstDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.coding.reselectTodayChallenge(
      user.id,
      parsed.data.problemId,
      parsed.data.confirmKstDate,
    );
  }

  @Public()
  @Post('internal/daily-challenge/ensure')
  internalEnsure(@Headers('x-internal-secret') secret?: string) {
    if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET)
      throw new BadRequestException('invalid internal secret');
    return this.coding.ensureTodayChallenge();
  }

  @Get('rankings')
  rankings() {
    return this.coding.rankings();
  }
}

@ApiTags('internal')
@Controller('internal/daily-challenge')
export class DailyChallengeInternalController {
  constructor(private readonly coding: CodingService) {}

  @Public()
  @Post('ensure')
  ensure(@Headers('x-internal-secret') secret?: string) {
    if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET)
      throw new BadRequestException('invalid internal secret');
    return this.coding.ensureTodayChallenge();
  }
}
