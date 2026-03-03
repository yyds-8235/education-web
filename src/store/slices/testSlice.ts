import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Test, TestSubmission, TestStatistics, CreateTestParams, SubmitTestParams, GradeParams } from '@/types';
import type { PaginatedResponse } from '@/types';
import request from '@/utils/request';

interface TestState {
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

export const fetchTests = createAsyncThunk(
    'test/fetchTests',
    async (params: { page: number; pageSize: number; courseId?: string }) => {
        const response = await request.get<PaginatedResponse<Test>>('/tests', { params });
        return response.data;
    }
);

export const fetchTestById = createAsyncThunk(
    'test/fetchTestById',
    async (id: string) => {
        const response = await request.get<Test>(`/tests/${id}`);
        return response.data;
    }
);

export const createTest = createAsyncThunk(
    'test/createTest',
    async (params: CreateTestParams) => {
        const response = await request.post<Test>('/tests', params);
        return response.data;
    }
);

export const updateTest = createAsyncThunk(
    'test/updateTest',
    async ({ id, ...params }: { id: string } & Partial<CreateTestParams>) => {
        const response = await request.put<Test>(`/tests/${id}`, params);
        return response.data;
    }
);

export const deleteTest = createAsyncThunk(
    'test/deleteTest',
    async (id: string) => {
        await request.delete(`/tests/${id}`);
        return id;
    }
);

export const publishTest = createAsyncThunk(
    'test/publishTest',
    async (id: string) => {
        const response = await request.post<Test>(`/tests/${id}/publish`);
        return response.data;
    }
);

export const submitTest = createAsyncThunk(
    'test/submitTest',
    async (params: SubmitTestParams) => {
        const response = await request.post<TestSubmission>(`/tests/${params.testId}/submit`, {
            answers: params.answers,
        });
        return response.data;
    }
);

export const fetchSubmission = createAsyncThunk(
    'test/fetchSubmission',
    async ({ testId, studentId }: { testId: string; studentId?: string }) => {
        const url = studentId
            ? `/tests/${testId}/submissions/${studentId}`
            : `/tests/${testId}/my-submission`;
        const response = await request.get<TestSubmission>(url);
        return response.data;
    }
);

export const fetchSubmissions = createAsyncThunk(
    'test/fetchSubmissions',
    async (testId: string) => {
        const response = await request.get<TestSubmission[]>(`/tests/${testId}/submissions`);
        return response.data;
    }
);

export const gradeSubmission = createAsyncThunk(
    'test/gradeSubmission',
    async (params: GradeParams) => {
        const response = await request.post<TestSubmission>(
            `/submissions/${params.submissionId}/grade`,
            { answers: params.answers }
        );
        return response.data;
    }
);

export const fetchStatistics = createAsyncThunk(
    'test/fetchStatistics',
    async (testId: string) => {
        const response = await request.get<TestStatistics>(`/tests/${testId}/statistics`);
        return response.data;
    }
);

export const submitAppeal = createAsyncThunk(
    'test/submitAppeal',
    async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
        const response = await request.post<TestSubmission>(
            `/submissions/${submissionId}/appeal`,
            { reason }
        );
        return response.data;
    }
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
            state.tests = [];
            state.total = 0;
        },
        saveDraft: (state, action) => {
            if (state.currentSubmission) {
                state.currentSubmission.answers = Object.entries(action.payload.answers).map(
                    ([questionId, answer]) => ({ questionId, answer: String(answer) })
                );
            }
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
            })
            .addCase(fetchTestById.rejected, (state) => {
                state.loading = false;
            })
            .addCase(createTest.fulfilled, (state, action) => {
                state.tests.unshift(action.payload);
                state.total += 1;
            })
            .addCase(updateTest.fulfilled, (state, action) => {
                const index = state.tests.findIndex((t) => t.id === action.payload.id);
                if (index !== -1) {
                    state.tests[index] = action.payload;
                }
                if (state.currentTest?.id === action.payload.id) {
                    state.currentTest = action.payload;
                }
            })
            .addCase(deleteTest.fulfilled, (state, action) => {
                state.tests = state.tests.filter((t) => t.id !== action.payload);
                state.total -= 1;
            })
            .addCase(publishTest.fulfilled, (state, action) => {
                const index = state.tests.findIndex((t) => t.id === action.payload.id);
                if (index !== -1) {
                    state.tests[index] = action.payload;
                }
                if (state.currentTest?.id === action.payload.id) {
                    state.currentTest = action.payload;
                }
            })
            .addCase(submitTest.fulfilled, (state, action) => {
                state.currentSubmission = action.payload;
            })
            .addCase(fetchSubmission.fulfilled, (state, action) => {
                state.currentSubmission = action.payload;
            })
            .addCase(fetchSubmissions.fulfilled, (state, action) => {
                state.submissions = action.payload;
            })
            .addCase(gradeSubmission.fulfilled, (state, action) => {
                const index = state.submissions.findIndex((s) => s.id === action.payload.id);
                if (index !== -1) {
                    state.submissions[index] = action.payload;
                }
                if (state.currentSubmission?.id === action.payload.id) {
                    state.currentSubmission = action.payload;
                }
            })
            .addCase(fetchStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            });
    },
});

export const { setCurrentTest, setPage, setPageSize, clearTests, saveDraft } = testSlice.actions;
export default testSlice.reducer;
