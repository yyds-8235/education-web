import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User, LoginParams, AuthState } from '@/types';
import request from '@/utils/request';

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: false,
};

export const login = createAsyncThunk(
    'auth/login',
    async (params: LoginParams) => {
        const response = await request.post<{ token: string; user: User; expiresIn: number }>(
            '/auth/login',
            params
        );
        return response.data;
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async () => {
        const response = await request.get<User>('/auth/me');
        return response.data;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('token', action.payload);
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(login.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.loading = false;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            });
    },
});

export const { setToken, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
