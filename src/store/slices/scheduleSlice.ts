import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Schedule, ScheduleConflict, CreateScheduleParams, ScheduleQueryParams, TempAdjustment, SubstituteRecord } from '@/types';
import request from '@/utils/request';

interface ScheduleState {
    schedules: Schedule[];
    conflicts: ScheduleConflict[];
    tempAdjustments: TempAdjustment[];
    substituteRecords: SubstituteRecord[];
    loading: boolean;
}

const initialState: ScheduleState = {
    schedules: [],
    conflicts: [],
    tempAdjustments: [],
    substituteRecords: [],
    loading: false,
};

export const fetchSchedules = createAsyncThunk(
    'schedule/fetchSchedules',
    async (params: ScheduleQueryParams) => {
        const response = await request.get<Schedule[]>('/schedules', { params });
        return response.data;
    }
);

export const createSchedule = createAsyncThunk(
    'schedule/createSchedule',
    async (params: CreateScheduleParams, { rejectWithValue }) => {
        try {
            const response = await request.post<Schedule>('/schedules', params);
            return response.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { conflicts?: ScheduleConflict[] } } };
            if (err.response?.data?.conflicts) {
                return rejectWithValue(err.response.data.conflicts);
            }
            throw error;
        }
    }
);

export const updateSchedule = createAsyncThunk(
    'schedule/updateSchedule',
    async ({ id, ...params }: { id: string } & Partial<CreateScheduleParams>) => {
        const response = await request.put<Schedule>(`/schedules/${id}`, params);
        return response.data;
    }
);

export const deleteSchedule = createAsyncThunk(
    'schedule/deleteSchedule',
    async (id: string) => {
        await request.delete(`/schedules/${id}`);
        return id;
    }
);

export const autoArrange = createAsyncThunk(
    'schedule/autoArrange',
    async (params: { grade: string; class: string }) => {
        const response = await request.post<Schedule[]>('/schedules/auto-arrange', params);
        return response.data;
    }
);

export const checkConflicts = createAsyncThunk(
    'schedule/checkConflicts',
    async (params: CreateScheduleParams) => {
        const response = await request.post<ScheduleConflict[]>('/schedules/check-conflicts', params);
        return response.data;
    }
);

export const createTempAdjustment = createAsyncThunk(
    'schedule/createTempAdjustment',
    async (params: Omit<TempAdjustment, 'id' | 'status' | 'createdAt'>) => {
        const response = await request.post<TempAdjustment>('/schedules/temp-adjustment', params);
        return response.data;
    }
);

export const createSubstitute = createAsyncThunk(
    'schedule/createSubstitute',
    async (params: Omit<SubstituteRecord, 'id' | 'createdAt'>) => {
        const response = await request.post<SubstituteRecord>('/schedules/substitute', params);
        return response.data;
    }
);

export const fetchTempAdjustments = createAsyncThunk(
    'schedule/fetchTempAdjustments',
    async (params: { grade?: string; class?: string }) => {
        const response = await request.get<TempAdjustment[]>('/schedules/temp-adjustments', { params });
        return response.data;
    }
);

export const fetchSubstituteRecords = createAsyncThunk(
    'schedule/fetchSubstituteRecords',
    async (params: { grade?: string; class?: string }) => {
        const response = await request.get<SubstituteRecord[]>('/schedules/substitutes', { params });
        return response.data;
    }
);

const scheduleSlice = createSlice({
    name: 'schedule',
    initialState,
    reducers: {
        clearConflicts: (state) => {
            state.conflicts = [];
        },
        setSchedules: (state, action) => {
            state.schedules = action.payload;
        },
        updateScheduleLocal: (state, action) => {
            const index = state.schedules.findIndex((s) => s.id === action.payload.id);
            if (index !== -1) {
                state.schedules[index] = { ...state.schedules[index], ...action.payload.changes };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSchedules.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSchedules.fulfilled, (state, action) => {
                state.loading = false;
                state.schedules = action.payload;
            })
            .addCase(fetchSchedules.rejected, (state) => {
                state.loading = false;
            })
            .addCase(createSchedule.fulfilled, (state, action) => {
                state.schedules.push(action.payload);
                state.conflicts = [];
            })
            .addCase(createSchedule.rejected, (state, action) => {
                if (action.payload) {
                    state.conflicts = action.payload as ScheduleConflict[];
                }
            })
            .addCase(updateSchedule.fulfilled, (state, action) => {
                const index = state.schedules.findIndex((s) => s.id === action.payload.id);
                if (index !== -1) {
                    state.schedules[index] = action.payload;
                }
            })
            .addCase(deleteSchedule.fulfilled, (state, action) => {
                state.schedules = state.schedules.filter((s) => s.id !== action.payload);
            })
            .addCase(autoArrange.fulfilled, (state, action) => {
                state.schedules = action.payload;
            })
            .addCase(checkConflicts.fulfilled, (state, action) => {
                state.conflicts = action.payload;
            })
            .addCase(createTempAdjustment.fulfilled, (state, action) => {
                state.tempAdjustments.push(action.payload);
            })
            .addCase(createSubstitute.fulfilled, (state, action) => {
                state.substituteRecords.push(action.payload);
            })
            .addCase(fetchTempAdjustments.fulfilled, (state, action) => {
                state.tempAdjustments = action.payload;
            })
            .addCase(fetchSubstituteRecords.fulfilled, (state, action) => {
                state.substituteRecords = action.payload;
            });
    },
});

export const { clearConflicts, setSchedules, updateScheduleLocal } = scheduleSlice.actions;
export default scheduleSlice.reducer;
