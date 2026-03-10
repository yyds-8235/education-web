import request from '@/utils/request';
import type {
  BatchGradeObjectiveParams,
  CreateTestParams,
  GradeParams,
  PaginatedResponse,
  SubmitTestParams,
  Test,
  TestStatistics,
  TestSubmission,
} from '@/types';

export interface TestQueryParams {
  page: number;
  pageSize: number;
  courseId?: string;
  keyword?: string;
}

export const getTeacherTestListApi = async (
  params: TestQueryParams,
): Promise<PaginatedResponse<Test>> => {
  const response = await request.get('/teacher/tests', { params });
  return response.data.data;
};

export const getStudentTestListApi = async (
  params: TestQueryParams,
): Promise<PaginatedResponse<Test>> => {
  const response = await request.get('/student/tests', { params });
  return response.data.data;
};

export const getTeacherTestDetailApi = async (testId: string): Promise<Test> => {
  const response = await request.get(`/teacher/tests/${testId}`);
  return response.data.data;
};

export const getStudentTestDetailApi = async (testId: string): Promise<Test> => {
  const response = await request.get(`/student/tests/${testId}`);
  return response.data.data;
};

export const createTeacherTestApi = async (params: CreateTestParams): Promise<Test> => {
  const response = await request.post('/teacher/tests', params);
  return response.data.data;
};

export const updateTeacherTestApi = async (
  testId: string,
  params: Partial<CreateTestParams>,
): Promise<Test> => {
  const response = await request.put(`/teacher/tests/${testId}`, params);
  return response.data.data;
};

export const publishTeacherTestApi = async (testId: string): Promise<Test> => {
  const response = await request.post(`/teacher/tests/${testId}/publish`);
  return response.data.data;
};

export const submitStudentTestApi = async (params: SubmitTestParams): Promise<TestSubmission> => {
  const response = await request.post(`/student/tests/${params.testId}/submit`, {
    answers: params.answers,
  });
  return response.data.data;
};

export const getStudentTestSubmissionApi = async (testId: string): Promise<TestSubmission | null> => {
  const response = await request.get(`/student/tests/${testId}/submission`);
  return response.data.data;
};

export const getTeacherTestSubmissionsApi = async (testId: string): Promise<TestSubmission[]> => {
  const response = await request.get(`/teacher/tests/${testId}/submissions`);
  return response.data.data;
};

export const gradeTeacherSubmissionApi = async (params: GradeParams): Promise<TestSubmission> => {
  const response = await request.put(`/teacher/test-submissions/${params.submissionId}/grade`, {
    answers: params.answers,
  });
  return response.data.data;
};

export const batchGradeTeacherObjectiveApi = async (
  params: BatchGradeObjectiveParams,
): Promise<{ testId: string; submissions: TestSubmission[] }> => {
  const response = await request.post(`/teacher/tests/${params.testId}/batch-grade-objective`);
  return response.data.data;
};

export const getTeacherTestStatisticsApi = async (testId: string): Promise<TestStatistics> => {
  const response = await request.get(`/teacher/tests/${testId}/statistics`);
  return response.data.data;
};

export const submitStudentAppealApi = async (
  submissionId: string,
  reason: string,
): Promise<TestSubmission> => {
  const response = await request.post(`/student/test-submissions/${submissionId}/appeal`, {
    reason,
  });
  return response.data.data;
};
