import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HotelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// 审核状态流转规则
const STATUS_TRANSITIONS: Record<string, { from: HotelStatus[]; to: HotelStatus }> = {
  APPROVE: { from: ['PENDING'], to: 'APPROVED' },
  REJECT: { from: ['PENDING'], to: 'REJECTED' },
  OFFLINE: { from: ['APPROVED'], to: 'OFFLINE' },
  ONLINE: { from: ['OFFLINE'], to: 'APPROVED' },
};

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取待审核/全部酒店列表（管理员）
   */
  async findAll(params: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, keyword, page = 1, pageSize = 10 } = params;

    const where: Prisma.HotelWhereInput = {};
    if (status) {
      where.status = status as HotelStatus;
    }
    if (keyword) {
      where.OR = [
        { nameZh: { contains: keyword } },
        { nameEn: { contains: keyword } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          images: { orderBy: { sort: 'asc' }, take: 1 },
          merchant: { select: { id: true, username: true } },
          _count: { select: { roomTypes: true } },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 执行审核操作
   */
  async action(
    reviewerId: number,
    data: {
      hotelId: number;
      action: string;
      reason?: string;
    },
  ) {
    const { hotelId, action, reason } = data;

    const transition = STATUS_TRANSITIONS[action];
    if (!transition) {
      throw new BadRequestException(`无效的操作: ${action}`);
    }

    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) {
      throw new NotFoundException('酒店不存在');
    }

    if (!transition.from.includes(hotel.status)) {
      throw new BadRequestException(
        `当前状态 ${hotel.status} 不允许执行 ${action} 操作`,
      );
    }

    // 使用事务：更新状态 + 记录审核日志
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hotel.update({
        where: { id: hotelId },
        data: { status: transition.to },
      });

      await tx.reviewLog.create({
        data: {
          hotelId,
          reviewerId,
          fromStatus: hotel.status,
          toStatus: transition.to,
          reason: reason || null,
        },
      });

      return updated;
    });
  }

  /**
   * 获取酒店的审核日志
   */
  async findLogs(hotelId: number) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) {
      throw new NotFoundException('酒店不存在');
    }

    return this.prisma.reviewLog.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, username: true } },
      },
    });
  }
}
