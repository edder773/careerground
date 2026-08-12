import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CollectionItemType } from '../generated/prisma/enums.js';
import { PrismaService } from '../common/prisma.service.js';
import { collectionDepth, wouldCreateCollectionCycle } from './collection-domain.js';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId, deletedAt: null },
      include: { items: { orderBy: { position: 'asc' } } },
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  private async parentMap(userId: string) {
    const rows = await this.prisma.collection.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, parentId: true },
    });
    return new Map(rows.map((row) => [row.id, row.parentId]));
  }

  async create(
    userId: string,
    data: { name: string; icon: string; color: string; parentId?: string | null },
  ) {
    const parents = await this.parentMap(userId);
    if (data.parentId && !parents.has(data.parentId))
      throw new NotFoundException('상위 폴더를 찾을 수 없습니다.');
    if (collectionDepth(data.parentId || null, parents) >= 2) {
      throw new BadRequestException('개인 워크스페이스 UI는 최대 2단계 폴더를 지원합니다.');
    }
    const position = await this.prisma.collection.count({
      where: { userId, parentId: data.parentId || null, deletedAt: null },
    });
    return this.prisma.collection.create({
      data: {
        userId,
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
        parentId: data.parentId || null,
        position,
      },
      include: { items: true },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; icon?: string; color?: string; parentId?: string | null },
  ) {
    const current = await this.prisma.collection.findUnique({ where: { id } });
    if (!current || current.deletedAt) throw new NotFoundException('폴더를 찾을 수 없습니다.');
    if (current.userId !== userId) throw new ForbiddenException();
    if (data.parentId !== undefined) {
      const parents = await this.parentMap(userId);
      if (data.parentId && !parents.has(data.parentId))
        throw new NotFoundException('상위 폴더를 찾을 수 없습니다.');
      if (wouldCreateCollectionCycle(id, data.parentId, parents))
        throw new BadRequestException('폴더 순환 구조는 만들 수 없습니다.');
      if (collectionDepth(data.parentId, parents) >= 2)
        throw new BadRequestException('최대 2단계 폴더만 지원합니다.');
    }
    return this.prisma.collection.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        icon: data.icon,
        color: data.color,
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      },
      include: { items: true },
    });
  }

  async addItem(
    userId: string,
    collectionId: string,
    item: { itemType: CollectionItemType; targetId: string; label?: string },
  ) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.deletedAt)
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    if (collection.userId !== userId) throw new ForbiddenException();
    const position = await this.prisma.collectionItem.count({ where: { collectionId } });
    return this.prisma.collectionItem.create({ data: { ...item, collectionId, position } });
  }

  async reorder(userId: string, ids: string[]) {
    const count = await this.prisma.collection.count({
      where: { id: { in: ids }, userId, deletedAt: null },
    });
    if (count !== ids.length)
      throw new ForbiddenException('다른 사용자의 폴더는 이동할 수 없습니다.');
    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.collection.update({ where: { id }, data: { position } }),
      ),
    );
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.deletedAt)
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    if (collection.userId !== userId) throw new ForbiddenException();
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.collection.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.collection.updateMany({
        where: { parentId: id, userId },
        data: { deletedAt: now },
      }),
    ]);
    return { ok: true };
  }
}
