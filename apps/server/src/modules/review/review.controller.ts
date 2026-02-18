import {
  Controller,
  Get,
  Post,
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
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class ReviewActionDto {
  @ApiProperty({ description: '酒店ID' })
  @IsNumber()
  hotelId: number;

  @ApiProperty({
    description: '操作',
    enum: ['APPROVE', 'REJECT', 'OFFLINE', 'ONLINE'],
  })
  @IsEnum(['APPROVE', 'REJECT', 'OFFLINE', 'ONLINE'])
  action: string;

  @ApiPropertyOptional({ description: '原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('审核管理')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: '获取酒店审核列表（管理员）' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.reviewService.findAll({ status, keyword, page, pageSize });
  }

  @Post('action')
  @ApiOperation({ summary: '执行审核操作（管理员）' })
  action(@Req() req: Request, @Body() dto: ReviewActionDto) {
    const user = req.user as { id: number };
    return this.reviewService.action(user.id, dto);
  }

  @Get(':hotelId/logs')
  @ApiOperation({ summary: '获取酒店审核日志（管理员）' })
  findLogs(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.reviewService.findLogs(hotelId);
  }
}
