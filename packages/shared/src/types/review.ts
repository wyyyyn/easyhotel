import { HotelStatus } from './hotel';

export interface ReviewLog {
  id: number;
  hotelId: number;
  reviewerId: number;
  fromStatus: HotelStatus;
  toStatus: HotelStatus;
  reason: string | null;
  createdAt: string;
}

export interface ReviewActionDto {
  hotelId: number;
  action: 'APPROVE' | 'REJECT' | 'OFFLINE' | 'ONLINE';
  reason?: string;
}
