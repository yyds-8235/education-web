import axios from 'axios';
import type { ApiResponse } from '@/types';

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

    // 如果返回的状态码不是200或0，则显示错误信息
    if (res.code !== 200 && res.code !== 0) {

      // 401: Token过期或未登录
      if (res.code === 401) {
                    console.log(res);

        // 只有在非登录接口时才跳转
        if (!response.config?.url?.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.location.href = `${window.location.origin}${window.location.pathname}#/login`;
        }
      }

      return Promise.reject(new Error(res.message || '请求失败'));
    }

    return {
      ...response,
      data: res,
    };
  },
  (error) => {
    console.error('请求错误：', error);

    let errorMessage = '请求失败';

    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;

      // 优先使用后端返回的 message
      errorMessage = data?.message || errorMessage;

      switch (status) {
        case 401:
          errorMessage = data?.message || '用户名或密码错误';
          // 只有在非登录接口时才跳转
          if (!error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = `${window.location.origin}${window.location.pathname}#/login`;
          }
          break;
        case 403:
          errorMessage = data?.message || '没有权限访问';
          break;
        case 404:
          errorMessage = data?.message || '请求的资源不存在';
          break;
        case 422:
          errorMessage = data?.message || '参数校验失败';
          break;
        case 500:
          errorMessage = data?.message || '服务器错误';
          break;
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      errorMessage = '网络错误，请检查网络连接';
    } else {
      // 其他错误
      errorMessage = error.message || '请求失败';
    }

    // 返回包含错误信息的 Error 对象
    return Promise.reject(new Error(errorMessage));
  }
);

export default request;
