export enum HotelStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OFFLINE = 'OFFLINE',
}

export enum StarLevel {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export enum NearbySpotType {
  SCENIC = 'SCENIC',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
}

export interface Hotel {
  id: number;
  nameZh: string;
  nameEn: string;
  address: string;
  city: string;
  starLevel: StarLevel;
  status: HotelStatus;
  description: string;
  phone: string;
  minPrice: number | null;
  merchantId: number;
  images: HotelImage[];
  nearbySpots: NearbySpot[];
  promotions: Promotion[];
  createdAt: string;
  updatedAt: string;
}

export interface HotelImage {
  id: number;
  hotelId: number;
  url: string;
  sort: number;
  isCover: boolean;
}

export interface NearbySpot {
  id: number;
  hotelId: number;
  type: NearbySpotType;
  name: string;
  distance: string;
}

export interface Promotion {
  id: number;
  hotelId: number;
  type: 'DISCOUNT' | 'REDUCTION';
  discountRate: number | null;
  reduceAmount: number | null;
  minAmount: number | null;
  startDate: string;
  endDate: string;
}

export interface CreateHotelDto {
  nameZh: string;
  nameEn: string;
  address: string;
  city: string;
  starLevel: StarLevel;
  description: string;
  phone: string;
}

export interface UpdateHotelDto extends Partial<CreateHotelDto> {}

export interface HotelSearchParams {
  keyword?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  starLevel?: StarLevel;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'starLevel' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
