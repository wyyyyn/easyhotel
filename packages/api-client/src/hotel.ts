import type {
  Hotel,
  CreateHotelDto,
  UpdateHotelDto,
  HotelSearchParams,
  PaginatedResponse,
  RoomType,
  Banner,
} from '@easyhotel/shared';
import { http } from './request';

export const hotelApi = {
  /** 搜索酒店列表（面向用户） */
  search: (params: HotelSearchParams) =>
    http.get<PaginatedResponse<Hotel>>('/hotels', params as Record<string, string | number>),

  /** 获取酒店详情 */
  getDetail: (id: number) => http.get<Hotel>(`/hotels/${id}`),

  /** 创建酒店（商户） */
  create: (data: CreateHotelDto) => http.post<Hotel>('/hotels', data),

  /** 更新酒店（商户） */
  update: (id: number, data: UpdateHotelDto) => http.put<Hotel>(`/hotels/${id}`, data),

  /** 删除酒店（商户） */
  delete: (id: number) => http.delete<void>(`/hotels/${id}`),

  /** 提交审核 */
  submitReview: (id: number) => http.post<void>(`/hotels/${id}/submit`),

  /** 获取我的酒店列表（商户） */
  getMyHotels: (params?: { page?: number; pageSize?: number; status?: string }) =>
    http.get<PaginatedResponse<Hotel>>(
      '/hotels/my',
      params as Record<string, string | number>,
    ),

  /** 获取酒店房型列表 */
  getRoomTypes: (hotelId: number) => http.get<RoomType[]>(`/hotels/${hotelId}/rooms`),

  /** 获取活跃 Banner */
  getBanners: () => http.get<Banner[]>('/banners'),
};
