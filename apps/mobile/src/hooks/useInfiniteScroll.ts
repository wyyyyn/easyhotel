import { useState, useCallback, useRef } from 'react';
import Taro, { useReachBottom } from '@tarojs/taro';

interface UseInfiniteScrollOptions<T> {
  /** 获取数据的异步函数，page 从 1 开始 */
  fetchData: (page: number) => Promise<{
    items: T[];
    total: number;
    totalPages: number;
  }>;
  /** 每页条数，默认 10 */
  pageSize?: number;
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize: _pageSize = 10,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    pageRef.current = 1;

    try {
      const res = await fetchData(1);
      setData(res.items);
      setTotal(res.total);
      setHasMore(1 < res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await fetchData(nextPage);
      setData((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setHasMore(nextPage < res.totalPages);
      pageRef.current = nextPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载更多失败');
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [fetchData, hasMore]);

  // 小程序环境使用 onReachBottom
  useReachBottom(() => {
    if (hasMore && !loadingRef.current) {
      loadMore();
    }
  });

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    refresh,
    loadMore,
  };
}
