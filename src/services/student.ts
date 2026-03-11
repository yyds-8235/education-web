import request from '@/utils/request';

export interface StudentProfile {
  id: string;
  studentNo: string;
  name: string;
  username: string;
  grade: string;
  class: string;
  guardian: string;
  syncedAt: string;
  povertyLevel: '非困难' | '一般困难' | '困难' | '特别困难';
  isSponsored: boolean;
  householdType: '城镇' | '农村';
  isLeftBehind: boolean;
  isDisabled: boolean;
  isSingleParent: boolean;
  isKeyConcern: boolean;
  canView: boolean;
  canEdit: boolean;
}

export interface StudentListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  grade?: string;
  class?: string;
  archiveFilter?: string;
  canView?: boolean;
  canEdit?: boolean;
}

export interface StudentListResponse {
  list: StudentProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateStudentParams {
  studentNo: string;
  name: string;
  username: string;
  password: string;
  grade: string;
  class: string;
  guardian?: string;
  povertyLevel: '非困难' | '一般困难' | '困难' | '特别困难';
  isSponsored: boolean;
  householdType: '城镇' | '农村';
  isLeftBehind: boolean;
  isDisabled: boolean;
  isSingleParent: boolean;
  isKeyConcern: boolean;
  canView: boolean;
  canEdit: boolean;
  email?: string;
  phone?: string;
}

export interface UpdateStudentParams extends Partial<CreateStudentParams> {}

export interface UpdatePermissionsParams {
  canView: boolean;
  canEdit: boolean;
}

export interface SyncStudentsParams {
  studentIds?: string[];
}

export interface StudentMetaResponse {
  grades: string[];
  classes: string[];
  povertyLevels: string[];
  householdTypes: string[];
}

/**
 * 获取学生列表（分页 + 筛选）
 */
export const getStudentListApi = async (params: StudentListParams): Promise<StudentListResponse> => {
  const response = await request.get('/admin/students/xq', { params });
  return response.data.data;
};

/**
 * 获取学生详情
 */
export const getStudentDetailApi = async (studentId: string): Promise<StudentProfile> => {
  const response = await request.get(`/admin/students/xq/${studentId}`);
  return response.data.data;
};

/**
 * 新增学生
 */
export const createStudentApi = async (params: CreateStudentParams): Promise<StudentProfile> => {
  const response = await request.post('/admin/students/xq', params);
  return response.data.data;
};

/**
 * 更新学生信息
 */
export const updateStudentApi = async (studentId: string, params: UpdateStudentParams): Promise<StudentProfile> => {
  const response = await request.put(`/admin/students/xq/${studentId}`, params);
  return response.data.data;
};

/**
 * 删除学生
 */
export const deleteStudentApi = async (studentId: string): Promise<{ id: string }> => {
  const response = await request.delete(`/admin/students/xq/${studentId}`);
  return response.data.data;
};

/**
 * 更新学生权限
 */
export const updateStudentPermissionsApi = async (
  studentId: string,
  params: UpdatePermissionsParams
): Promise<{ studentId: string; canView: boolean; canEdit: boolean; updatedAt: string }> => {
  const response = await request.patch(`/admin/students/${studentId}/permissions`, params);
  return response.data.data;
};

/**
 * 批量同步学生档案
 */
export const syncStudentsApi = async (params?: SyncStudentsParams): Promise<{ syncedCount: number; syncedAt: string; failed: string[] }> => {
  const response = await request.post('/admin/students/sync', params || {});
  return response.data.data;
};

/**
 * 获取学生管理元数据
 */
export const getStudentMetaApi = async (): Promise<StudentMetaResponse> => {
  const response = await request.get('/admin/students/meta');
  return response.data.data;
};
