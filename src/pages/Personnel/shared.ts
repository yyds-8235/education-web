import type { ManagedStudent, ManagedTeacher, ManagedUser, UserStatus } from '@/types';

export const statusTextMap: Record<UserStatus, string> = {
  active: '启用',
  inactive: '停用',
  suspended: '冻结',
};

export const statusColorMap: Record<UserStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  suspended: 'warning',
};

export const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '冻结', value: 'suspended' },
] as const;

export const gradeOptions = ['初一', '初二', '初三', '高一', '高二', '高三'];

export const classOptions = ['1班', '2班', '3班', '4班'];

export const departmentOptions = [ '初中部', '高中部'];

export const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '日语', '多媒体'];

export const getPersonnelMeta = (role: 'student' | 'teacher') => {
  if (role === 'student') {
    return {
      roleLabel: '学生',
      title: '学生管理',
      createLabel: '新增学生',
      detailLabel: '学生详情',
      editLabel: '编辑学生',
      listPath: '/personnel/students',
      createPath: '/personnel/students/new',
    };
  }

  return {
    roleLabel: '教师',
    title: '教师管理',
    createLabel: '新增教师',
    detailLabel: '教师详情',
    editLabel: '编辑教师',
    listPath: '/personnel/teachers',
    createPath: '/personnel/teachers/new',
  };
};

export const isStudentRecord = (record: ManagedUser): record is ManagedStudent => record.role === 'student';

export const isTeacherRecord = (record: ManagedUser): record is ManagedTeacher => record.role === 'teacher';
