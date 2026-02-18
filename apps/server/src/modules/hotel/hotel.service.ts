import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HotelService {
  constructor(private prisma: PrismaService) {}

  /**
   * 搜索酒店列表（公开接口）
   */
  async search(params: {
    keyword?: string;
    city?: string;
    starLevel?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      keyword,
      city,
      starLevel,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10,
    } = params;

    const where: Prisma.HotelWhereInput = {
      status: 'APPROVED', // 只展示已上线的酒店
    };

    // keyword 模糊搜索：nameZh / nameEn / city
    if (keyword) {
      where.OR = [
        { nameZh: { contains: keyword } },
        { nameEn: { contains: keyword } },
        { city: { contains: keyword } },
      ];
    }

    if (city) {
      where.city = city;
    }

    if (starLevel) {
      where.starLevel = starLevel;
    }

    if ((minPrice !== undefined && !isNaN(minPrice)) || (maxPrice !== undefined && !isNaN(maxPrice))) {
      where.minPrice = {};
      if (minPrice !== undefined && !isNaN(minPrice)) {
        where.minPrice.gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        where.minPrice.lte = Number(maxPrice);
      }
    }

    // 排序映射
    const orderByMap: Record<string, Prisma.HotelOrderByWithRelationInput> = {
      price: { minPrice: sortOrder === 'asc' ? 'asc' : 'desc' },
      starLevel: { starLevel: sortOrder === 'asc' ? 'asc' : 'desc' },
      createdAt: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
    };
    const orderBy = orderByMap[sortBy] || orderByMap.createdAt;

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          images: { orderBy: { sort: 'asc' } },
          roomTypes: { select: { id: true, name: true, basePrice: true } },
          promotions: true,
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
   * 获取酒店详情
   */
  async findOne(id: number) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sort: 'asc' } },
        roomTypes: {
          include: { priceRules: true },
        },
        nearbySpots: true,
        promotions: true,
        merchant: {
          select: { id: true, username: true },
        },
      },
    });
    if (!hotel) {
      throw new NotFoundException('酒店不存在');
    }
    return hotel;
  }

  /**
   * 创建酒店（商户）
   */
  async create(
    merchantId: number,
    data: {
      nameZh: string;
      nameEn: string;
      address: string;
      city: string;
      starLevel: number;
      description: string;
      phone: string;
      images?: { url: string; sort: number; isCover: boolean }[];
      nearbySpots?: {
        type: string;
        name: string;
        distance: string;
      }[];
    },
  ) {
    const { images, nearbySpots, ...hotelData } = data;

    return this.prisma.hotel.create({
      data: {
        ...hotelData,
        merchantId,
        status: 'DRAFT',
        images: images
          ? {
              create: images,
            }
          : undefined,
        nearbySpots: nearbySpots
          ? {
              create: nearbySpots.map((spot) => ({
                type: spot.type as 'SCENIC' | 'TRANSPORT' | 'SHOPPING',
                name: spot.name,
                distance: spot.distance,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        nearbySpots: true,
      },
    });
  }

  /**
   * 更新酒店（商户，仅 DRAFT/REJECTED 状态可编辑）
   */
  async update(
    id: number,
    merchantId: number,
    data: {
      nameZh?: string;
      nameEn?: string;
      address?: string;
      city?: string;
      starLevel?: number;
      description?: string;
      phone?: string;
      images?: { url: string; sort: number; isCover: boolean }[];
      nearbySpots?: {
        type: string;
        name: string;
        distance: string;
      }[];
    },
  ) {
    const hotel = await this.ensureOwnership(id, merchantId);

    if (!['DRAFT', 'REJECTED'].includes(hotel.status)) {
      throw new BadRequestException('当前状态不允许编辑');
    }

    const { images, nearbySpots, ...hotelData } = data;

    // 使用事务更新
    return this.prisma.$transaction(async (tx) => {
      // 更新图片（先删后建）
      if (images) {
        await tx.hotelImage.deleteMany({ where: { hotelId: id } });
        await tx.hotelImage.createMany({
          data: images.map((img) => ({ ...img, hotelId: id })),
        });
      }

      // 更新周边信息（先删后建）
      if (nearbySpots) {
        await tx.nearbySpot.deleteMany({ where: { hotelId: id } });
        await tx.nearbySpot.createMany({
          data: nearbySpots.map((spot) => ({
            hotelId: id,
            type: spot.type as 'SCENIC' | 'TRANSPORT' | 'SHOPPING',
            name: spot.name,
            distance: spot.distance,
          })),
        });
      }

      return tx.hotel.update({
        where: { id },
        data: hotelData,
        include: {
          images: { orderBy: { sort: 'asc' } },
          nearbySpots: true,
        },
      });
    });
  }

  /**
   * 删除酒店（商户，仅 DRAFT 状态可删除）
   */
  async remove(id: number, merchantId: number) {
    const hotel = await this.ensureOwnership(id, merchantId);

    if (hotel.status !== 'DRAFT') {
      throw new BadRequestException('仅草稿状态可以删除');
    }

    await this.prisma.hotel.delete({ where: { id } });
    return { success: true };
  }

  /**
   * 提交审核（DRAFT → PENDING）
   */
  async submit(id: number, merchantId: number) {
    const hotel = await this.ensureOwnership(id, merchantId);

    if (!['DRAFT', 'REJECTED'].includes(hotel.status)) {
      throw new BadRequestException('当前状态不允许提交审核');
    }

    return this.prisma.hotel.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  /**
   * 获取我的酒店列表（商户）
   */
  async findMyHotels(
    merchantId: number,
    params: {
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const { status, page = 1, pageSize = 10 } = params;

    const where: Prisma.HotelWhereInput = { merchantId };
    if (status) {
      where.status = status as Prisma.EnumHotelStatusFilter;
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
   * 验证酒店归属权
   */
  private async ensureOwnership(hotelId: number, merchantId: number) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) {
      throw new NotFoundException('酒店不存在');
    }
    if (hotel.merchantId !== merchantId) {
      throw new ForbiddenException('没有操作该酒店的权限');
    }
    return hotel;
  }
}
