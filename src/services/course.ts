import request from '@/utils/request';
import type {
  Course,
  CourseQueryParams,
  CourseSelectableStudent,
  CourseStudent,
  CreateCourseParams,
  PaginatedResponse,
  UpdateCourseParams,
} from '@/types';

export interface CourseUploadResourceResponse {
  id?: string;
  name: string;
  type: 'video' | 'ppt' | 'word' | 'pdf' | 'other';
  url: string;
  bucketName?: string;
  objectKey?: string;
  size: number;
}

export interface CourseResourceAccessResponse {
  resourceId: string;
  fileName: string;
  url: string;
  expiresIn?: number;
}

export const getTeacherCourseListApi = async (
  params: CourseQueryParams,
): Promise<PaginatedResponse<Course>> => {
  const response = await request.get('/teacher/courses', { params });
  return response.data.data;
};

export const getTeacherCourseDetailApi = async (courseId: string): Promise<Course> => {
  const response = await request.get(`/teacher/courses/${courseId}`);
  return response.data.data;
};

export const createTeacherCourseApi = async (params: CreateCourseParams): Promise<Course> => {
  const response = await request.post('/teacher/courses', params);
  return response.data.data;
};

export const updateTeacherCourseApi = async (
  courseId: string,
  params: Omit<UpdateCourseParams, 'id'>,
): Promise<Course> => {
  const response = await request.put(`/teacher/courses/${courseId}`, params);
  return response.data.data;
};

export const deleteTeacherCourseApi = async (courseId: string): Promise<{ id: string }> => {
  const response = await request.delete(`/teacher/courses/${courseId}`);
  return response.data.data;
};

export const getTeacherCourseStudentsApi = async (courseId: string): Promise<CourseStudent[]> => {
  const response = await request.get(`/teacher/courses/${courseId}/students`);
  return response.data.data;
};

export const getTeacherCourseCandidateStudentsApi = async (
  courseId: string,
): Promise<CourseSelectableStudent[]> => {
  const response = await request.get(`/teacher/courses/${courseId}/candidate-students`);
  return response.data.data;
};

export const addTeacherCourseStudentsApi = async (
  courseId: string,
  studentIds: string[],
): Promise<{ courseId: string; students: CourseStudent[] }> => {
  const response = await request.post(`/teacher/courses/${courseId}/students`, { studentIds });
  return response.data.data;
};

export const removeTeacherCourseStudentApi = async (
  courseId: string,
  studentId: string,
): Promise<{ courseId: string; studentId: string }> => {
  const response = await request.delete(`/teacher/courses/${courseId}/students/${studentId}`);
  return response.data.data;
};

export const uploadTeacherCourseResourceApi = async (
  file: File,
): Promise<CourseUploadResourceResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post('/teacher/course-resources/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export const getCourseResourcePreviewUrlApi = async (
  resourceId: string,
): Promise<CourseResourceAccessResponse> => {
  const response = await request.get(`/course-resources/${resourceId}/preview-url`);
  return response.data.data;
};

export const getCourseResourceDownloadUrlApi = async (
  resourceId: string,
): Promise<CourseResourceAccessResponse> => {
  const response = await request.get(`/course-resources/${resourceId}/download-url`);
  return response.data.data;
};
