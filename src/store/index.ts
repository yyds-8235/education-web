import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import classroomReducer from './slices/classroomSlice';
import testReducer from './slices/testSlice';
import scheduleReducer from './slices/scheduleSlice';
import attendanceReducer from './slices/attendanceSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        course: courseReducer,
        classroom: classroomReducer,
        test: testReducer,
        schedule: scheduleReducer,
        attendance: attendanceReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
    devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
