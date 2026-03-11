import request from '@/utils/request';
import { getMockStudentLearningProfile } from '@/mock/studentAnalytics';
import type { StudentLearningProfile } from '@/types';

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
  email?: string;
  phone?: string;
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

export interface GetStudentLearningProfileOptions {
  seedStudent?: {
    id?: string;
    studentNo?: string;
    name?: string;
    username?: string;
    grade?: string;
    className?: string;
    guardian?: string;
    phone?: string;
    email?: string;
    tags?: string[];
  };
}

export const getStudentListApi = async (params: StudentListParams): Promise<StudentListResponse> => {
  const response = await request.get('/admin/students', { params });
  return response.data.data;
};

export const getStudentDetailApi = async (studentId: string): Promise<StudentProfile> => {
  const response = await request.get(`/admin/students/${studentId}`);
  return response.data.data;
};

export const createStudentApi = async (params: CreateStudentParams): Promise<StudentProfile> => {
  const response = await request.post('/admin/students', params);
  return response.data.data;
};

export const updateStudentApi = async (studentId: string, params: UpdateStudentParams): Promise<StudentProfile> => {
  const response = await request.put(`/admin/students/${studentId}`, params);
  return response.data.data;
};

export const deleteStudentApi = async (studentId: string): Promise<{ id: string }> => {
  const response = await request.delete(`/admin/students/${studentId}`);
  return response.data.data;
};

export const updateStudentPermissionsApi = async (
  studentId: string,
  params: UpdatePermissionsParams
): Promise<{ studentId: string; canView: boolean; canEdit: boolean; updatedAt: string }> => {
  const response = await request.patch(`/admin/students/${studentId}/permissions`, params);
  return response.data.data;
};

export const syncStudentsApi = async (params?: SyncStudentsParams): Promise<{ syncedCount: number; syncedAt: string; failed: string[] }> => {
  const response = await request.post('/admin/students/sync', params || {});
  return response.data.data;
};

export const getStudentMetaApi = async (): Promise<StudentMetaResponse> => {
  const response = await request.get('/admin/students/meta');
  return response.data.data;
};

export const getStudentLearningProfileApi = async (
  studentId: string,
  options?: GetStudentLearningProfileOptions,
): Promise<StudentLearningProfile> => {
  try {
    const response = await request.get(`/teacher/students/${studentId}/learning-profile`);
    return response.data.data;
  } catch {
    try {
      const response = await request.get(`/admin/students/${studentId}/learning-profile`);
      return response.data.data;
    } catch {
      return getMockStudentLearningProfile(studentId, options?.seedStudent);
    }
  }
};
