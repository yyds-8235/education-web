import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
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
import type { RootState } from '@/store';
import {
  batchGradeTeacherObjectiveApi,
  createTeacherTestApi,
  getStudentTestDetailApi,
  getStudentTestListApi,
  getStudentTestSubmissionApi,
  getTeacherTestDetailApi,
  getTeacherTestListApi,
  getTeacherTestStatisticsApi,
  getTeacherTestSubmissionsApi,
  gradeTeacherSubmissionApi,
  publishTeacherTestApi,
  submitStudentAppealApi,
  submitStudentTestApi,
  updateTeacherTestApi,
} from '@/services/test';

interface TestState {
  allTests: Test[];
  tests: Test[];
  currentTest: Test | null;
  currentSubmission: TestSubmission | null;
  statistics: TestStatistics | null;
  submissions: TestSubmission[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
}

const initialState: TestState = {
  allTests: [],
  tests: [],
  currentTest: null,
  currentSubmission: null,
  statistics: null,
  submissions: [],
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
};

const upsertTest = (collection: Test[], test: Test) => {
  const index = collection.findIndex((item) => item.id === test.id);
  if (index === -1) {
    collection.unshift(test);
  } else {
    collection[index] = test;
  }
};

const syncTest = (state: TestState, test: Test) => {
  upsertTest(state.allTests, test);
  upsertTest(state.tests, test);

  if (state.currentTest?.id === test.id) {
    state.currentTest = test;
    state.submissions = test.submissions;
  }
};

const syncSubmission = (state: TestState, submission: TestSubmission) => {
  const test = state.allTests.find((item) => item.id === submission.testId)
    ?? state.tests.find((item) => item.id === submission.testId)
    ?? state.currentTest;

  if (!test || test.id !== submission.testId) {
    if (state.currentSubmission?.id === submission.id) {
      state.currentSubmission = submission;
    }
    return;
  }

  const nextSubmissions = [...test.submissions];
  const index = nextSubmissions.findIndex((item) => item.id === submission.id || item.studentId === submission.studentId);
  if (index === -1) {
    nextSubmissions.push(submission);
  } else {
    nextSubmissions[index] = submission;
  }

  const nextTest: Test = {
    ...test,
    submissions: nextSubmissions,
  };

  syncTest(state, nextTest);
  state.currentSubmission = submission;
};

export const fetchTests = createAsyncThunk(
  'test/fetchTests',
  async (
    params: { page: number; pageSize: number; courseId?: string; keyword?: string },
    { getState },
  ) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (user?.role === 'teacher') {
      return getTeacherTestListApi(params);
    }

    if (user?.role === 'student') {
      return getStudentTestListApi(params);
    }

    return {
      list: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: 0,
    } as PaginatedResponse<Test>;
  },
);

export const fetchTestById = createAsyncThunk(
  'test/fetchTestById',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (user?.role === 'teacher') {
      return getTeacherTestDetailApi(id);
    }

    if (user?.role === 'student') {
      return getStudentTestDetailApi(id);
    }

    throw new Error('当前角色不支持查看测试');
  },
);

export const createTest = createAsyncThunk(
  'test/createTest',
  async (params: CreateTestParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可创建测试');
    }

    return createTeacherTestApi(params);
  },
);

export const updateTest = createAsyncThunk(
  'test/updateTest',
  async (
    { id, ...params }: { id: string } & Partial<CreateTestParams>,
    { getState },
  ) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可编辑测试');
    }

    return updateTeacherTestApi(id, params);
  },
);

export const deleteTest = createAsyncThunk('test/deleteTest', async (id: string) => id);

export const publishTest = createAsyncThunk(
  'test/publishTest',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可发布测试');
    }

    return publishTeacherTestApi(id);
  },
);

export const submitTest = createAsyncThunk(
  'test/submitTest',
  async (params: SubmitTestParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'student') {
      throw new Error('仅学生可提交测试');
    }

    return submitStudentTestApi(params);
  },
);

export const fetchSubmission = createAsyncThunk(
  'test/fetchSubmission',
  async (
    { testId }: { testId: string; studentId?: string },
    { getState },
  ) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'student') {
      throw new Error('仅学生可查看个人提交');
    }

    return getStudentTestSubmissionApi(testId);
  },
);

export const fetchSubmissions = createAsyncThunk(
  'test/fetchSubmissions',
  async (testId: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可查看提交列表');
    }

    return {
      testId,
      submissions: await getTeacherTestSubmissionsApi(testId),
    };
  },
);

export const gradeSubmission = createAsyncThunk(
  'test/gradeSubmission',
  async (params: GradeParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可批改测试');
    }

    return gradeTeacherSubmissionApi(params);
  },
);

export const batchGradeObjective = createAsyncThunk(
  'test/batchGradeObjective',
  async (params: BatchGradeObjectiveParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可批量批改');
    }

    return batchGradeTeacherObjectiveApi(params);
  },
);

export const fetchStatistics = createAsyncThunk(
  'test/fetchStatistics',
  async (testId: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'teacher') {
      throw new Error('仅教师可查看统计');
    }

    return getTeacherTestStatisticsApi(testId);
  },
);

export const submitAppeal = createAsyncThunk(
  'test/submitAppeal',
  async (
    { submissionId, reason }: { submissionId: string; reason: string },
    { getState },
  ) => {
    const state = getState() as RootState;
    if (state.auth.user?.role !== 'student') {
      throw new Error('仅学生可发起申诉');
    }

    return submitStudentAppealApi(submissionId, reason);
  },
);

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setCurrentTest: (state, action) => {
      state.currentTest = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearTests: (state) => {
      state.allTests = [];
      state.tests = [];
      state.total = 0;
    },
    saveDraft: (state, action) => {
      if (!state.currentSubmission) {
        return;
      }

      state.currentSubmission.answers = Object.entries(action.payload.answers).map(
        ([questionId, answer]) => ({ questionId, answer: String(answer) }),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload.list;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        action.payload.list.forEach((test) => upsertTest(state.allTests, test));
      })
      .addCase(fetchTests.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchTestById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTest = action.payload;
        state.submissions = action.payload.submissions;
        upsertTest(state.allTests, action.payload);
        upsertTest(state.tests, action.payload);
      })
      .addCase(fetchTestById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        upsertTest(state.allTests, action.payload);
        upsertTest(state.tests, action.payload);
        state.total += 1;
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        syncTest(state, action.payload);
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.allTests = state.allTests.filter((test) => test.id !== action.payload);
        state.tests = state.tests.filter((test) => test.id !== action.payload);
        state.total = Math.max(0, state.total - 1);

        if (state.currentTest?.id === action.payload) {
          state.currentTest = null;
          state.submissions = [];
        }
      })
      .addCase(publishTest.fulfilled, (state, action) => {
        syncTest(state, action.payload);
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        syncSubmission(state, action.payload);
      })
      .addCase(fetchSubmission.fulfilled, (state, action) => {
        state.currentSubmission = action.payload;
        if (action.payload) {
          syncSubmission(state, action.payload);
        }
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload.submissions;
        if (state.currentTest?.id === action.payload.testId) {
          state.currentTest = {
            ...state.currentTest,
            submissions: action.payload.submissions,
          };
        }
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        syncSubmission(state, action.payload);
      })
      .addCase(batchGradeObjective.fulfilled, (state, action) => {
        const test = state.allTests.find((item) => item.id === action.payload.testId)
          ?? state.tests.find((item) => item.id === action.payload.testId)
          ?? state.currentTest;

        if (!test || test.id !== action.payload.testId) {
          state.submissions = action.payload.submissions;
          return;
        }

        const nextTest: Test = {
          ...test,
          submissions: action.payload.submissions,
        };

        syncTest(state, nextTest);
        state.submissions = action.payload.submissions;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(submitAppeal.fulfilled, (state, action) => {
        syncSubmission(state, action.payload);
      });
  },
});

export const { setCurrentTest, setPage, setPageSize, clearTests, saveDraft } = testSlice.actions;
export default testSlice.reducer;
