import type { RoomType, CreateRoomTypeDto, UpdateRoomTypeDto, PriceRule, CreatePriceRuleDto } from '@easyhotel/shared';
import { http } from './request';

export const roomApi = {
  create: (data: CreateRoomTypeDto) => http.post<RoomType>('/rooms', data),

  update: (id: number, data: UpdateRoomTypeDto) => http.put<RoomType>(`/rooms/${id}`, data),

  delete: (id: number) => http.delete<void>(`/rooms/${id}`),

  /** 价格规则 */
  getPriceRules: (roomTypeId: number) =>
    http.get<PriceRule[]>(`/rooms/${roomTypeId}/price-rules`),

  createPriceRule: (data: CreatePriceRuleDto) =>
    http.post<PriceRule>('/rooms/price-rules', data),

  deletePriceRule: (id: number) => http.delete<void>(`/rooms/price-rules/${id}`),
};
