import type {
  ManagedRole,
  ManagedStudent,
  ManagedTeacher,
  ManagedUser,
  UserStatus,
} from '@/types';
import { generateId } from '@/utils/generator';

const PERSONNEL_STORAGE_KEY = 'education.personnel.store';

interface PersonnelStore {
  students: ManagedStudent[];
  teachers: ManagedTeacher[];
}

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

const defaultStudents: ManagedStudent[] = [
  {
    id: 'managed-student-1',
    username: 'stu2026001',
    real_name: '王晨曦',
    email: 'stu2026001@example.com',
    phone: '13800010001',
    avatar: '',
    role: 'student',
    status: 'active',
    created_at: '2026-02-18 09:30:00',
    student_no: '2026001',
    grade: '七年级',
    class_name: '1班',
    guardian: '王建国',
  },
  {
    id: 'managed-student-2',
    username: 'stu2026002',
    real_name: '李欣怡',
    email: 'stu2026002@example.com',
    phone: '13800010002',
    avatar: '',
    role: 'student',
    status: 'active',
    created_at: '2026-02-19 10:15:00',
    student_no: '2026002',
    grade: '七年级',
    class_name: '2班',
    guardian: '李敏',
  },
  {
    id: 'managed-student-3',
    username: 'stu2025008',
    real_name: '陈浩然',
    email: 'stu2025008@example.com',
    phone: '13800010008',
    avatar: '',
    role: 'student',
    status: 'inactive',
    created_at: '2026-01-12 14:20:00',
    student_no: '2025008',
    grade: '八年级',
    class_name: '1班',
    guardian: '陈伟',
  },
  {
    id: 'managed-student-4',
    username: 'stu2024016',
    real_name: '赵子涵',
    email: 'stu2024016@example.com',
    phone: '13800010016',
    avatar: '',
    role: 'student',
    status: 'suspended',
    created_at: '2025-12-28 08:45:00',
    student_no: '2024016',
    grade: '九年级',
    class_name: '3班',
    guardian: '赵静',
  },
];

const defaultTeachers: ManagedTeacher[] = [
  {
    id: 'managed-teacher-1',
    username: 'teacher_zhang',
    real_name: '张老师',
    email: 'teacher_zhang@example.com',
    phone: '13900020001',
    avatar: '',
    role: 'teacher',
    status: 'active',
    created_at: '2026-01-08 08:30:00',
    teacher_no: 'T2026001',
    department: '初中部',
    subjects_json: ['化学', '多媒体'],
  },
  {
    id: 'managed-teacher-2',
    username: 'teacher_wang',
    real_name: '王老师',
    email: 'teacher_wang@example.com',
    phone: '13900020002',
    avatar: '',
    role: 'teacher',
    status: 'active',
    created_at: '2026-01-10 11:00:00',
    teacher_no: 'T2026002',
    department: '高中部',
    subjects_json: ['英语'],
  },
  {
    id: 'managed-teacher-3',
    username: 'teacher_liu',
    real_name: '刘老师',
    email: 'teacher_liu@example.com',
    phone: '13900020003',
    avatar: '',
    role: 'teacher',
    status: 'inactive',
    created_at: '2025-11-20 15:40:00',
    teacher_no: 'T2025018',
    department: '初中部',
    subjects_json: ['语文', '班主任'],
  },
];

const cloneStudent = (student: ManagedStudent): ManagedStudent => ({
  ...student,
});

const cloneTeacher = (teacher: ManagedTeacher): ManagedTeacher => ({
  ...teacher,
  subjects_json: [...teacher.subjects_json],
});

const createDefaultStore = (): PersonnelStore => ({
  students: defaultStudents.map(cloneStudent),
  teachers: defaultTeachers.map(cloneTeacher),
});

const cloneStore = (store: PersonnelStore): PersonnelStore => ({
  students: store.students.map(cloneStudent),
  teachers: store.teachers.map(cloneTeacher),
});

const readStore = (): PersonnelStore => {
  if (typeof window === 'undefined') {
    return createDefaultStore();
  }

  const cached = window.localStorage.getItem(PERSONNEL_STORAGE_KEY);
  if (!cached) {
    const initialStore = createDefaultStore();
    window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(initialStore));
    return initialStore;
  }

  try {
    const parsed = JSON.parse(cached) as PersonnelStore;
    return cloneStore(parsed);
  } catch {
    const fallbackStore = createDefaultStore();
    window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(fallbackStore));
    return fallbackStore;
  }
};

const writeStore = (store: PersonnelStore): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(store));
};

const isStudentRole = (role: ManagedRole): role is 'student' => role === 'student';

const sortByCreatedAtDesc = <T extends ManagedUser>(records: T[]): T[] =>
  [...records].sort((left, right) => right.created_at.localeCompare(left.created_at));

export const getPersonnelList = (role: ManagedRole): ManagedUser[] => {
  const store = readStore();
  return isStudentRole(role)
    ? sortByCreatedAtDesc(store.students)
    : sortByCreatedAtDesc(store.teachers);
};

export const getPersonnelById = (role: ManagedRole, id: string): ManagedUser | undefined => {
  return getPersonnelList(role).find((item) => item.id === id);
};

export const createPersonnel = (role: ManagedRole, values: PersonnelFormValues): ManagedUser => {
  const store = readStore();
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (isStudentRole(role)) {
    const nextStudent: ManagedStudent = {
      id: generateId(),
      username: values.username,
      real_name: values.real_name,
      email: values.email,
      phone: values.phone,
      avatar: values.avatar,
      role: 'student',
      status: values.status,
      created_at: createdAt,
      student_no: values.student_no ?? '',
      grade: values.grade ?? '',
      class_name: values.class_name ?? '',
      guardian: values.guardian ?? '',
    };

    store.students = sortByCreatedAtDesc([nextStudent, ...store.students]);
    writeStore(store);
    return nextStudent;
  }

  const nextTeacher: ManagedTeacher = {
    id: generateId(),
    username: values.username,
    real_name: values.real_name,
    email: values.email,
    phone: values.phone,
    avatar: values.avatar,
    role: 'teacher',
    status: values.status,
    created_at: createdAt,
    teacher_no: values.teacher_no ?? '',
    department: values.department ?? '',
    subjects_json: values.subjects_json ?? [],
  };

  store.teachers = sortByCreatedAtDesc([nextTeacher, ...store.teachers]);
  writeStore(store);
  return nextTeacher;
};

export const updatePersonnel = (
  role: ManagedRole,
  id: string,
  values: PersonnelFormValues,
): ManagedUser | undefined => {
  const store = readStore();

  if (isStudentRole(role)) {
    let updatedStudent: ManagedStudent | undefined;
    store.students = store.students.map((student) => {
      if (student.id !== id) {
        return student;
      }

      updatedStudent = {
        ...student,
        username: values.username,
        real_name: values.real_name,
        email: values.email,
        phone: values.phone,
        avatar: values.avatar,
        status: values.status,
        student_no: values.student_no ?? '',
        grade: values.grade ?? '',
        class_name: values.class_name ?? '',
        guardian: values.guardian ?? '',
      };
      return updatedStudent;
    });

    writeStore(store);
    return updatedStudent;
  }

  let updatedTeacher: ManagedTeacher | undefined;
  store.teachers = store.teachers.map((teacher) => {
    if (teacher.id !== id) {
      return teacher;
    }

    updatedTeacher = {
      ...teacher,
      username: values.username,
      real_name: values.real_name,
      email: values.email,
      phone: values.phone,
      avatar: values.avatar,
      status: values.status,
      teacher_no: values.teacher_no ?? '',
      department: values.department ?? '',
      subjects_json: values.subjects_json ?? [],
    };
    return updatedTeacher;
  });

  writeStore(store);
  return updatedTeacher;
};

export const deletePersonnel = (role: ManagedRole, id: string): boolean => {
  const store = readStore();

  if (isStudentRole(role)) {
    const before = store.students.length;
    store.students = store.students.filter((student) => student.id !== id);
    writeStore(store);
    return before !== store.students.length;
  }

  const before = store.teachers.length;
  store.teachers = store.teachers.filter((teacher) => teacher.id !== id);
  writeStore(store);
  return before !== store.teachers.length;
};
