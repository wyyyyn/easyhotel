import type {
  Hotel,
  ReviewActionDto,
  ReviewLog,
  PaginatedResponse,
} from '@easyhotel/shared';
import { http } from './request';

export const adminApi = {
  /** 获取待审核酒店列表 */
  getReviewList: (params?: { page?: number; pageSize?: number; status?: string }) =>
    http.get<PaginatedResponse<Hotel>>(
      '/admin/reviews',
      params as Record<string, string | number>,
    ),

  /** 审核操作：通过/拒绝/下线/上线 */
  reviewAction: (data: ReviewActionDto) => http.post<void>('/admin/reviews/action', data),

  /** 获取审核日志 */
  getReviewLogs: (hotelId: number) =>
    http.get<ReviewLog[]>(`/admin/reviews/${hotelId}/logs`),
};
