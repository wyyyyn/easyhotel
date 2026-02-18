import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Input,
  Swiper,
  SwiperItem,
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import { hotelApi } from '@easyhotel/api-client';
import {
  formatDate,
  calcNights,
  formatPrice,
  STAR_LEVEL_LABELS,
} from '@easyhotel/shared';
import type { Hotel, Banner, StarLevel } from '@easyhotel/shared';
import Calendar from '../../components/Calendar';
import { useSearchStore } from '../../store/useSearchStore';
import { useLocation } from '../../hooks/useLocation';
import './index.scss';

function HomePage() {
  const {
    city,
    checkIn,
    checkOut,
    keyword,
    searchHistory,
    setCity,
    setCheckIn,
    setCheckOut,
    setKeyword,
    setSearch,
    addHistory,
    clearHistory,
  } = useSearchStore();

  const { city: locatedCity } = useLocation();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [hotHotels, setHotHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // 自动设置定位城市
  useEffect(() => {
    if (locatedCity && city === '上海') {
      setCity(locatedCity);
    }
  }, [locatedCity, city, setCity]);

  // 获取 banner 和热门酒店
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannersRes, hotelsRes] = await Promise.all([
          hotelApi.getBanners().catch(() => [] as Banner[]),
          hotelApi
            .search({ city, pageSize: 6, sortBy: 'createdAt', sortOrder: 'desc' })
            .catch(() => ({ items: [] as Hotel[], total: 0, page: 1, pageSize: 6, totalPages: 0 })),
        ]);
        setBanners(bannersRes);
        setHotHotels(hotelsRes.items);
      } catch (err) {
        console.error('首页数据加载失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [city]);

  const nights = calcNights(checkIn, checkOut);

  // 格式化日期显示（MM月DD日）
  const formatDisplayDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }, []);

  // 日历确认
  const handleCalendarConfirm = useCallback(
    (range: { checkIn: string; checkOut: string }) => {
      setCheckIn(range.checkIn);
      setCheckOut(range.checkOut);
      setCalendarVisible(false);
    },
    [setCheckIn, setCheckOut],
  );

  // 搜索
  const handleSearch = useCallback(() => {
    if (keyword.trim()) {
      addHistory(keyword.trim());
    }
    Taro.navigateTo({
      url: `/pages/list/index?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&keyword=${encodeURIComponent(keyword)}`,
    });
  }, [city, checkIn, checkOut, keyword, addHistory]);

  // 点击历史搜索
  const handleHistoryClick = useCallback(
    (kw: string) => {
      setKeyword(kw);
      setSearch({ keyword: kw });
      Taro.navigateTo({
        url: `/pages/list/index?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&keyword=${encodeURIComponent(kw)}`,
      });
    },
    [city, checkIn, checkOut, setKeyword, setSearch],
  );

  // 点击酒店卡片
  const handleHotelClick = useCallback((hotelId: number) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${hotelId}`,
    });
  }, []);

  // Banner 点击
  const handleBannerClick = useCallback((banner: Banner) => {
    if (banner.hotelId) {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${banner.hotelId}`,
      });
    }
  }, []);

  return (
    <View className="home">
      {/* 搜索区域 */}
      <View className="search-section">
        <View className="search-card">
          {/* 城市选择 */}
          <View className="search-card__row" onClick={() => {
            // TODO: 城市选择弹窗
            Taro.showActionSheet({
              itemList: ['上海', '北京', '广州', '深圳', '杭州', '成都'],
            }).then((res) => {
              const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都'];
              setCity(cities[res.tapIndex]);
            }).catch(() => {});
          }}>
            <View className="search-card__label">
              <Text>城市</Text>
            </View>
            <View className="search-card__value">
              <Text className="search-card__city">{city}</Text>
              <Text className="search-card__arrow">›</Text>
            </View>
          </View>

          {/* 日期选择 */}
          <View
            className="search-card__row"
            onClick={() => setCalendarVisible(true)}
          >
            <View className="search-card__date-group">
              <View className="search-card__date-item">
                <Text className="search-card__date-label">入住</Text>
                <Text className="search-card__date-value">
                  {formatDisplayDate(checkIn)}
                </Text>
              </View>
              <View className="search-card__nights">
                <Text className="search-card__nights-text">共{nights}晚</Text>
              </View>
              <View className="search-card__date-item">
                <Text className="search-card__date-label">退房</Text>
                <Text className="search-card__date-value">
                  {formatDisplayDate(checkOut)}
                </Text>
              </View>
            </View>
          </View>

          {/* 关键词输入 */}
          <View className="search-card__row search-card__row--input">
            <Input
              className="search-card__input"
              placeholder="搜索酒店名称/地址"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>

          {/* 搜索按钮 */}
          <View className="search-card__btn" onClick={handleSearch}>
            <Text className="search-card__btn-text">搜索酒店</Text>
          </View>
        </View>
      </View>

      {/* Banner 轮播 */}
      {banners.length > 0 && (
        <View className="banner-section">
          <Swiper
            className="banner-swiper"
            indicatorDots
            indicatorColor="rgba(255,255,255,0.4)"
            indicatorActiveColor="#fff"
            autoplay
            circular
            interval={4000}
          >
            {banners.map((banner) => (
              <SwiperItem
                key={banner.id}
                onClick={() => handleBannerClick(banner)}
              >
                <Image
                  className="banner-image"
                  src={banner.imageUrl}
                  mode="aspectFill"
                />
              </SwiperItem>
            ))}
          </Swiper>
        </View>
      )}

      {/* 热门推荐 */}
      <View className="section">
        <View className="section__header">
          <Text className="section__title">热门推荐</Text>
          <View className="section__more" onClick={() => handleSearch()}>
            <Text className="section__more-text">查看更多 ›</Text>
          </View>
        </View>

        {loading ? (
          <View className="hotel-grid">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="hotel-card hotel-card--skeleton">
                <View className="hotel-card__img skeleton-block" />
                <View className="hotel-card__info">
                  <View className="skeleton-line skeleton-line--title" />
                  <View className="skeleton-line skeleton-line--short" />
                  <View className="skeleton-line skeleton-line--price" />
                </View>
              </View>
            ))}
          </View>
        ) : hotHotels.length > 0 ? (
          <View className="hotel-grid">
            {hotHotels.map((hotel) => (
              <View
                key={hotel.id}
                className="hotel-card"
                onClick={() => handleHotelClick(hotel.id)}
              >
                <Image
                  className="hotel-card__img"
                  src={
                    hotel.images?.[0]?.url ||
                    'https://via.placeholder.com/300x200?text=Hotel'
                  }
                  mode="aspectFill"
                />
                <View className="hotel-card__info">
                  <Text className="hotel-card__name ellipsis">
                    {hotel.nameZh}
                  </Text>
                  <Text className="hotel-card__star">
                    {STAR_LEVEL_LABELS[hotel.starLevel as StarLevel]}
                  </Text>
                  {hotel.minPrice !== null && (
                    <View className="hotel-card__price-row">
                      <Text className="hotel-card__price">
                        {formatPrice(hotel.minPrice)}
                      </Text>
                      <Text className="hotel-card__price-unit">起</Text>
                    </View>
                  )}
                  {hotel.promotions?.length > 0 && (
                    <View className="hotel-card__tag">
                      <Text className="hotel-card__tag-text">优惠</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="empty-state">
            <Text className="empty-state__text">暂无推荐酒店</Text>
          </View>
        )}
      </View>

      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <View className="section">
          <View className="section__header">
            <Text className="section__title">搜索历史</Text>
            <View className="section__more" onClick={clearHistory}>
              <Text className="section__more-text">清空</Text>
            </View>
          </View>
          <View className="history-tags">
            {searchHistory.map((item) => (
              <View
                key={item}
                className="history-tag"
                onClick={() => handleHistoryClick(item)}
              >
                <Text className="history-tag__text">{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 日历组件 */}
      <Calendar
        visible={calendarVisible}
        onConfirm={handleCalendarConfirm}
        onClose={() => setCalendarVisible(false)}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
      />
    </View>
  );
}

export default HomePage;
