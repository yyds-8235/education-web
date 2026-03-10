export type UserRole = 'teacher' | 'student' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ManagedUserRole = 'student' | 'teacher';
export type ManagedRole = ManagedUserRole;

export interface User {
    id: string;
    username: string;
    realName: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
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

export interface ManagedUserBase {
    id: string;
    username: string;
    real_name: string;
    email: string;
    phone: string;
    avatar?: string;
    role: ManagedUserRole;
    status: UserStatus;
    created_at: string;
}

export interface ManagedStudent extends ManagedUserBase {
    role: 'student';
    student_no: string;
    grade: string;
    class_name: string;
    guardian: string;
}

export interface ManagedTeacher extends ManagedUserBase {
    role: 'teacher';
    teacher_no: string;
    department: string;
    subjects_json: string[];
}

export type ManagedUser = ManagedStudent | ManagedTeacher;
