import type { ApiResponse } from '@easyhotel/shared';

let baseURL = '/api/v1';
let getToken: (() => string | null) | undefined;

export function setupUpload(cfg: { baseURL?: string; getToken?: () => string | null }) {
  if (cfg.baseURL) baseURL = cfg.baseURL;
  if (cfg.getToken) getToken = cfg.getToken;
}

export const uploadApi = {
  /** 上传单张图片 */
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    const token = getToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json: ApiResponse<{ url: string }> = await response.json();
    if (!response.ok || json.code !== 0) {
      throw new Error(json.message || '上传失败');
    }
    return json.data;
  },

  /** 批量上传图片 */
  async uploadImages(files: File[]): Promise<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const headers: Record<string, string> = {};
    const token = getToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}/upload/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json: ApiResponse<{ urls: string[] }> = await response.json();
    if (!response.ok || json.code !== 0) {
      throw new Error(json.message || '上传失败');
    }
    return json.data;
  },
};
