﻿﻿﻿import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthState, LoginParams, User } from '@/types';
import { loginApi, getCurrentUserApi } from '@/services/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'userInfo';

const readPersistedUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const persistedUser = readPersistedUser();
const persistedToken = localStorage.getItem(TOKEN_KEY);

const initialState: AuthState = {
  user: persistedUser,
  token: persistedToken,
  isAuthenticated: Boolean(persistedUser && persistedToken),
  loading: false,
};

export const login = createAsyncThunk('auth/login', async (params: LoginParams) => {
  const response = await loginApi(params);
  return response;
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('未登录');
  }

  const user = await getCurrentUserApi();
  return user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem(TOKEN_KEY, action.payload);
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
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
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
  },
});

export const { setToken, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
