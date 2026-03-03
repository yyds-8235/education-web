export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
    id: string;
    username: string;
    realName: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status: 'active' | 'inactive' | 'suspended';
    createdAt: string;
    updatedAt: string;
}

export interface Student extends User {
    role: 'student';
    grade: string;
    class: string;
    studentNo: string;
}

export interface Teacher extends User {
    role: 'teacher';
    department: string;
    subjects: string[];
    teacherNo: string;
}

export interface Admin extends User {
    role: 'admin';
    department: string;
    permissions: string[];
}

export interface LoginParams {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    expiresIn: number;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
}
