import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Classroom, CheckInSession, ClassroomInteraction, RandomPickRecord, StartClassroomParams, StartCheckInParams, SendMessageParams } from '@/types';
import request from '@/utils/request';

interface ClassroomState {
    currentClassroom: Classroom | null;
    activeCheckInSession: CheckInSession | null;
    interactions: ClassroomInteraction[];
    randomPickRecords: RandomPickRecord[];
    loading: boolean;
    connected: boolean;
}

const initialState: ClassroomState = {
    currentClassroom: null,
    activeCheckInSession: null,
    interactions: [],
    randomPickRecords: [],
    loading: false,
    connected: false,
};

export const startClassroom = createAsyncThunk(
    'classroom/startClassroom',
    async (params: StartClassroomParams) => {
        const response = await request.post<Classroom>('/classrooms/start', params);
        return response.data;
    }
);

export const endClassroom = createAsyncThunk(
    'classroom/endClassroom',
    async (classroomId: string) => {
        const response = await request.post<Classroom>(`/classrooms/${classroomId}/end`);
        return response.data;
    }
);

export const fetchClassroom = createAsyncThunk(
    'classroom/fetchClassroom',
    async (classroomId: string) => {
        const response = await request.get<Classroom>(`/classrooms/${classroomId}`);
        return response.data;
    }
);

export const startCheckIn = createAsyncThunk(
    'classroom/startCheckIn',
    async (params: StartCheckInParams) => {
        const response = await request.post<CheckInSession>(
            `/classrooms/${params.classroomId}/checkin/start`,
            { duration: params.duration }
        );
        return response.data;
    }
);

export const endCheckIn = createAsyncThunk(
    'classroom/endCheckIn',
    async ({ classroomId, sessionId }: { classroomId: string; sessionId: string }) => {
        const response = await request.post<CheckInSession>(
            `/classrooms/${classroomId}/checkin/${sessionId}/end`
        );
        return response.data;
    }
);

export const studentCheckIn = createAsyncThunk(
    'classroom/studentCheckIn',
    async ({ classroomId, sessionId }: { classroomId: string; sessionId: string }) => {
        const response = await request.post(
            `/classrooms/${classroomId}/checkin/${sessionId}/check`
        );
        return response.data;
    }
);

export const sendMessage = createAsyncThunk(
    'classroom/sendMessage',
    async (params: SendMessageParams) => {
        const response = await request.post<ClassroomInteraction>(
            `/classrooms/${params.classroomId}/interactions`,
            { content: params.content, topic: params.topic }
        );
        return response.data;
    }
);

export const fetchInteractions = createAsyncThunk(
    'classroom/fetchInteractions',
    async (classroomId: string) => {
        const response = await request.get<ClassroomInteraction[]>(
            `/classrooms/${classroomId}/interactions`
        );
        return response.data;
    }
);

export const randomPick = createAsyncThunk(
    'classroom/randomPick',
    async ({ classroomId, count, excludeIds }: { classroomId: string; count: number; excludeIds?: string[] }) => {
        const response = await request.post<RandomPickRecord>(
            `/classrooms/${classroomId}/random-pick`,
            { count, excludeIds }
        );
        return response.data;
    }
);

const classroomSlice = createSlice({
    name: 'classroom',
    initialState,
    reducers: {
        setConnected: (state, action) => {
            state.connected = action.payload;
        },
        addInteraction: (state, action) => {
            state.interactions.push(action.payload);
        },
        updateCheckInSession: (state, action) => {
            state.activeCheckInSession = action.payload;
        },
        clearClassroom: (state) => {
            state.currentClassroom = null;
            state.activeCheckInSession = null;
            state.interactions = [];
            state.randomPickRecords = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(startClassroom.pending, (state) => {
                state.loading = true;
            })
            .addCase(startClassroom.fulfilled, (state, action) => {
                state.loading = false;
                state.currentClassroom = action.payload;
            })
            .addCase(startClassroom.rejected, (state) => {
                state.loading = false;
            })
            .addCase(endClassroom.fulfilled, (state, action) => {
                state.currentClassroom = action.payload;
                state.activeCheckInSession = null;
            })
            .addCase(fetchClassroom.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchClassroom.fulfilled, (state, action) => {
                state.loading = false;
                state.currentClassroom = action.payload;
                state.interactions = action.payload.interactions;
                state.randomPickRecords = action.payload.randomPickRecords;
            })
            .addCase(fetchClassroom.rejected, (state) => {
                state.loading = false;
            })
            .addCase(startCheckIn.fulfilled, (state, action) => {
                state.activeCheckInSession = action.payload;
            })
            .addCase(endCheckIn.fulfilled, (state, action) => {
                state.activeCheckInSession = action.payload;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.interactions.push(action.payload);
            })
            .addCase(fetchInteractions.fulfilled, (state, action) => {
                state.interactions = action.payload;
            })
            .addCase(randomPick.fulfilled, (state, action) => {
                state.randomPickRecords.push(action.payload);
            });
    },
});

export const { setConnected, addInteraction, updateCheckInSession, clearClassroom } = classroomSlice.actions;
export default classroomSlice.reducer;
