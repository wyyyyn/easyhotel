import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ---- DTOs ----

class CreateRoomTypeDto {
  @ApiProperty({ description: '酒店ID' })
  @IsNumber()
  hotelId: number;

  @ApiProperty({ description: '房型名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '床型', enum: ['SINGLE', 'DOUBLE', 'TWIN', 'KING', 'SUITE'] })
  @IsEnum(['SINGLE', 'DOUBLE', 'TWIN', 'KING', 'SUITE'])
  bedType: string;

  @ApiProperty({ description: '面积（平方米）' })
  @IsNumber()
  @Min(0)
  area: number;

  @ApiProperty({ description: '最大入住人数' })
  @IsNumber()
  @Min(1)
  maxGuests: number;

  @ApiProperty({ description: '基础价格' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ description: '库存' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '设施列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];

  @ApiPropertyOptional({ description: '图片URL列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

class UpdateRoomTypeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: ['SINGLE', 'DOUBLE', 'TWIN', 'KING', 'SUITE'] })
  @IsOptional() @IsEnum(['SINGLE', 'DOUBLE', 'TWIN', 'KING', 'SUITE']) bedType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) area?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxGuests?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) basePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) facilities?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
}

class CreatePriceRuleDto {
  @ApiProperty({ description: '房型ID' })
  @IsNumber()
  roomTypeId: number;

  @ApiProperty({ description: '规则类型', enum: ['WEEKEND', 'HOLIDAY', 'CUSTOM'] })
  @IsEnum(['WEEKEND', 'HOLIDAY', 'CUSTOM'])
  type: string;

  @ApiProperty({ description: '开始日期', example: '2024-01-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期', example: '2024-12-31' })
  @IsString()
  endDate: string;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  @Min(0)
  price: number;
}

class UpdatePriceRuleDto {
  @ApiPropertyOptional({ enum: ['WEEKEND', 'HOLIDAY', 'CUSTOM'] })
  @IsOptional() @IsEnum(['WEEKEND', 'HOLIDAY', 'CUSTOM']) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) price?: number;
}

@ApiTags('房型')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('hotel/:hotelId')
  @ApiOperation({ summary: '获取酒店房型列表' })
  findByHotel(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.roomService.findByHotel(hotelId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取房型详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建房型（商户）' })
  create(@Req() req: Request, @Body() dto: CreateRoomTypeDto) {
    const user = req.user as { id: number };
    return this.roomService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新房型（商户）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    const user = req.user as { id: number };
    return this.roomService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除房型（商户）' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { id: number };
    return this.roomService.remove(id, user.id);
  }

  // ---- 价格规则 ----

  @Get(':roomTypeId/price-rules')
  @ApiOperation({ summary: '获取价格规则列表' })
  findPriceRules(@Param('roomTypeId', ParseIntPipe) roomTypeId: number) {
    return this.roomService.findPriceRules(roomTypeId);
  }

  @Post('price-rules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建价格规则（商户）' })
  createPriceRule(@Req() req: Request, @Body() dto: CreatePriceRuleDto) {
    const user = req.user as { id: number };
    return this.roomService.createPriceRule(user.id, dto);
  }

  @Put('price-rules/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新价格规则（商户）' })
  updatePriceRule(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: UpdatePriceRuleDto,
  ) {
    const user = req.user as { id: number };
    return this.roomService.updatePriceRule(id, user.id, dto);
  }

  @Delete('price-rules/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除价格规则（商户）' })
  removePriceRule(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { id: number };
    return this.roomService.removePriceRule(id, user.id);
  }
}
