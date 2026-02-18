import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取活跃 banner 列表
   */
  async findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
      include: {
        hotel: {
          select: {
            id: true,
            nameZh: true,
            nameEn: true,
            city: true,
            minPrice: true,
          },
        },
      },
    });
  }
}
