import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Swiper,
  SwiperItem,
} from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { hotelApi } from '@easyhotel/api-client';
import {
  formatPrice,
  STAR_LEVEL_LABELS,
  BED_TYPE_LABELS,
  NEARBY_SPOT_TYPE_LABELS,
} from '@easyhotel/shared';
import type {
  Hotel,
  RoomType,
  StarLevel,
  BedType,
  NearbySpotType,
} from '@easyhotel/shared';
import './index.scss';

function DetailPage() {
  const router = useRouter();
  const hotelId = Number(router.params.id);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 获取酒店详情
  useEffect(() => {
    if (!hotelId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [hotelData, rooms] = await Promise.all([
          hotelApi.getDetail(hotelId),
          hotelApi.getRoomTypes(hotelId).catch(() => [] as RoomType[]),
        ]);
        setHotel(hotelData);
        setRoomTypes(rooms);

        // 设置导航栏标题
        Taro.setNavigationBarTitle({ title: hotelData.nameZh });
      } catch (err) {
        console.error('获取酒店详情失败:', err);
        Taro.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [hotelId]);

  // 拨打电话
  const handleCall = useCallback((phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone }).catch(() => {});
  }, []);

  // 查看地图
  const handleOpenMap = useCallback((address: string) => {
    // H5 环境下暂不支持地图
    if (process.env.TARO_ENV === 'h5') {
      Taro.showToast({ title: address, icon: 'none', duration: 3000 });
      return;
    }
    // 小程序环境可跳转地图
    Taro.openLocation({
      latitude: 0,
      longitude: 0,
      name: hotel?.nameZh || '',
      address,
    });
  }, [hotel]);

  if (loading) {
    return (
      <View className="detail-page">
        <View className="detail-skeleton">
          <View className="detail-skeleton__gallery skeleton-block" />
          <View className="detail-skeleton__content">
            <View className="skeleton-line skeleton-line--title" />
            <View className="skeleton-line skeleton-line--medium" />
            <View className="skeleton-line skeleton-line--short" />
            <View className="skeleton-line skeleton-line--long" />
          </View>
        </View>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View className="detail-page">
        <View className="detail-empty">
          <Text className="detail-empty__text">酒店信息不存在</Text>
        </View>
      </View>
    );
  }

  const images = hotel.images?.length
    ? hotel.images.sort((a, b) => a.sort - b.sort)
    : [];

  return (
    <View className="detail-page">
      {/* 图片画廊 */}
      <View className="gallery">
        {images.length > 0 ? (
          <>
            <Swiper
              className="gallery__swiper"
              onChange={(e) => setCurrentImageIndex(e.detail.current)}
              circular
            >
              {images.map((img) => (
                <SwiperItem key={img.id}>
                  <Image
                    className="gallery__image"
                    src={img.url}
                    mode="aspectFill"
                    onClick={() => {
                      Taro.previewImage({
                        current: img.url,
                        urls: images.map((i) => i.url),
                      });
                    }}
                  />
                </SwiperItem>
              ))}
            </Swiper>
            <View className="gallery__indicator">
              <Text className="gallery__indicator-text">
                {currentImageIndex + 1}/{images.length}
              </Text>
            </View>
          </>
        ) : (
          <View className="gallery__placeholder">
            <Text className="gallery__placeholder-text">暂无图片</Text>
          </View>
        )}
      </View>

      {/* 基本信息 */}
      <View className="info-section">
        <View className="info-section__header">
          <Text className="info-section__name">{hotel.nameZh}</Text>
          {hotel.nameEn && (
            <Text className="info-section__name-en">{hotel.nameEn}</Text>
          )}
        </View>

        <View className="info-section__meta">
          <View className="info-section__star">
            <Text className="info-section__star-text">
              {STAR_LEVEL_LABELS[hotel.starLevel as StarLevel]}
            </Text>
          </View>
          {hotel.minPrice !== null && (
            <View className="info-section__price-row">
              <Text className="info-section__price">
                {formatPrice(hotel.minPrice)}
              </Text>
              <Text className="info-section__price-unit">起</Text>
            </View>
          )}
        </View>

        <View className="info-section__row" onClick={() => handleOpenMap(hotel.address)}>
          <Text className="info-section__icon">📍</Text>
          <Text className="info-section__text">{hotel.address}</Text>
          <Text className="info-section__arrow">›</Text>
        </View>

        <View className="info-section__row" onClick={() => handleCall(hotel.phone)}>
          <Text className="info-section__icon">📞</Text>
          <Text className="info-section__text">{hotel.phone}</Text>
          <Text className="info-section__arrow">›</Text>
        </View>
      </View>

      {/* 酒店描述 */}
      {hotel.description && (
        <View className="section">
          <View className="section__title">
            <Text>酒店介绍</Text>
          </View>
          <View className="section__body">
            <Text className="description-text">{hotel.description}</Text>
          </View>
        </View>
      )}

      {/* 房型列表 */}
      <View className="section">
        <View className="section__title">
          <Text>房型列表</Text>
        </View>
        <View className="section__body">
          {roomTypes.length > 0 ? (
            roomTypes.map((room) => (
              <View key={room.id} className="room-card">
                {room.images?.[0] && (
                  <Image
                    className="room-card__img"
                    src={room.images[0]}
                    mode="aspectFill"
                  />
                )}
                <View className="room-card__content">
                  <Text className="room-card__name">{room.name}</Text>
                  <View className="room-card__info">
                    <Text className="room-card__info-item">
                      {BED_TYPE_LABELS[room.bedType as BedType]}
                    </Text>
                    <Text className="room-card__info-item">
                      {room.area}m²
                    </Text>
                    <Text className="room-card__info-item">
                      {room.maxGuests}人
                    </Text>
                  </View>
                  {room.facilities?.length > 0 && (
                    <View className="room-card__facilities">
                      {room.facilities.slice(0, 4).map((f, i) => (
                        <Text key={i} className="room-card__facility">
                          {f}
                        </Text>
                      ))}
                    </View>
                  )}
                  <View className="room-card__bottom">
                    <View className="room-card__price-row">
                      <Text className="room-card__price">
                        {formatPrice(room.basePrice)}
                      </Text>
                      <Text className="room-card__price-unit">/晚</Text>
                    </View>
                    <Text className="room-card__stock">
                      剩余{room.stock}间
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="section__empty">
              <Text className="section__empty-text">暂无可用房型</Text>
            </View>
          )}
        </View>
      </View>

      {/* 周边信息 */}
      {hotel.nearbySpots?.length > 0 && (
        <View className="section">
          <View className="section__title">
            <Text>周边信息</Text>
          </View>
          <View className="section__body">
            {hotel.nearbySpots.map((spot) => (
              <View key={spot.id} className="nearby-item">
                <View className="nearby-item__type">
                  <Text className="nearby-item__type-text">
                    {NEARBY_SPOT_TYPE_LABELS[spot.type as NearbySpotType]}
                  </Text>
                </View>
                <Text className="nearby-item__name">{spot.name}</Text>
                <Text className="nearby-item__distance">{spot.distance}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 优惠信息 */}
      {hotel.promotions?.length > 0 && (
        <View className="section">
          <View className="section__title">
            <Text>优惠活动</Text>
          </View>
          <View className="section__body">
            {hotel.promotions.map((promo) => (
              <View key={promo.id} className="promo-item">
                <View className="promo-item__badge">
                  <Text className="promo-item__badge-text">
                    {promo.type === 'DISCOUNT' ? '折' : '减'}
                  </Text>
                </View>
                <View className="promo-item__content">
                  <Text className="promo-item__text">
                    {promo.type === 'DISCOUNT'
                      ? `${(promo.discountRate! * 10).toFixed(1)}折优惠`
                      : `满${promo.minAmount}减${promo.reduceAmount}`}
                  </Text>
                  <Text className="promo-item__date">
                    {promo.startDate.slice(0, 10)} 至{' '}
                    {promo.endDate.slice(0, 10)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 底部安全区 */}
      <View className="safe-bottom" style={{ height: '40px' }} />
    </View>
  );
}

export default DetailPage;
