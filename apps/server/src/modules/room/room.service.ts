import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取酒店的房型列表
   */
  async findByHotel(hotelId: number) {
    return this.prisma.roomType.findMany({
      where: { hotelId },
      include: { priceRules: true },
      orderBy: { basePrice: 'asc' },
    });
  }

  /**
   * 获取房型详情
   */
  async findOne(id: number) {
    const room = await this.prisma.roomType.findUnique({
      where: { id },
      include: { priceRules: true },
    });
    if (!room) {
      throw new NotFoundException('房型不存在');
    }
    return room;
  }

  /**
   * 创建房型（需验证酒店归属）
   */
  async create(
    merchantId: number,
    data: {
      hotelId: number;
      name: string;
      bedType: string;
      area: number;
      maxGuests: number;
      basePrice: number;
      stock: number;
      description?: string;
      facilities?: string[];
      images?: string[];
    },
  ) {
    await this.ensureHotelOwnership(data.hotelId, merchantId);

    const { facilities, images, ...roomData } = data;

    const room = await this.prisma.roomType.create({
      data: {
        ...roomData,
        bedType: roomData.bedType as 'SINGLE' | 'DOUBLE' | 'TWIN' | 'KING' | 'SUITE',
        facilities: facilities ? JSON.stringify(facilities) : null,
        images: images ? JSON.stringify(images) : null,
      },
    });

    // 更新酒店 minPrice 冗余字段
    await this.updateHotelMinPrice(data.hotelId);

    return room;
  }

  /**
   * 更新房型
   */
  async update(
    id: number,
    merchantId: number,
    data: {
      name?: string;
      bedType?: string;
      area?: number;
      maxGuests?: number;
      basePrice?: number;
      stock?: number;
      description?: string;
      facilities?: string[];
      images?: string[];
    },
  ) {
    const room = await this.prisma.roomType.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('房型不存在');
    }

    await this.ensureHotelOwnership(room.hotelId, merchantId);

    const { facilities, images, ...roomData } = data;
    const updateData: Record<string, unknown> = { ...roomData };

    if (roomData.bedType) {
      updateData.bedType = roomData.bedType as 'SINGLE' | 'DOUBLE' | 'TWIN' | 'KING' | 'SUITE';
    }
    if (facilities !== undefined) {
      updateData.facilities = JSON.stringify(facilities);
    }
    if (images !== undefined) {
      updateData.images = JSON.stringify(images);
    }

    const updated = await this.prisma.roomType.update({
      where: { id },
      data: updateData,
    });

    // 更新酒店 minPrice 冗余字段
    await this.updateHotelMinPrice(room.hotelId);

    return updated;
  }

  /**
   * 删除房型
   */
  async remove(id: number, merchantId: number) {
    const room = await this.prisma.roomType.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('房型不存在');
    }

    await this.ensureHotelOwnership(room.hotelId, merchantId);

    await this.prisma.roomType.delete({ where: { id } });

    // 更新酒店 minPrice 冗余字段
    await this.updateHotelMinPrice(room.hotelId);

    return { success: true };
  }

  // ---- 价格规则 CRUD ----

  /**
   * 获取房型的价格规则列表
   */
  async findPriceRules(roomTypeId: number) {
    return this.prisma.priceRule.findMany({
      where: { roomTypeId },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * 创建价格规则
   */
  async createPriceRule(
    merchantId: number,
    data: {
      roomTypeId: number;
      type: string;
      startDate: string;
      endDate: string;
      price: number;
    },
  ) {
    const room = await this.prisma.roomType.findUnique({
      where: { id: data.roomTypeId },
    });
    if (!room) {
      throw new NotFoundException('房型不存在');
    }

    await this.ensureHotelOwnership(room.hotelId, merchantId);

    return this.prisma.priceRule.create({
      data: {
        roomTypeId: data.roomTypeId,
        type: data.type as 'WEEKEND' | 'HOLIDAY' | 'CUSTOM',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
      },
    });
  }

  /**
   * 更新价格规则
   */
  async updatePriceRule(
    id: number,
    merchantId: number,
    data: {
      type?: string;
      startDate?: string;
      endDate?: string;
      price?: number;
    },
  ) {
    const rule = await this.prisma.priceRule.findUnique({
      where: { id },
      include: { roomType: true },
    });
    if (!rule) {
      throw new NotFoundException('价格规则不存在');
    }

    await this.ensureHotelOwnership(rule.roomType.hotelId, merchantId);

    const updateData: Record<string, unknown> = {};
    if (data.type) updateData.type = data.type;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.price !== undefined) updateData.price = data.price;

    return this.prisma.priceRule.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 删除价格规则
   */
  async removePriceRule(id: number, merchantId: number) {
    const rule = await this.prisma.priceRule.findUnique({
      where: { id },
      include: { roomType: true },
    });
    if (!rule) {
      throw new NotFoundException('价格规则不存在');
    }

    await this.ensureHotelOwnership(rule.roomType.hotelId, merchantId);

    await this.prisma.priceRule.delete({ where: { id } });
    return { success: true };
  }

  // ---- 私有方法 ----

  /**
   * 更新酒店 minPrice 冗余字段
   */
  private async updateHotelMinPrice(hotelId: number) {
    const result = await this.prisma.roomType.aggregate({
      where: { hotelId },
      _min: { basePrice: true },
    });

    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { minPrice: result._min.basePrice },
    });
  }

  /**
   * 验证酒店归属权
   */
  private async ensureHotelOwnership(hotelId: number, merchantId: number) {
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
