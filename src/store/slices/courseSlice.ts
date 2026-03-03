import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Course, CourseQueryParams, CreateCourseParams, UpdateCourseParams, CourseStudent } from '@/types';
import type { PaginatedResponse } from '@/types';
import request from '@/utils/request';

interface CourseState {
    courses: Course[];
    currentCourse: Course | null;
    students: CourseStudent[];
    loading: boolean;
    total: number;
    page: number;
    pageSize: number;
}

const initialState: CourseState = {
    courses: [],
    currentCourse: null,
    students: [],
    loading: false,
    total: 0,
    page: 1,
    pageSize: 10,
};

export const fetchCourses = createAsyncThunk(
    'course/fetchCourses',
    async (params: CourseQueryParams) => {
        const response = await request.get<PaginatedResponse<Course>>('/courses', { params });
        return response.data;
    }
);

export const fetchCourseById = createAsyncThunk(
    'course/fetchCourseById',
    async (id: string) => {
        const response = await request.get<Course>(`/courses/${id}`);
        return response.data;
    }
);

export const createCourse = createAsyncThunk(
    'course/createCourse',
    async (params: CreateCourseParams) => {
        const response = await request.post<Course>('/courses', params);
        return response.data;
    }
);

export const updateCourse = createAsyncThunk(
    'course/updateCourse',
    async (params: UpdateCourseParams) => {
        const response = await request.put<Course>(`/courses/${params.id}`, params);
        return response.data;
    }
);

export const deleteCourse = createAsyncThunk(
    'course/deleteCourse',
    async (id: string) => {
        await request.delete(`/courses/${id}`);
        return id;
    }
);

export const fetchCourseStudents = createAsyncThunk(
    'course/fetchCourseStudents',
    async (courseId: string) => {
        const response = await request.get<CourseStudent[]>(`/courses/${courseId}/students`);
        return response.data;
    }
);

export const addStudentsToCourse = createAsyncThunk(
    'course/addStudentsToCourse',
    async ({ courseId, studentIds }: { courseId: string; studentIds: string[] }) => {
        const response = await request.post<CourseStudent[]>(`/courses/${courseId}/students`, {
            studentIds,
        });
        return response.data;
    }
);

export const removeStudentFromCourse = createAsyncThunk(
    'course/removeStudentFromCourse',
    async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
        await request.delete(`/courses/${courseId}/students/${studentId}`);
        return studentId;
    }
);

const courseSlice = createSlice({
    name: 'course',
    initialState,
    reducers: {
        setCurrentCourse: (state, action) => {
            state.currentCourse = action.payload;
        },
        setPage: (state, action) => {
            state.page = action.payload;
        },
        setPageSize: (state, action) => {
            state.pageSize = action.payload;
        },
        clearCourses: (state) => {
            state.courses = [];
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCourses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                state.loading = false;
                state.courses = action.payload.list;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pageSize = action.payload.pageSize;
            })
            .addCase(fetchCourses.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchCourseById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCourseById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentCourse = action.payload;
            })
            .addCase(fetchCourseById.rejected, (state) => {
                state.loading = false;
            })
            .addCase(createCourse.fulfilled, (state, action) => {
                state.courses.unshift(action.payload);
                state.total += 1;
            })
            .addCase(updateCourse.fulfilled, (state, action) => {
                const index = state.courses.findIndex((c) => c.id === action.payload.id);
                if (index !== -1) {
                    state.courses[index] = action.payload;
                }
                if (state.currentCourse?.id === action.payload.id) {
                    state.currentCourse = action.payload;
                }
            })
            .addCase(deleteCourse.fulfilled, (state, action) => {
                state.courses = state.courses.filter((c) => c.id !== action.payload);
                state.total -= 1;
                if (state.currentCourse?.id === action.payload) {
                    state.currentCourse = null;
                }
            })
            .addCase(fetchCourseStudents.fulfilled, (state, action) => {
                state.students = action.payload;
            })
            .addCase(addStudentsToCourse.fulfilled, (state, action) => {
                state.students.push(...action.payload);
            })
            .addCase(removeStudentFromCourse.fulfilled, (state, action) => {
                state.students = state.students.filter((s) => s.studentId !== action.payload);
            });
    },
});

export const { setCurrentCourse, setPage, setPageSize, clearCourses } = courseSlice.actions;
export default courseSlice.reducer;
