import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../auth/auth.decorators.js';
import { CollectionsService } from './collections.service.js';

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().min(1).max(40).default('folder'),
  color: z.enum(['amber', 'cyan', 'violet', 'rose', 'emerald', 'slate']).default('amber'),
  parentId: z.string().uuid().nullable().optional(),
});
const itemSchema = z.object({
  itemType: z.enum([
    'LEARNING_SOURCE',
    'LEARNING_UNIT',
    'JOB_POSTING',
    'CODING_PROBLEM',
    'SOLUTION',
    'NOTE',
    'EXTERNAL_LINK',
  ]),
  targetId: z.string().trim().min(1).max(500),
  label: z.string().trim().max(240).optional(),
});

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.collections.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = collectionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.collections.create(user.id, parsed.data);
  }

  @Patch('reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = z.object({ ids: z.array(z.string().uuid()).max(100) }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.collections.reorder(user.id, parsed.data.ids);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = collectionSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.collections.update(user.id, id, parsed.data);
  }

  @Post(':id/items')
  addItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.collections.addItem(user.id, id, parsed.data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.collections.remove(user.id, id);
  }
}
