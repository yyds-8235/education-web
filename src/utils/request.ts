import axios from 'axios';
import type { ApiResponse } from '@/types';
import { message } from 'antd';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:8082/api',
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res: ApiResponse = response.data;

    // 如果返回的状态码不是200，则显示错误信息
    if (res.code !== 200 && res.code !== 0) {
      message.error(res.message || '请求失败');

      // 401: Token过期或未登录
      if (res.code === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = `${window.location.origin}${window.location.pathname}#/login`;
      }

      return Promise.reject(new Error(res.message || '请求失败'));
    }

    return res as any;
  },
  (error) => {
    console.error('请求错误：', error);

    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          message.error('未登录或登录已过期');
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.location.href = `${window.location.origin}${window.location.pathname}#/login`;
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 其他错误
      message.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  }
);

export default request;
