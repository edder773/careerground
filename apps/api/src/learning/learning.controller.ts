import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.decorators.js';
import { LearningService } from './learning.service.js';

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
