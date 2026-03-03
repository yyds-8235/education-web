import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark';
    loading: boolean;
    globalLoading: boolean;
    notifications: Notification[];
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    description?: string;
    duration?: number;
}

const initialState: UIState = {
    sidebarCollapsed: false,
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    loading: false,
    globalLoading: false,
    notifications: [],
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.sidebarCollapsed = action.payload;
        },
        setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
            state.theme = action.payload;
            localStorage.setItem('theme', action.payload);
            document.documentElement.setAttribute('data-theme', action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setGlobalLoading: (state, action: PayloadAction<boolean>) => {
            state.globalLoading = action.payload;
        },
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
            state.notifications.push({
                ...action.payload,
                id: Date.now().toString(),
            });
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
    },
});

export const {
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    setLoading,
    setGlobalLoading,
    addNotification,
    removeNotification,
    clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
