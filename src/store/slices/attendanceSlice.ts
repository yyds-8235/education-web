import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AttendanceRecord, AttendanceStatistics, ClassAttendanceReport, GradeAttendanceReport, AttendanceQueryParams } from '@/types';
import request from '@/utils/request';

interface AttendanceState {
    records: AttendanceRecord[];
    statistics: AttendanceStatistics[];
    classReport: ClassAttendanceReport | null;
    gradeReport: GradeAttendanceReport | null;
    loading: boolean;
}

const initialState: AttendanceState = {
    records: [],
    statistics: [],
    classReport: null,
    gradeReport: null,
    loading: false,
};

export const fetchAttendanceRecords = createAsyncThunk(
    'attendance/fetchAttendanceRecords',
    async (params: AttendanceQueryParams) => {
        const response = await request.get<AttendanceRecord[]>('/attendance/records', { params });
        return response.data;
    }
);

export const fetchAttendanceStatistics = createAsyncThunk(
    'attendance/fetchAttendanceStatistics',
    async (params: { grade: string; class: string; startDate: string; endDate: string }) => {
        const response = await request.get<AttendanceStatistics[]>('/attendance/statistics', { params });
        return response.data;
    }
);

export const fetchClassReport = createAsyncThunk(
    'attendance/fetchClassReport',
    async (params: { grade: string; class: string; date: string }) => {
        const response = await request.get<ClassAttendanceReport>('/attendance/reports/class', { params });
        return response.data;
    }
);

export const fetchGradeReport = createAsyncThunk(
    'attendance/fetchGradeReport',
    async (params: { grade: string; date: string }) => {
        const response = await request.get<GradeAttendanceReport>('/attendance/reports/grade', { params });
        return response.data;
    }
);

export const markException = createAsyncThunk(
    'attendance/markException',
    async ({ recordId, note }: { recordId: string; note: string }) => {
        const response = await request.put<AttendanceRecord>(`/attendance/records/${recordId}/exception`, { note });
        return response.data;
    }
);

export const exportAttendanceReport = createAsyncThunk(
    'attendance/exportAttendanceReport',
    async (params: AttendanceQueryParams & { type: 'personal' | 'class' | 'grade'; format: 'excel' | 'pdf' }) => {
        const response = await request.post<{ url: string }>('/attendance/export', params);
        return response.data;
    }
);

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        clearRecords: (state) => {
            state.records = [];
        },
        clearReports: (state) => {
            state.classReport = null;
            state.gradeReport = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAttendanceRecords.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
                state.loading = false;
                state.records = action.payload;
            })
            .addCase(fetchAttendanceRecords.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchAttendanceStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            })
            .addCase(fetchClassReport.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchClassReport.fulfilled, (state, action) => {
                state.loading = false;
                state.classReport = action.payload;
            })
            .addCase(fetchClassReport.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchGradeReport.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGradeReport.fulfilled, (state, action) => {
                state.loading = false;
                state.gradeReport = action.payload;
            })
            .addCase(fetchGradeReport.rejected, (state) => {
                state.loading = false;
            })
            .addCase(markException.fulfilled, (state, action) => {
                const index = state.records.findIndex((r) => r.id === action.payload.id);
                if (index !== -1) {
                    state.records[index] = action.payload;
                }
            });
    },
});

export const { clearRecords, clearReports } = attendanceSlice.actions;
export default attendanceSlice.reducer;
