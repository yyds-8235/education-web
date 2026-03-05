import type { User } from '@/types';

interface MockCredential {
  username: string;
  password: string;
  userId: string;
}

const now = new Date().toISOString();

export const mockUsers: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    realName: '教务处管理员',
    email: 'admin@example.com',
    phone: '13700000000',
    role: 'admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'teacher-1',
    username: 'teacher01',
    realName: '李老师',
    email: 'teacher01@example.com',
    phone: '13800000001',
    role: 'teacher',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-1',
    username: 'student01',
    realName: '王同学',
    email: 'student01@example.com',
    phone: '13900000001',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-2',
    username: 'student02',
    realName: '陈同学',
    email: 'student02@example.com',
    phone: '13900000002',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-3',
    username: 'student03',
    realName: '赵同学',
    email: 'student03@example.com',
    phone: '13900000003',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-4',
    username: 'student04',
    realName: '周同学',
    email: 'student04@example.com',
    phone: '13900000004',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-5',
    username: 'student05',
    realName: '吴同学',
    email: 'student05@example.com',
    phone: '13900000005',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'student-6',
    username: 'student06',
    realName: '郑同学',
    email: 'student06@example.com',
    phone: '13900000006',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockCredentials: MockCredential[] = [
  { username: 'admin', password: '123456', userId: 'admin-1' },
  { username: 'teacher01', password: '123456', userId: 'teacher-1' },
  { username: 'student01', password: '123456', userId: 'student-1' },
  { username: 'student02', password: '123456', userId: 'student-2' },
  { username: 'student03', password: '123456', userId: 'student-3' },
  { username: 'student04', password: '123456', userId: 'student-4' },
  { username: 'student05', password: '123456', userId: 'student-5' },
  { username: 'student06', password: '123456', userId: 'student-6' },
];

export const mockAdmin = mockUsers.find((user) => user.role === 'admin')!;
export const mockTeacher = mockUsers.find((user) => user.role === 'teacher')!;
export const mockStudents = mockUsers.filter((user) => user.role === 'student');
