import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { hotelApi } from '@easyhotel/api-client';
import {
  formatPrice,
  STAR_LEVEL_LABELS,
  DEFAULT_PAGE_SIZE,
} from '@easyhotel/shared';
import type { Hotel, StarLevel, HotelSearchParams } from '@easyhotel/shared';
import { useSearchStore } from '../../store/useSearchStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './index.scss';

type SortType = 'default' | 'price_asc' | 'star_desc';
type StarFilter = 'all' | '2' | '3' | '4' | '5';

interface PriceRange {
  label: string;
  min?: number;
  max?: number;
}

const PRICE_RANGES: PriceRange[] = [
  { label: '不限' },
  { label: '¥0-200', min: 0, max: 200 },
  { label: '¥200-500', min: 200, max: 500 },
  { label: '¥500-1000', min: 500, max: 1000 },
  { label: '¥1000+', min: 1000 },
];

function ListPage() {
  const router = useRouter();
  const storeState = useSearchStore();

  // 从 URL 参数或 store 获取搜索条件
  const searchCity =
    decodeURIComponent(router.params.city || '') || storeState.city;
  const searchCheckIn = router.params.checkIn || storeState.checkIn;
  const searchCheckOut = router.params.checkOut || storeState.checkOut;
  const searchKeyword =
    decodeURIComponent(router.params.keyword || '') || storeState.keyword;

  // 筛选状态
  const [sortType, setSortType] = useState<SortType>('default');
  const [starFilter, setStarFilter] = useState<StarFilter>('all');
  const [priceRange, setPriceRange] = useState<PriceRange>(PRICE_RANGES[0]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'sort' | 'star' | 'price' | null
  >(null);

  // 构建搜索参数
  const buildParams = useCallback(
    (page: number): HotelSearchParams => {
      const params: HotelSearchParams = {
        city: searchCity,
        checkIn: searchCheckIn,
        checkOut: searchCheckOut,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      };

      if (searchKeyword) params.keyword = searchKeyword;

      // 排序
      if (sortType === 'price_asc') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (sortType === 'star_desc') {
        params.sortBy = 'starLevel';
        params.sortOrder = 'desc';
      }

      // 星级筛选
      if (starFilter !== 'all') {
        params.starLevel = Number(starFilter) as StarLevel;
      }

      // 价格范围
      if (priceRange.min !== undefined) params.minPrice = priceRange.min;
      if (priceRange.max !== undefined) params.maxPrice = priceRange.max;

      return params;
    },
    [
      searchCity,
      searchCheckIn,
      searchCheckOut,
      searchKeyword,
      sortType,
      starFilter,
      priceRange,
    ],
  );

  const fetchData = useCallback(
    async (page: number) => {
      const params = buildParams(page);
      const res = await hotelApi.search(params);
      return {
        items: res.items,
        total: res.total,
        totalPages: res.totalPages,
      };
    },
    [buildParams],
  );

  const {
    data: hotels,
    loading,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
  } = useInfiniteScroll<Hotel>({ fetchData });

  // 首次加载和筛选条件变化时刷新
  useEffect(() => {
    refresh();
  }, [sortType, starFilter, priceRange, refresh]);

  // 切换筛选面板
  const toggleFilter = useCallback(
    (type: 'sort' | 'star' | 'price') => {
      if (activeFilter === type) {
        setActiveFilter(null);
        setShowFilterPanel(false);
      } else {
        setActiveFilter(type);
        setShowFilterPanel(true);
      }
    },
    [activeFilter],
  );

  const closeFilter = useCallback(() => {
    setActiveFilter(null);
    setShowFilterPanel(false);
  }, []);

  // 排序选项
  const sortOptions: { value: SortType; label: string }[] = useMemo(
    () => [
      { value: 'default', label: '默认排序' },
      { value: 'price_asc', label: '价格低到高' },
      { value: 'star_desc', label: '星级从高到低' },
    ],
    [],
  );

  // 星级选项
  const starOptions: { value: StarFilter; label: string }[] = useMemo(
    () => [
      { value: 'all', label: '全部' },
      { value: '5', label: '五星级' },
      { value: '4', label: '四星级' },
      { value: '3', label: '三星级' },
      { value: '2', label: '二星级' },
    ],
    [],
  );

  // 排序标签显示
  const sortLabel = useMemo(() => {
    return sortOptions.find((s) => s.value === sortType)?.label || '排序';
  }, [sortType, sortOptions]);

  // 点击酒店卡片
  const handleHotelClick = useCallback((hotelId: number) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${hotelId}`,
    });
  }, []);

  // H5 环境下的滚动加载
  const handleScrollToLower = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  return (
    <View className="list-page">
      {/* 顶部筛选栏 */}
      <View className="filter-bar">
        <View
          className={`filter-bar__item ${activeFilter === 'sort' ? 'filter-bar__item--active' : ''}`}
          onClick={() => toggleFilter('sort')}
        >
          <Text className="filter-bar__text">{sortLabel}</Text>
          <Text className="filter-bar__icon">▾</Text>
        </View>
        <View
          className={`filter-bar__item ${activeFilter === 'star' ? 'filter-bar__item--active' : ''}`}
          onClick={() => toggleFilter('star')}
        >
          <Text className="filter-bar__text">
            {starFilter === 'all' ? '星级' : starOptions.find((s) => s.value === starFilter)?.label}
          </Text>
          <Text className="filter-bar__icon">▾</Text>
        </View>
        <View
          className={`filter-bar__item ${activeFilter === 'price' ? 'filter-bar__item--active' : ''}`}
          onClick={() => toggleFilter('price')}
        >
          <Text className="filter-bar__text">
            {priceRange.label === '不限' ? '价格' : priceRange.label}
          </Text>
          <Text className="filter-bar__icon">▾</Text>
        </View>
      </View>

      {/* 筛选下拉面板 */}
      {showFilterPanel && (
        <View className="filter-panel-mask" onClick={closeFilter}>
          <View
            className="filter-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {activeFilter === 'sort' &&
              sortOptions.map((opt) => (
                <View
                  key={opt.value}
                  className={`filter-panel__item ${sortType === opt.value ? 'filter-panel__item--active' : ''}`}
                  onClick={() => {
                    setSortType(opt.value);
                    closeFilter();
                  }}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}

            {activeFilter === 'star' &&
              starOptions.map((opt) => (
                <View
                  key={opt.value}
                  className={`filter-panel__item ${starFilter === opt.value ? 'filter-panel__item--active' : ''}`}
                  onClick={() => {
                    setStarFilter(opt.value);
                    closeFilter();
                  }}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}

            {activeFilter === 'price' &&
              PRICE_RANGES.map((range) => (
                <View
                  key={range.label}
                  className={`filter-panel__item ${priceRange.label === range.label ? 'filter-panel__item--active' : ''}`}
                  onClick={() => {
                    setPriceRange(range);
                    closeFilter();
                  }}
                >
                  <Text>{range.label}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* 结果数量 */}
      <View className="result-count">
        <Text className="result-count__text">
          共找到 {total} 家酒店
        </Text>
      </View>

      {/* 酒店列表 */}
      <ScrollView
        className="hotel-list"
        scrollY
        enhanced
        showScrollbar={false}
        onScrollToLower={handleScrollToLower}
      >
        {loading ? (
          // 骨架屏
          <View className="skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="hotel-item hotel-item--skeleton">
                <View className="hotel-item__img skeleton-block" />
                <View className="hotel-item__content">
                  <View className="skeleton-line skeleton-line--title" />
                  <View className="skeleton-line skeleton-line--short" />
                  <View className="skeleton-line skeleton-line--medium" />
                  <View className="skeleton-line skeleton-line--price" />
                </View>
              </View>
            ))}
          </View>
        ) : hotels.length > 0 ? (
          <View className="hotel-list__inner">
            {hotels.map((hotel) => (
              <View
                key={hotel.id}
                className="hotel-item"
                onClick={() => handleHotelClick(hotel.id)}
              >
                <Image
                  className="hotel-item__img"
                  src={
                    hotel.images?.[0]?.url ||
                    'https://via.placeholder.com/300x200?text=Hotel'
                  }
                  mode="aspectFill"
                />
                <View className="hotel-item__content">
                  <Text className="hotel-item__name ellipsis">
                    {hotel.nameZh}
                  </Text>
                  <View className="hotel-item__star-row">
                    <Text className="hotel-item__star">
                      {STAR_LEVEL_LABELS[hotel.starLevel as StarLevel]}
                    </Text>
                  </View>
                  <Text className="hotel-item__address ellipsis">
                    {hotel.address}
                  </Text>
                  <View className="hotel-item__bottom">
                    {hotel.minPrice !== null && (
                      <View className="hotel-item__price-row">
                        <Text className="hotel-item__price">
                          {formatPrice(hotel.minPrice)}
                        </Text>
                        <Text className="hotel-item__price-unit">起/晚</Text>
                      </View>
                    )}
                    {hotel.promotions?.length > 0 && (
                      <View className="hotel-item__tags">
                        {hotel.promotions.map((promo) => (
                          <View key={promo.id} className="hotel-item__tag">
                            <Text className="hotel-item__tag-text">
                              {promo.type === 'DISCOUNT'
                                ? `${(promo.discountRate! * 10).toFixed(1)}折`
                                : `满${promo.minAmount}减${promo.reduceAmount}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* 加载更多 */}
            {loadingMore && (
              <View className="load-more">
                <Text className="load-more__text">加载中...</Text>
              </View>
            )}
            {!hasMore && hotels.length > 0 && (
              <View className="load-more">
                <Text className="load-more__text">没有更多了</Text>
              </View>
            )}
          </View>
        ) : (
          // 空状态
          <View className="empty-state">
            <Text className="empty-state__icon">🏨</Text>
            <Text className="empty-state__title">未找到相关酒店</Text>
            <Text className="empty-state__desc">
              试试更换搜索条件或筛选条件
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default ListPage;
