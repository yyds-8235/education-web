import type { Test, TestQuestion, TestSubmission } from '@/types';

const now = new Date().toISOString();

const questionBank: TestQuestion[] = [
  {
    id: 'question-1',
    testId: 'test-1',
    type: 'single_choice',
    content: 'Python 中用于定义函数的关键字是？',
    options: [
      { id: 'q1-a', label: 'A', content: 'function' },
      { id: 'q1-b', label: 'B', content: 'def' },
      { id: 'q1-c', label: 'C', content: 'method' },
      { id: 'q1-d', label: 'D', content: 'lambda' },
    ],
    answer: 'B',
    score: 20,
    order: 1,
    analysis: 'Python 使用 def 关键字定义函数。',
  },
  {
    id: 'question-2',
    testId: 'test-1',
    type: 'fill_blank',
    content: 'HTTP 默认端口是 ____。',
    answer: '80',
    score: 20,
    order: 2,
    analysis: 'HTTP 协议默认端口为 80。',
  },
  {
    id: 'question-3',
    testId: 'test-1',
    type: 'short_answer',
    content: '请简述什么是面向对象编程。',
    answer: '围绕对象与类组织程序，通过封装、继承、多态提高复用和扩展能力。',
    score: 60,
    order: 3,
    analysis: '围绕对象模型回答并提到封装/继承/多态即可得分。',
  },
];

const submission: TestSubmission = {
  id: 'submission-1',
  testId: 'test-1',
  studentId: 'student-1',
  studentName: '王同学',
  studentNo: 'S202601',
  answers: [
    { questionId: 'question-1', answer: 'B', score: 20, isCorrect: true },
    { questionId: 'question-2', answer: '8080', score: 0, isCorrect: false },
    {
      questionId: 'question-3',
      answer: '通过对象和类组织代码，支持封装继承多态。',
      score: 45,
      feedback: '概念完整，举例可再丰富。',
      isCorrect: true,
    },
  ],
  totalScore: 65,
  status: 'graded',
  submittedAt: now,
  gradedAt: now,
  createdAt: now,
};

export const initialTests: Test[] = [
  {
    id: 'test-1',
    courseId: 'course-1',
    courseName: '高一信息技术基础',
    title: '第2章随堂测验',
    description: '覆盖算法与网络基础知识点。',
    duration: 30,
    totalScore: 100,
    showAnswer: true,
    status: 'published',
    questions: questionBank,
    submissions: [submission],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'test-2',
    courseId: 'course-2',
    courseName: 'Python提高实践',
    title: '项目启动前测',
    description: '用于评估学生编程基础。',
    duration: 45,
    totalScore: 100,
    showAnswer: false,
    status: 'draft',
    questions: [],
    submissions: [],
    createdAt: now,
    updatedAt: now,
  },
];
