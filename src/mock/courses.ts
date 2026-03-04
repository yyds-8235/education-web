import type { Course, CourseChapter, CourseStudent, CourseResource } from '@/types';
import { mockStudents, mockTeacher } from './users';

const now = new Date().toISOString();

const buildResource = (
  id: string,
  chapterId: string,
  name: string,
  type: CourseResource['type'],
  size: number,
  url: string
): CourseResource => ({
  id,
  chapterId,
  name,
  type,
  size,
  url,
  order: 1,
  createdAt: now,
});

const chapterOneResources: CourseResource[] = [
  buildResource('res-1', 'chapter-1', '第一章导学.pdf', 'pdf', 1024 * 1024 * 2, '/mock/files/ch1-guide.pdf'),
  buildResource('res-2', 'chapter-1', '课程介绍.mp4', 'video', 1024 * 1024 * 60, '/mock/files/ch1-intro.mp4'),
];

const chapterTwoResources: CourseResource[] = [
  buildResource('res-3', 'chapter-2', '算法基础.pptx', 'ppt', 1024 * 1024 * 8, '/mock/files/ch2-slides.pptx'),
  buildResource('res-4', 'chapter-2', '课后阅读.docx', 'word', 1024 * 1024 * 1, '/mock/files/ch2-reading.docx'),
];

const courseOneChapters: CourseChapter[] = [
  {
    id: 'chapter-1',
    courseId: 'course-1',
    title: '第1章 程序设计导论',
    description: '理解程序设计基础概念与开发流程。',
    order: 1,
    resources: chapterOneResources,
    createdAt: now,
  },
  {
    id: 'chapter-2',
    courseId: 'course-1',
    title: '第2章 算法与数据结构入门',
    description: '掌握基础算法思想。',
    order: 2,
    resources: chapterTwoResources,
    createdAt: now,
  },
];

export const initialCourses: Course[] = [
  {
    id: 'course-1',
    name: '高一信息技术基础',
    description: '面向高一学生的信息技术入门课程，覆盖编程与信息素养。',
    grade: '高一',
    class: '1班',
    subject: '信息技术',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: courseOneChapters,
    studentCount: 2,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'course-2',
    name: 'Python提高实践',
    description: '针对拔高学生的项目化编程训练。',
    grade: '高二',
    class: '3班',
    subject: '信息技术',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'private',
    chapters: [
      {
        id: 'chapter-3',
        courseId: 'course-2',
        title: '第1章 Web爬虫基础',
        description: '请求、解析、反爬基础。',
        order: 1,
        resources: [
          buildResource('res-5', 'chapter-3', '爬虫课堂案例.pdf', 'pdf', 1024 * 1024 * 3, '/mock/files/crawler.pdf'),
        ],
        createdAt: now,
      },
    ],
    studentCount: 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'course-3',
    name: '人工智能启蒙',
    description: '公开选修课程，介绍机器学习与生成式 AI 基础。',
    grade: '高二',
    class: '选修',
    subject: '人工智能',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [],
    studentCount: 0,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  },
];

const buildCourseStudent = (courseId: string, studentIndex: number): CourseStudent => {
  const student = mockStudents[studentIndex];
  return {
    id: `${courseId}-${student.id}`,
    courseId,
    studentId: student.id,
    studentName: student.realName,
    studentNo: `S20260${studentIndex + 1}`,
    joinedAt: now,
    progress: 20 + studentIndex * 15,
  };
};

export const initialCourseStudents: Record<string, CourseStudent[]> = {
  'course-1': [buildCourseStudent('course-1', 0), buildCourseStudent('course-1', 1)],
  'course-2': [buildCourseStudent('course-2', 2)],
  'course-3': [],
};
