export type CourseVisibility = 'public' | 'private' | 'class_only';

export interface Course {
    id: string;
    name: string;
    description?: string;
    grade: string;
    class: string;
    subject: string;
    teacherId: string;
    teacherName: string;
    visibility: CourseVisibility;
    coverImage?: string;
    chapters: CourseChapter[];
    studentCount: number;
    status: 'active' | 'archived' | 'draft';
    createdAt: string;
    updatedAt: string;
}

export interface CourseChapter {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    resources: CourseResource[];
    createdAt: string;
}

export interface CourseResource {
    id: string;
    chapterId: string;
    name: string;
    type: 'video' | 'ppt' | 'word' | 'pdf' | 'other';
    url: string;
    size: number;
    duration?: number;
    order: number;
    createdAt: string;
}

export interface CourseStudent {
    id: string;
    courseId: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    joinedAt: string;
    progress: number;
}

export interface CreateCourseParams {
    name: string;
    description?: string;
    grade: string;
    class: string;
    subject: string;
    visibility: CourseVisibility;
    coverImage?: string;
}

export interface UpdateCourseParams extends Partial<CreateCourseParams> {
    id: string;
}

export interface CourseQueryParams {
    page: number;
    pageSize: number;
    grade?: string;
    class?: string;
    subject?: string;
    keyword?: string;
    status?: 'active' | 'archived' | 'draft';
}
