import { PropsWithChildren } from 'react';
import Taro from '@tarojs/taro';
import { setRequestAdapter, setupRequest } from '@easyhotel/api-client';
import './app.scss';

// 设置 API base URL
setupRequest({
  baseURL: '/api/v1',
});

// 适配 Taro.request 作为请求适配器
setRequestAdapter(async (url: string, options: RequestInit) => {
  const header: Record<string, string> = {};
  if (options.headers) {
    const h = options.headers as Record<string, string>;
    Object.keys(h).forEach((key) => {
      header[key] = h[key];
    });
  }

  const res = await Taro.request({
    url:
      process.env.TARO_ENV === 'h5'
        ? url
        : `http://localhost:3000${url}`,
    method: (options.method || 'GET').toUpperCase() as keyof Taro.request.Method,
    data: options.body ? JSON.parse(options.body as string) : undefined,
    header,
  });

  // 将 Taro.request 的响应适配为 fetch Response 接口
  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    statusText: String(res.statusCode),
    json: async () => res.data,
    text: async () => JSON.stringify(res.data),
    headers: new Headers(),
  } as Response;
});

function App({ children }: PropsWithChildren) {
  return children;
}

export default App;
