import type { ApiResponse } from '@easyhotel/shared';

export interface RequestConfig {
  baseURL: string;
  getToken?: () => string | null;
}

let config: RequestConfig = {
  baseURL: '/api/v1',
};

export function setupRequest(cfg: Partial<RequestConfig>) {
  config = { ...config, ...cfg };
}

// 适配 Taro 和浏览器 fetch
type RequestAdapter = (url: string, options: RequestInit) => Promise<Response>;
let adapter: RequestAdapter = fetch.bind(globalThis);

export function setRequestAdapter(fn: RequestAdapter) {
  adapter = fn;
}

async function request<T>(
  method: string,
  path: string,
  data?: unknown,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  let url = `${config.baseURL}${path}`;

  // 拼接 query params
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = config.getToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await adapter(url, options);
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || json.code !== 0) {
    throw new Error(json.message || `请求失败: ${response.status}`);
  }

  return json.data;
}

export const http = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>('GET', path, undefined, params),
  post: <T>(path: string, data?: unknown) => request<T>('POST', path, data),
  put: <T>(path: string, data?: unknown) => request<T>('PUT', path, data),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
