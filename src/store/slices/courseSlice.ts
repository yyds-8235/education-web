﻿import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  Course,
  CourseChapter,
  CourseQueryParams,
  CourseResource,
  CourseSelectableStudent,
  CourseStudent,
  CreateCourseParams,
  PaginatedResponse,
  UpdateCourseParams,
} from '@/types';
import type { RootState } from '@/store';
import { generateId } from '@/utils/generator';
import { initialCourses, initialCourseStudents } from '@/mock/courses';
import { mockStudents } from '@/mock/users';
import {
  addTeacherCourseStudentsApi,
  createTeacherCourseApi,
  deleteTeacherCourseApi,
  getTeacherCourseCandidateStudentsApi,
  getTeacherCourseDetailApi,
  getTeacherCourseListApi,
  getTeacherCourseStudentsApi,
  removeTeacherCourseStudentApi,
  updateTeacherCourseApi,
} from '@/services/course';

interface CourseState {
  allCourses: Course[];
  courses: Course[];
  currentCourse: Course | null;
  students: CourseStudent[];
  candidateStudents: CourseSelectableStudent[];
  courseStudentMap: Record<string, CourseStudent[]>;
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
}

const initialState: CourseState = {
  allCourses: initialCourses,
  courses: initialCourses,
  currentCourse: null,
  students: [],
  candidateStudents: [],
  courseStudentMap: initialCourseStudents,
  loading: false,
  total: initialCourses.length,
  page: 1,
  pageSize: 10,
};

const applyCourseFilters = (
  list: Course[],
  params: CourseQueryParams,
  state: RootState
): Course[] => {
  const user = state.auth.user;
  let filtered = [...list];

  if (user?.role === 'teacher') {
    if ((params.scope ?? 'mine') === 'mine') {
      filtered = filtered.filter((course) => course.teacherId === user.id);
    }
  }

  if (user?.role === 'student') {
    const joinedIds = new Set(
      Object.entries(state.course.courseStudentMap)
        .filter(([, students]) => students.some((student) => student.studentId === user.id))
        .map(([courseId]) => courseId)
    );

    const scope = params.scope ?? 'joined';
    if (scope === 'joined') {
      filtered = filtered.filter((course) => joinedIds.has(course.id));
    } else if (scope === 'discover') {
      filtered = filtered.filter(
        (course) => course.visibility === 'public' && !joinedIds.has(course.id)
      );
    } else if (scope === 'all') {
      filtered = filtered.filter(
        (course) => joinedIds.has(course.id) || course.visibility === 'public'
      );
    }
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (course) =>
        course.name.toLowerCase().includes(keyword) ||
        (course.description ?? '').toLowerCase().includes(keyword) ||
        course.subject.toLowerCase().includes(keyword)
    );
  }

  if (params.grade) {
    filtered = filtered.filter((course) => course.grade === params.grade);
  }

  if (params.class) {
    filtered = filtered.filter((course) => course.class === params.class);
  }

  if (params.subject) {
    filtered = filtered.filter((course) => course.subject === params.subject);
  }

  if (params.status) {
    filtered = filtered.filter((course) => course.status === params.status);
  }

  return filtered;
};

const buildChapters = (
  courseId: string,
  chapters: CreateCourseParams['chapters']
): CourseChapter[] => {
  if (!chapters || chapters.length === 0) {
    return [];
  }

  return chapters.map((chapter, chapterIndex) => {
    const chapterId = chapter.id ?? generateId();
    const resources: CourseResource[] = (chapter.resources ?? []).map((resource, resourceIndex) => ({
      id: resource.id ?? generateId(),
      chapterId,
      name: resource.name,
      type: resource.type,
      url: resource.url,
      size: resource.size,
      duration: resource.type === 'video' ? Math.max(60, Math.floor(resource.size / 1024 / 6)) : undefined,
      order: resourceIndex + 1,
      createdAt: new Date().toISOString(),
    }));

    return {
      id: chapterId,
      courseId,
      title: chapter.title,
      description: chapter.description,
      order: chapterIndex + 1,
      resources,
      createdAt: new Date().toISOString(),
    };
  });
};

const getPaginatedData = (
  list: Course[],
  page: number,
  pageSize: number
): PaginatedResponse<Course> => {
  const total = list.length;
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  const paged = list.slice(start, start + safePageSize);

  return {
    list: paged,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
};

export const fetchCourses = createAsyncThunk(
  'course/fetchCourses',
  async (params: CourseQueryParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      const response = await getTeacherCourseListApi({
        ...params,
        scope: 'mine',
      });
      return {
        ...response,
        syncAll: true,
      };
    }

    const filtered = applyCourseFilters(state.course.allCourses, params, state);
    return {
      ...getPaginatedData(filtered, params.page, params.pageSize),
      syncAll: false,
    };
  }
);

export const fetchCourseById = createAsyncThunk(
  'course/fetchCourseById',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      return getTeacherCourseDetailApi(id);
    }

    const course = state.course.allCourses.find((item) => item.id === id);
    if (!course) {
      throw new Error('课程不存在');
    }

    return course;
  }
);

export const createCourse = createAsyncThunk(
  'course/createCourse',
  async (params: CreateCourseParams, { getState }) => {
    const state = getState() as RootState;
    const teacher = state.auth.user;

    if (!teacher || teacher.role !== 'teacher') {
      throw new Error('仅教师可以创建课程');
    }

    return createTeacherCourseApi(params);
  }
);

const buildLocalCourse = (
  params: CreateCourseParams,
  teacherId: string,
  teacherName: string,
): Course => {
  const courseId = generateId();
  const now = new Date().toISOString();

  return {
    id: courseId,
    name: params.name,
    description: params.description,
    grade: params.grade,
    class: params.class,
    subject: params.subject,
    teacherId,
    teacherName,
    visibility: params.visibility,
    coverImage: params.coverImage,
    chapters: buildChapters(courseId, params.chapters),
    studentCount: 0,
    status: params.status ?? 'draft',
    createdAt: now,
    updatedAt: now,
  };
};

export const createLocalCourse = createAsyncThunk(
  'course/createLocalCourse',
  async (params: CreateCourseParams, { getState }) => {
    const state = getState() as RootState;
    const teacher = state.auth.user;

    if (!teacher || teacher.role !== 'teacher') {
      throw new Error('仅教师可以创建课程');
    }

    return buildLocalCourse(params, teacher.id, teacher.realName);
  }
);

export const updateCourse = createAsyncThunk(
  'course/updateCourse',
  async (params: UpdateCourseParams, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      const { id, ...payload } = params;
      return updateTeacherCourseApi(id, payload);
    }

    const current = state.course.allCourses.find((course) => course.id === params.id);
    if (!current) {
      throw new Error('课程不存在');
    }

    const updatedAt = new Date().toISOString();
    const chapters =
      params.chapters !== undefined
        ? buildChapters(current.id, params.chapters)
        : current.chapters;

    return {
      ...current,
      ...params,
      chapters,
      studentCount: state.course.courseStudentMap[current.id]?.length ?? current.studentCount,
      updatedAt,
    } as Course;
  }
);

export const deleteCourse = createAsyncThunk(
  'course/deleteCourse',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      await deleteTeacherCourseApi(id);
    }

    return id;
  },
);

export const fetchCourseStudents = createAsyncThunk(
  'course/fetchCourseStudents',
  async (courseId: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      return getTeacherCourseStudentsApi(courseId);
    }

    return state.course.courseStudentMap[courseId] ?? [];
  }
);

export const fetchCourseCandidateStudents = createAsyncThunk(
  'course/fetchCourseCandidateStudents',
  async (courseId: string, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      return getTeacherCourseCandidateStudentsApi(courseId);
    }

    const existing = state.course.courseStudentMap[courseId] ?? [];
    const joinedSet = new Set(existing.map((item) => item.studentId));
    return mockStudents
      .filter((item) => !joinedSet.has(item.id))
      .map((item, index) => ({
        id: item.id,
        username: item.username,
        realName: item.realName,
        studentNo: `S2026${String(index + 1).padStart(3, '0')}`,
      }));
  },
);

export const addStudentsToCourse = createAsyncThunk(
  'course/addStudentsToCourse',
  async (
    { courseId, studentIds }: { courseId: string; studentIds: string[] },
    { getState }
  ) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      return addTeacherCourseStudentsApi(courseId, studentIds);
    }

    const existing = state.course.courseStudentMap[courseId] ?? [];
    const existingIdSet = new Set(existing.map((item) => item.studentId));

    const newStudents: CourseStudent[] = studentIds
      .filter((studentId) => !existingIdSet.has(studentId))
      .map((studentId, index) => {
        const user = mockStudents.find((student) => student.id === studentId);
        if (!user) {
          throw new Error(`学生 ${studentId} 不存在`);
        }

        return {
          id: `${courseId}-${studentId}`,
          courseId,
          studentId,
          studentName: user.realName,
          studentNo: `S2026${String(index + existing.length + 1).padStart(3, '0')}`,
          joinedAt: new Date().toISOString(),
          progress: 0,
        };
      });

    return { courseId, students: newStudents };
  }
);

export const removeStudentFromCourse = createAsyncThunk(
  'course/removeStudentFromCourse',
  async (
    { courseId, studentId }: { courseId: string; studentId: string },
    { getState },
  ) => {
    const state = getState() as RootState;
    if (state.auth.user?.role === 'teacher') {
      return removeTeacherCourseStudentApi(courseId, studentId);
    }

    return { courseId, studentId };
  },
);

export const studentJoinCourse = createAsyncThunk(
  'course/studentJoinCourse',
  async (courseId: string, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== 'student') {
      throw new Error('仅学生可以加入课程');
    }

    const course = state.course.allCourses.find((item) => item.id === courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    if (course.visibility !== 'public') {
      throw new Error('该课程非公开课程，请等待教师拉取');
    }

    const existing = state.course.courseStudentMap[courseId] ?? [];
    if (existing.some((student) => student.studentId === user.id)) {
      throw new Error('你已加入该课程');
    }

    const record: CourseStudent = {
      id: `${courseId}-${user.id}`,
      courseId,
      studentId: user.id,
      studentName: user.realName,
      studentNo: `S2026${String(existing.length + 1).padStart(3, '0')}`,
      joinedAt: new Date().toISOString(),
      progress: 0,
    };

    return { courseId, student: record };
  }
);

const syncStudentCount = (state: CourseState, courseId: string) => {
  const target = state.courses.find((course) => course.id === courseId);
  const fullCourse = state.allCourses.find((course) => course.id === courseId);
  if (fullCourse) {
    fullCourse.studentCount = (state.courseStudentMap[courseId] ?? []).length;
    fullCourse.updatedAt = new Date().toISOString();
  }

  if (target) {
    target.studentCount = (state.courseStudentMap[courseId] ?? []).length;
    target.updatedAt = new Date().toISOString();
  }

  if (state.currentCourse?.id === courseId && fullCourse) {
    state.currentCourse = { ...fullCourse };
  }
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setCurrentCourse: (state, action) => {
      state.currentCourse = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearCourses: (state) => {
      state.courses = [];
      state.allCourses = [];
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.list;
        if (action.payload.syncAll) {
          state.allCourses = action.payload.list;
        }
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchCourses.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
        const index = state.allCourses.findIndex((item) => item.id === action.payload.id);
        if (index === -1) {
          state.allCourses.unshift(action.payload);
        } else {
          state.allCourses[index] = action.payload;
        }
      })
      .addCase(fetchCourseById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.allCourses.unshift(action.payload);
        state.courses.unshift(action.payload);
        state.courseStudentMap[action.payload.id] = [];
        state.total += 1;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const allIndex = state.allCourses.findIndex((course) => course.id === action.payload.id);
        if (allIndex !== -1) {
          state.allCourses[allIndex] = action.payload;
        }

        const index = state.courses.findIndex((course) => course.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }

        if (state.currentCourse?.id === action.payload.id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.allCourses = state.allCourses.filter((course) => course.id !== action.payload);
        state.courses = state.courses.filter((course) => course.id !== action.payload);
        delete state.courseStudentMap[action.payload];
        state.students = state.students.filter((student) => student.courseId !== action.payload);
        state.total = Math.max(0, state.total - 1);

        if (state.currentCourse?.id === action.payload) {
          state.currentCourse = null;
        }
      })
      .addCase(fetchCourseStudents.fulfilled, (state, action) => {
        state.students = action.payload;
        if (state.currentCourse) {
          state.courseStudentMap[state.currentCourse.id] = action.payload;
          syncStudentCount(state, state.currentCourse.id);
        }
      })
      .addCase(fetchCourseCandidateStudents.fulfilled, (state, action) => {
        state.candidateStudents = action.payload;
      })
      .addCase(addStudentsToCourse.fulfilled, (state, action) => {
        const current = state.courseStudentMap[action.payload.courseId] ?? [];
        state.courseStudentMap[action.payload.courseId] = [...current, ...action.payload.students];
        const joinedIds = new Set(action.payload.students.map((item) => item.studentId));
        state.candidateStudents = state.candidateStudents.filter((item) => !joinedIds.has(item.id));

        if (state.currentCourse?.id === action.payload.courseId) {
          state.students = state.courseStudentMap[action.payload.courseId];
        }

        syncStudentCount(state, action.payload.courseId);
      })
      .addCase(removeStudentFromCourse.fulfilled, (state, action) => {
        const current = state.courseStudentMap[action.payload.courseId] ?? [];
        state.courseStudentMap[action.payload.courseId] = current.filter(
          (student) => student.studentId !== action.payload.studentId
        );

        if (state.currentCourse?.id === action.payload.courseId) {
          state.students = state.courseStudentMap[action.payload.courseId];
        }

        syncStudentCount(state, action.payload.courseId);
      })
      .addCase(studentJoinCourse.fulfilled, (state, action) => {
        const current = state.courseStudentMap[action.payload.courseId] ?? [];
        state.courseStudentMap[action.payload.courseId] = [...current, action.payload.student];
        syncStudentCount(state, action.payload.courseId);
      });
  },
});

export const { setCurrentCourse, setPage, setPageSize, clearCourses } = courseSlice.actions;
export default courseSlice.reducer;
