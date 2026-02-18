import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { HotelService } from './hotel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ---- DTOs ----

class HotelImageDto {
  @ApiProperty() @IsString() url: string;
  @ApiProperty() @IsNumber() sort: number;
  @ApiProperty() @IsBoolean() isCover: boolean;
}

class NearbySpotDto {
  @ApiProperty() @IsEnum(['SCENIC', 'TRANSPORT', 'SHOPPING']) type: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() distance: string;
}

class CreateHotelDto {
  @ApiProperty({ description: '酒店中文名' })
  @IsString()
  nameZh: string;

  @ApiProperty({ description: '酒店英文名' })
  @IsString()
  nameEn: string;

  @ApiProperty({ description: '地址' })
  @IsString()
  address: string;

  @ApiProperty({ description: '城市' })
  @IsString()
  city: string;

  @ApiProperty({ description: '星级', enum: [2, 3, 4, 5] })
  @IsNumber()
  @Min(2)
  @Max(5)
  starLevel: number;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '联系电话' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: '酒店图片', type: [HotelImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelImageDto)
  images?: HotelImageDto[];

  @ApiPropertyOptional({ description: '周边信息', type: [NearbySpotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NearbySpotDto)
  nearbySpots?: NearbySpotDto[];
}

class UpdateHotelDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nameZh?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(2) @Max(5) starLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional({ type: [HotelImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelImageDto)
  images?: HotelImageDto[];

  @ApiPropertyOptional({ type: [NearbySpotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NearbySpotDto)
  nearbySpots?: NearbySpotDto[];
}

@ApiTags('酒店')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Get()
  @ApiOperation({ summary: '搜索酒店列表（公开）' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'starLevel', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'starLevel', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  search(
    @Query('keyword') keyword?: string,
    @Query('city') city?: string,
    @Query('starLevel') starLevel?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.hotelService.search({
      keyword,
      city,
      starLevel: starLevel ? Number(starLevel) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      sortOrder,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的酒店列表（商户）' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findMyHotels(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const user = req.user as { id: number };
    return this.hotelService.findMyHotels(user.id, { status, page, pageSize });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取酒店详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hotelService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建酒店（商户）' })
  create(@Req() req: Request, @Body() dto: CreateHotelDto) {
    const user = req.user as { id: number };
    return this.hotelService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新酒店（商户）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: UpdateHotelDto,
  ) {
    const user = req.user as { id: number };
    return this.hotelService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除酒店（商户）' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { id: number };
    return this.hotelService.remove(id, user.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交审核（商户）' })
  submit(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { id: number };
    return this.hotelService.submit(id, user.id);
  }
}
