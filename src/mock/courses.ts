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
  buildResource('res-1', 'chapter-1', '古诗文导学.pdf', 'pdf', 1024 * 1024 * 2, '/mock/files/ch1-guide.pdf'),
  buildResource('res-2', 'chapter-1', '阅读方法讲解.mp4', 'video', 1024 * 1024 * 60, '/mock/files/ch1-intro.mp4'),
];

const chapterTwoResources: CourseResource[] = [
  buildResource('res-3', 'chapter-2', '作文结构训练.pptx', 'ppt', 1024 * 1024 * 8, '/mock/files/ch2-slides.pptx'),
  buildResource('res-4', 'chapter-2', '课后写作任务.docx', 'word', 1024 * 1024 * 1, '/mock/files/ch2-reading.docx'),
];

const courseOneChapters: CourseChapter[] = [
  {
    id: 'chapter-1',
    courseId: 'course-1',
    title: '第1章 现代文阅读入门',
    description: '掌握阅读理解的基本方法与答题规范。',
    order: 1,
    resources: chapterOneResources,
    createdAt: now,
  },
  {
    id: 'chapter-2',
    courseId: 'course-1',
    title: '第2章 记叙文写作基础',
    description: '学习记叙文结构与表达技巧。',
    order: 2,
    resources: chapterTwoResources,
    createdAt: now,
  },
];

export const initialCourses: Course[] = [
  {
    id: 'course-1',
    name: '初一语文基础',
    description: '面向初一学生的语文基础课程，覆盖阅读、写作与表达。',
    grade: '初一',
    class: '1班',
    subject: '语文',
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
    name: '初二数学进阶',
    description: '面向初二学生的数学思维训练课程。',
    grade: '初二',
    class: '2班',
    subject: '数学',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [
      {
        id: 'chapter-3',
        courseId: 'course-2',
        title: '第1章 一次函数与图像',
        description: '掌握一次函数的图像性质与应用。',
        order: 1,
        resources: [
          buildResource('res-5', 'chapter-3', '一次函数专题.pdf', 'pdf', 1024 * 1024 * 3, '/mock/files/linear-function.pdf'),
        ],
        createdAt: now,
      },
    ],
    studentCount: 2,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'course-3',
    name: '初三英语冲刺',
    description: '面向中考阶段的英语语法与阅读强化课程。',
    grade: '初三',
    class: '1班',
    subject: '英语',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [
      {
        id: 'chapter-4',
        courseId: 'course-3',
        title: '第1章 时态复习',
        description: '系统复习初中阶段核心时态。',
        order: 1,
        resources: [
          buildResource('res-6', 'chapter-4', '时态与语态精讲.pdf', 'pdf', 1024 * 1024 * 2, '/mock/files/english-tense.pdf'),
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
    id: 'course-4',
    name: '初一物理入门',
    description: '初中物理入门课程，聚焦力学基础与运动学。',
    grade: '初一',
    class: '3班',
    subject: '物理',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'private',
    chapters: [
      {
        id: 'chapter-5',
        courseId: 'course-4',
        title: '第1章 力学基础',
        description: '学习力学基本概念和简单受力分析。',
        order: 1,
        resources: [
          buildResource('res-7', 'chapter-5', '力学基础讲义.pptx', 'ppt', 1024 * 1024 * 4, '/mock/files/physics-mechanics.pptx'),
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
    id: 'course-5',
    name: '初二化学启蒙',
    description: '初二化学入门课程，覆盖物质结构与基本化学反应。',
    grade: '初二',
    class: '2班',
    subject: '化学',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [
      {
        id: 'chapter-6',
        courseId: 'course-5',
        title: '第1章 物质的性质与变化',
        description: '理解物质的物理性质与化学变化。',
        order: 1,
        resources: [
          buildResource('res-8', 'chapter-6', '化学入门讲义.pdf', 'pdf', 1024 * 1024 * 3, '/mock/files/chem-intro.pdf'),
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
    id: 'course-6',
    name: '初三生物总复习',
    description: '中考生物复习课程，系统梳理初中生物知识点。',
    grade: '初三',
    class: '选修',
    subject: '生物',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [
      {
        id: 'chapter-7',
        courseId: 'course-6',
        title: '第1章 细胞与遗传',
        description: '掌握细胞结构与遗传基础知识。',
        order: 1,
        resources: [
          buildResource('res-9', 'chapter-7', '生物复习指南.pdf', 'pdf', 1024 * 1024 * 5, '/mock/files/biology-review.pdf'),
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
    id: 'course-7',
    name: '初二历史拓展',
    description: '中国近现代史拓展课程，培养历史思维能力。',
    grade: '初二',
    class: '选修',
    subject: '历史',
    teacherId: mockTeacher.id,
    teacherName: mockTeacher.realName,
    visibility: 'public',
    chapters: [
      {
        id: 'chapter-8',
        courseId: 'course-7',
        title: '第1章 中国近代史',
        description: '学习中国近代史重要事件与人物。',
        order: 1,
        resources: [
          buildResource('res-10', 'chapter-8', '历史拓展材料.pdf', 'pdf', 1024 * 1024, '/mock/files/history-extension.pdf'),
        ],
        createdAt: now,
      },
    ],
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
  'course-2': [buildCourseStudent('course-2', 2), buildCourseStudent('course-2', 3)],
  'course-3': [buildCourseStudent('course-3', 0)],
  'course-4': [buildCourseStudent('course-4', 1)],
  'course-5': [buildCourseStudent('course-5', 4)],
  'course-6': [buildCourseStudent('course-6', 5)],
  'course-7': [],
};
