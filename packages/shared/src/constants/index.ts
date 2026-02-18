import { StarLevel, HotelStatus, BedType, NearbySpotType } from '../types';

export const STAR_LEVEL_LABELS: Record<StarLevel, string> = {
  [StarLevel.TWO]: '二星级',
  [StarLevel.THREE]: '三星级',
  [StarLevel.FOUR]: '四星级',
  [StarLevel.FIVE]: '五星级',
};

export const HOTEL_STATUS_LABELS: Record<HotelStatus, string> = {
  [HotelStatus.DRAFT]: '草稿',
  [HotelStatus.PENDING]: '待审核',
  [HotelStatus.APPROVED]: '已上线',
  [HotelStatus.REJECTED]: '已拒绝',
  [HotelStatus.OFFLINE]: '已下线',
};

export const BED_TYPE_LABELS: Record<BedType, string> = {
  [BedType.SINGLE]: '单人床',
  [BedType.DOUBLE]: '大床',
  [BedType.TWIN]: '双床',
  [BedType.KING]: '特大床',
  [BedType.SUITE]: '套房',
};

export const NEARBY_SPOT_TYPE_LABELS: Record<NearbySpotType, string> = {
  [NearbySpotType.SCENIC]: '景点',
  [NearbySpotType.TRANSPORT]: '交通',
  [NearbySpotType.SHOPPING]: '购物',
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
