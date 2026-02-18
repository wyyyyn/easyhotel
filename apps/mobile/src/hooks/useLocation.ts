import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';

const DEFAULT_CITY = '上海';

interface UseLocationResult {
  city: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLocation(): UseLocationResult {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // H5 环境使用浏览器 Geolocation API
      if (process.env.TARO_ENV === 'h5') {
        // H5 中反向地理编码需要第三方服务，这里简化处理
        // 实际项目中可接入高德/腾讯地图 API 进行反向地理编码
        setCity(DEFAULT_CITY);
        return;
      }

      // 小程序环境使用 Taro.getLocation
      const location = await Taro.getLocation({
        type: 'gcj02',
      });

      // 使用腾讯/高德地图反向地理编码获取城市名
      // 此处简化处理，实际项目中需要对接地图 SDK
      // TODO: 接入地图 SDK 的反向地理编码
      if (location.latitude && location.longitude) {
        // 模拟城市获取，实际项目需调用反向地理编码 API
        setCity(DEFAULT_CITY);
      }
    } catch (err) {
      console.warn('获取定位失败，使用默认城市:', err);
      setError('获取定位失败');
      setCity(DEFAULT_CITY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCity();
  }, [getCity]);

  return { city, loading, error, refresh: getCity };
}
