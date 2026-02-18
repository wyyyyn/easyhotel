import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannerService } from './banner.service';

@ApiTags('轮播图')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: '获取活跃轮播图列表（公开）' })
  findActive() {
    return this.bannerService.findActive();
  }
}
