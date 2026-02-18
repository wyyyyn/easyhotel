export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TWIN = 'TWIN',
  KING = 'KING',
  SUITE = 'SUITE',
}

export interface RoomType {
  id: number;
  hotelId: number;
  name: string;
  bedType: BedType;
  area: number;
  maxGuests: number;
  basePrice: number;
  stock: number;
  description: string;
  facilities: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypeDto {
  hotelId: number;
  name: string;
  bedType: BedType;
  area: number;
  maxGuests: number;
  basePrice: number;
  stock: number;
  description?: string;
  facilities?: string[];
}

export interface UpdateRoomTypeDto extends Partial<Omit<CreateRoomTypeDto, 'hotelId'>> {}

export interface PriceRule {
  id: number;
  roomTypeId: number;
  type: 'WEEKEND' | 'HOLIDAY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  price: number;
}

export interface CreatePriceRuleDto {
  roomTypeId: number;
  type: 'WEEKEND' | 'HOLIDAY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  price: number;
}
