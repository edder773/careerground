import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.decorators.js';
import { UtilityService } from './utility.service.js';

@ApiTags('workspace')
@Controller()
export class UtilityController {
  constructor(private readonly utility: UtilityService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.utility.dashboard(user.id);
  }

  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query('q') query = '') {
    return this.utility.search(user, query);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.utility.notifications(user.id);
  }

  @Patch('notifications/read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.utility.readAll(user.id);
  }

  @Patch('notifications/:id/read')
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.utility.readNotification(user.id, id);
  }

  @Get('notes')
  notes(@CurrentUser() user: AuthUser) {
    return this.utility.notes(user);
  }

  @Post('notes')
  saveNote(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(200),
        markdown: z.string().max(50_000),
        visibility: z.enum(['PRIVATE', 'MEMBERS']).default('PRIVATE'),
        linkedType: z.string().max(40).optional(),
        linkedId: z.string().max(100).optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.utility.saveNote(user.id, parsed.data);
  }

  @Roles('ADMIN')
  @Get('admin/overview')
  adminOverview() {
    return this.utility.adminOverview();
  }

  @Roles('ADMIN')
  @Get('admin/audit-logs')
  auditLogs() {
    return this.utility.auditLogs();
  }

  @Roles('ADMIN')
  @Get('admin/daily-challenge-setting')
  dailySetting() {
    return this.utility.dailySetting();
  }

  @Roles('ADMIN')
  @Patch('admin/companies/:id')
  updateCompany(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = z
      .object({
        size: z.enum(['LARGE', 'PUBLIC', 'MID', 'SMALL', 'STARTUP', 'FOREIGN', 'UNCLASSIFIED']),
        evidence: z.string().trim().min(1).max(1_000),
        evidenceUrl: z.string().url().optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.utility.updateCompany(
      user.id,
      id,
      parsed.data.size,
      parsed.data.evidence,
      parsed.data.evidenceUrl,
    );
  }

  @Roles('ADMIN')
  @Patch('admin/daily-challenge-setting')
  updateDailySetting(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z
      .object({
        allowedLevels: z.array(z.number().int().min(0).max(5)).min(1),
        repeatExclusionDays: z.number().int().min(0).max(365),
        allowRepeatRelaxation: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.utility.updateDailySetting(
      user.id,
      parsed.data.allowedLevels,
      parsed.data.repeatExclusionDays,
      parsed.data.allowRepeatRelaxation,
    );
  }
}
