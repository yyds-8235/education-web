﻿import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  CheckInRecord,
  CheckInSession,
  Classroom,
  ClassroomInteraction,
  RandomPickRecord,
  SendMessageParams,
  StartCheckInParams,
  StartClassroomParams,
} from '@/types';
import type { RootState } from '@/store';
import { generateId } from '@/utils/generator';

interface ClassroomState {
  classrooms: Classroom[];
  currentClassroom: Classroom | null;
  activeCheckInSession: CheckInSession | null;
  interactions: ClassroomInteraction[];
  randomPickRecords: RandomPickRecord[];
  loading: boolean;
  connected: boolean;
}

const initialState: ClassroomState = {
  classrooms: [],
  currentClassroom: null,
  activeCheckInSession: null,
  interactions: [],
  randomPickRecords: [],
  loading: false,
  connected: false,
};

const buildCheckInRecords = (state: RootState, classroomId: string, courseId: string): CheckInRecord[] => {
  const students = state.course.courseStudentMap[courseId] ?? [];
  const now = new Date().toISOString();

  return students.map((student) => ({
    id: generateId(),
    classroomId,
    studentId: student.studentId,
    studentName: student.studentName,
    studentNo: student.studentNo,
    status: 'unchecked',
    createdAt: now,
  }));
};

export const startClassroom = createAsyncThunk(
  'classroom/startClassroom',
  async (params: StartClassroomParams, { getState }) => {
    const state = getState() as RootState;
    const course = state.course.allCourses.find((item) => item.id === params.courseId);
    const user = state.auth.user;

    if (!course) {
      throw new Error('课程不存在');
    }

    if (!user || user.role !== 'teacher') {
      throw new Error('仅教师可发起授课');
    }

    if (course.teacherId !== user.id) {
      throw new Error('只能发起自己创建课程的授课');
    }

    const activeClassroom = state.classroom.classrooms.find(
      (item) => item.courseId === params.courseId && item.status === 'active'
    );

    if (activeClassroom) {
      return activeClassroom;
    }

    const classroomId = generateId();

    return {
      id: classroomId,
      courseId: course.id,
      courseName: course.name,
      teacherId: user.id,
      teacherName: user.realName,
      status: 'active',
      startTime: new Date().toISOString(),
      checkInRecords: buildCheckInRecords(state, classroomId, course.id),
      interactions: [],
      randomPickRecords: [],
    } as Classroom;
  }
);

export const endClassroom = createAsyncThunk(
  'classroom/endClassroom',
  async (classroomId: string, { getState }) => {
    const state = getState() as RootState;
    const classroom = state.classroom.classrooms.find((item) => item.id === classroomId);

    if (!classroom) {
      throw new Error('课堂不存在');
    }

    return {
      ...classroom,
      status: 'ended' as const,
      endTime: new Date().toISOString(),
    };
  }
);

export const fetchClassroom = createAsyncThunk(
  'classroom/fetchClassroom',
  async (classroomId: string, { getState }) => {
    const state = getState() as RootState;
    const classroom = state.classroom.classrooms.find((item) => item.id === classroomId);
    if (!classroom) {
      throw new Error('课堂不存在');
    }

    return classroom;
  }
);

export const startCheckIn = createAsyncThunk(
  'classroom/startCheckIn',
  async (params: StartCheckInParams, { getState }) => {
    const state = getState() as RootState;
    const classroom = state.classroom.classrooms.find((item) => item.id === params.classroomId);

    if (!classroom) {
      throw new Error('课堂不存在');
    }

    const records = buildCheckInRecords(state, classroom.id, classroom.courseId);
    return {
      id: generateId(),
      classroomId: classroom.id,
      duration: params.duration,
      status: 'active' as const,
      startTime: new Date().toISOString(),
      records,
    };
  }
);

export const endCheckIn = createAsyncThunk(
  'classroom/endCheckIn',
  async (
    { classroomId, sessionId }: { classroomId: string; sessionId: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const session = state.classroom.activeCheckInSession;

    if (!session || session.id !== sessionId || session.classroomId !== classroomId) {
      throw new Error('签到会话不存在');
    }

    return {
      ...session,
      status: 'ended' as const,
      endTime: new Date().toISOString(),
    };
  }
);

export const studentCheckIn = createAsyncThunk(
  'classroom/studentCheckIn',
  async (
    { classroomId, sessionId }: { classroomId: string; sessionId: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    const session = state.classroom.activeCheckInSession;

    if (!user || user.role !== 'student') {
      throw new Error('仅学生可签到');
    }

    if (!session || session.classroomId !== classroomId || session.id !== sessionId) {
      throw new Error('签到尚未开启');
    }

    const target = session.records.find((record) => record.studentId === user.id);
    if (!target) {
      throw new Error('你未加入该课程，无法签到');
    }

    if (target.status === 'checked') {
      throw new Error('你已签到');
    }

    return {
      sessionId,
      studentId: user.id,
      checkInTime: new Date().toISOString(),
    };
  }
);

export const sendMessage = createAsyncThunk(
  'classroom/sendMessage',
  async (params: SendMessageParams, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user) {
      throw new Error('未登录');
    }

    return {
      id: generateId(),
      classroomId: params.classroomId,
      topic: params.topic,
      senderId: user.id,
      senderName: user.realName,
      senderRole: user.role === 'teacher' ? 'teacher' : 'student',
      content: params.content,
      createdAt: new Date().toISOString(),
    } as ClassroomInteraction;
  }
);

export const fetchInteractions = createAsyncThunk(
  'classroom/fetchInteractions',
  async (classroomId: string, { getState }) => {
    const state = getState() as RootState;
    const classroom = state.classroom.classrooms.find((item) => item.id === classroomId);
    return classroom?.interactions ?? [];
  }
);

const shuffle = <T,>(input: T[]) => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

export const randomPick = createAsyncThunk(
  'classroom/randomPick',
  async (
    { classroomId, count, excludeIds }: { classroomId: string; count: number; excludeIds?: string[] },
    { getState }
  ) => {
    const state = getState() as RootState;
    const classroom = state.classroom.classrooms.find((item) => item.id === classroomId);

    if (!classroom) {
      throw new Error('课堂不存在');
    }

    const allStudents = state.course.courseStudentMap[classroom.courseId] ?? [];
    const excludeSet = new Set(excludeIds ?? []);
    const candidates = allStudents.filter((student) => !excludeSet.has(student.studentId));

    if (candidates.length === 0) {
      throw new Error('没有可抽取的学生');
    }

    const picked = shuffle(candidates).slice(0, Math.max(1, count));

    return {
      id: generateId(),
      classroomId,
      studentIds: picked.map((student) => student.studentId),
      studentNames: picked.map((student) => student.studentName),
      pickedAt: new Date().toISOString(),
    } as RandomPickRecord;
  }
);

const updateClassroom = (state: ClassroomState, classroom: Classroom) => {
  const index = state.classrooms.findIndex((item) => item.id === classroom.id);
  if (index === -1) {
    state.classrooms.unshift(classroom);
  } else {
    state.classrooms[index] = classroom;
  }

  if (state.currentClassroom?.id === classroom.id) {
    state.currentClassroom = classroom;
  }
};

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
        updateClassroom(state, action.payload);
        state.currentClassroom = action.payload;
        state.interactions = action.payload.interactions;
        state.randomPickRecords = action.payload.randomPickRecords;
      })
      .addCase(startClassroom.rejected, (state) => {
        state.loading = false;
      })
      .addCase(endClassroom.fulfilled, (state, action) => {
        updateClassroom(state, action.payload);
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

        if (state.currentClassroom?.id === action.payload.classroomId) {
          state.currentClassroom.checkInRecords = action.payload.records;
          updateClassroom(state, state.currentClassroom);
        }
      })
      .addCase(endCheckIn.fulfilled, (state, action) => {
        state.activeCheckInSession = action.payload;

        if (state.currentClassroom?.id === action.payload.classroomId) {
          state.currentClassroom.checkInRecords = action.payload.records;
          updateClassroom(state, state.currentClassroom);
        }
      })
      .addCase(studentCheckIn.fulfilled, (state, action) => {
        if (!state.activeCheckInSession || state.activeCheckInSession.id !== action.payload.sessionId) {
          return;
        }

        const record = state.activeCheckInSession.records.find(
          (item) => item.studentId === action.payload.studentId
        );
        if (record) {
          record.status = 'checked';
          record.checkInTime = action.payload.checkInTime;
        }

        if (state.currentClassroom?.id === state.activeCheckInSession.classroomId) {
          state.currentClassroom.checkInRecords = state.activeCheckInSession.records;
          updateClassroom(state, state.currentClassroom);
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.interactions.push(action.payload);

        if (state.currentClassroom?.id === action.payload.classroomId) {
          state.currentClassroom.interactions = state.interactions;
          updateClassroom(state, state.currentClassroom);
        }
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.interactions = action.payload;
      })
      .addCase(randomPick.fulfilled, (state, action) => {
        state.randomPickRecords.unshift(action.payload);

        if (state.currentClassroom?.id === action.payload.classroomId) {
          state.currentClassroom.randomPickRecords = state.randomPickRecords;
          updateClassroom(state, state.currentClassroom);
        }
      });
  },
});

export const { setConnected, addInteraction, updateCheckInSession, clearClassroom } = classroomSlice.actions;
export default classroomSlice.reducer;
