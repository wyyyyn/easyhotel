import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { setupRequest, setupUpload } from '@easyhotel/api-client';
import App from './App';
import './App.module.css';

// 配置 API 请求
setupRequest({
  baseURL: '/api/v1',
  getToken: () => localStorage.getItem('token'),
});

setupUpload({
  baseURL: '/api/v1',
  getToken: () => localStorage.getItem('token'),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
