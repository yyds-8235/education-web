import request from '@/utils/request';
import type { LoginParams, LoginResponse, User } from '@/types';

/**
 * 用户登录
 */
export const loginApi = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await request.post('/auth/login', params);
  return response.data.data;
};

/**
 * 获取当前登录用户信息
 */
export const getCurrentUserApi = async (): Promise<User> => {
  const response = await request.get('/auth/me');
  return response.data.data;
};

/**
 * 退出登录
 */
export const logoutApi = async (): Promise<void> => {
  await request.post('/auth/logout');
};
