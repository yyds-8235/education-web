import request from '@/utils/request';
import type { PaginatedResponse } from '@/types/common';
import type { ManagedRole, ManagedStudent, ManagedTeacher, ManagedUser, UserStatus } from '@/types';

export interface PersonnelFormValues {
  username: string;
  real_name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: UserStatus;
  student_no?: string;
  grade?: string;
  class_name?: string;
  guardian?: string;
  teacher_no?: string;
  department?: string;
  subjects_json?: string[];
}

export interface PersonnelImportResult {
  importedCount: number;
  skippedCount: number;
  failedRows?: Array<{
    rowNumber: number;
    reason: string;
  }>;
}

export interface PersonnelAvatarUploadResult {
  url: string;
}

export type PersonnelListResult = PaginatedResponse<ManagedUser>;

type PersonnelApiRecord = Record<string, unknown>;

const getResourcePath = (role: ManagedRole): string =>
  role === 'student' ? '/admin/students' : '/admin/teachers';

const readString = (record: PersonnelApiRecord, keys: string[], fallback = ''): string => {
  const key = keys.find((item) => record[item] !== undefined && record[item] !== null);
  if (!key) {
    return fallback;
  }

  return String(record[key] ?? fallback);
};

const readStringArray = (record: PersonnelApiRecord, keys: string[]): string[] => {
  const key = keys.find((item) => record[item] !== undefined && record[item] !== null);
  if (!key) {
    return [];
  }

  const value = record[key];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[|,，、/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const readStatus = (record: PersonnelApiRecord): UserStatus => {
  const status = readString(record, ['status'], 'active');
  if (status === 'inactive' || status === 'suspended') {
    return status;
  }

  return 'active';
};

const mapStudentRecord = (record: PersonnelApiRecord): ManagedStudent => ({
  id: readString(record, ['id', 'studentId']),
  username: readString(record, ['username']),
  real_name: readString(record, ['real_name', 'realName', 'name']),
  email: readString(record, ['email']),
  phone: readString(record, ['phone']),
  avatar: readString(record, ['avatar']),
  role: 'student',
  status: readStatus(record),
  created_at: readString(record, ['created_at', 'createdAt']),
  student_no: readString(record, ['student_no', 'studentNo']),
  grade: readString(record, ['grade']),
  class_name: readString(record, ['class_name', 'className', 'class']),
  guardian: readString(record, ['guardian']),
});

const mapTeacherRecord = (record: PersonnelApiRecord): ManagedTeacher => ({
  id: readString(record, ['id', 'teacherId']),
  username: readString(record, ['username']),
  real_name: readString(record, ['real_name', 'realName', 'name']),
  email: readString(record, ['email']),
  phone: readString(record, ['phone']),
  avatar: readString(record, ['avatar']),
  role: 'teacher',
  status: readStatus(record),
  created_at: readString(record, ['created_at', 'createdAt']),
  teacher_no: readString(record, ['teacher_no', 'teacherNo']),
  department: readString(record, ['department']),
  subjects_json: readStringArray(record, ['subjects_json', 'subjectsJson', 'subjects']),
});

const mapPersonnelRecord = (role: ManagedRole, record: PersonnelApiRecord): ManagedUser =>
  role === 'student' ? mapStudentRecord(record) : mapTeacherRecord(record);

const extractListResult = (role: ManagedRole, data: unknown): PersonnelListResult => {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const payload = data as {
      list?: unknown;
      items?: unknown;
      total?: unknown;
      page?: unknown;
      pageSize?: unknown;
      totalPages?: unknown;
    };
    const rawList = payload.list ?? payload.items;
    const list = Array.isArray(rawList)
      ? rawList.filter((item): item is PersonnelApiRecord => typeof item === 'object' && item !== null)
      : [];
    const total = Number(payload.total ?? list.length);
    const pageSize = Number(payload.pageSize ?? (list.length || 10));
    const page = Number(payload.page ?? 1);
    const totalPages = Number(payload.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))));

    return {
      list: list.map((item) => mapPersonnelRecord(role, item)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  if (Array.isArray(data)) {
    const list = data.filter((item): item is PersonnelApiRecord => typeof item === 'object' && item !== null);
    return {
      list: list.map((item) => mapPersonnelRecord(role, item)),
      total: list.length,
      page: 1,
      pageSize: list.length || 10,
      totalPages: 1,
    };
  }

  return {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  };
};

const toStudentPayload = (values: PersonnelFormValues) => ({
  username: values.username,
  realName: values.real_name,
  email: values.email,
  phone: values.phone,
  avatar: values.avatar,
  status: values.status,
  studentNo: values.student_no,
  grade: values.grade,
  className: values.class_name,
  guardian: values.guardian,
});

const toTeacherPayload = (values: PersonnelFormValues) => ({
  username: values.username,
  realName: values.real_name,
  email: values.email,
  phone: values.phone,
  avatar: values.avatar,
  status: values.status,
  teacherNo: values.teacher_no,
  department: values.department,
  subjects: values.subjects_json ?? [],
});

const toPersonnelPayload = (role: ManagedRole, values: PersonnelFormValues) =>
  role === 'student' ? toStudentPayload(values) : toTeacherPayload(values);

export const getPersonnelList = async (role: ManagedRole): Promise<PersonnelListResult> => {
  const response = await request.get(getResourcePath(role));
  return extractListResult(role, response.data.data);
};

export const getPersonnelById = async (role: ManagedRole, id: string): Promise<ManagedUser> => {
  const response = await request.get(`${getResourcePath(role)}/${id}`);
  return mapPersonnelRecord(role, response.data.data as PersonnelApiRecord);
};

export const createPersonnel = async (role: ManagedRole, values: PersonnelFormValues): Promise<ManagedUser> => {
  const response = await request.post(getResourcePath(role), toPersonnelPayload(role, values));
  return mapPersonnelRecord(role, response.data.data as PersonnelApiRecord);
};

export const updatePersonnel = async (
  role: ManagedRole,
  id: string,
  values: PersonnelFormValues,
): Promise<ManagedUser> => {
  const response = await request.put(`${getResourcePath(role)}/${id}`, toPersonnelPayload(role, values));
  return mapPersonnelRecord(role, response.data.data as PersonnelApiRecord);
};

export const deletePersonnel = async (role: ManagedRole, id: string): Promise<{ id: string }> => {
  const response = await request.delete(`${getResourcePath(role)}/${id}`);
  return response.data.data as { id: string };
};

export const importPersonnel = async (
  role: ManagedRole,
  file: File,
): Promise<PersonnelImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post(`${getResourcePath(role)}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = (response.data.data ?? {}) as Record<string, unknown>;

  return {
    importedCount: Number(data.importedCount ?? data.successCount ?? 0),
    skippedCount: Number(data.skippedCount ?? data.ignoredCount ?? 0),
    failedRows: Array.isArray(data.failedRows)
      ? data.failedRows
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            rowNumber: Number(item.rowNumber ?? item.row ?? 0),
            reason: String(item.reason ?? item.message ?? ''),
          }))
      : undefined,
  };
};

export const uploadPersonnelAvatar = async (file: File): Promise<PersonnelAvatarUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post('/admin/personnel/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = response.data.data as Record<string, unknown>;
  return {
    url: String(data.url ?? data.avatarUrl ?? ''),
  };
};
