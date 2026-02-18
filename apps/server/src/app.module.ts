import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HotelModule } from './modules/hotel/hotel.module';
import { RoomModule } from './modules/room/room.module';
import { ReviewModule } from './modules/review/review.module';
import { UploadModule } from './modules/upload/upload.module';
import { BannerModule } from './modules/banner/banner.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HotelModule,
    RoomModule,
    ReviewModule,
    UploadModule,
    BannerModule,
  ],
})
export class AppModule {}
