import type { Test, TestQuestion, TestSubmission } from '@/types';

const now = new Date().toISOString();

const questionBank: TestQuestion[] = [
  {
    id: 'question-1',
    testId: 'test-1',
    type: 'single_choice',
    content: '一次函数 y = 2x + 1，当 x = 3 时，y 等于多少？',
    options: [
      { id: 'q1-a', label: 'A', content: '5' },
      { id: 'q1-b', label: 'B', content: '7' },
      { id: 'q1-c', label: 'C', content: '8' },
      { id: 'q1-d', label: 'D', content: '9' },
    ],
    answer: 'B',
    score: 20,
    order: 1,
    analysis: '代入 x = 3，得到 y = 2*3 + 1 = 7。',
  },
  {
    id: 'question-2',
    testId: 'test-1',
    type: 'fill_blank',
    content: '方程 2x = 10 的解是 x = ____。',
    answer: '5',
    score: 20,
    order: 2,
    analysis: '两边同除以 2，得到 x = 5。',
  },
  {
    id: 'question-3',
    testId: 'test-1',
    type: 'short_answer',
    content: '请简述勾股定理并举一个应用场景。',
    answer: '在直角三角形中，两条直角边的平方和等于斜边的平方。可用于求旗杆高度或楼梯长度。',
    score: 60,
    order: 3,
    analysis: '答出 a²+b²=c² 并给出实际应用即可得分。',
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
    { questionId: 'question-2', answer: '5', score: 20, isCorrect: true },
    {
      questionId: 'question-3',
      answer: '勾股定理是直角三角形两直角边平方和等于斜边平方，可用于计算斜坡或梯子长度。',
      score: 50,
      feedback: '定理表述正确，应用场景举例合理。',
      isCorrect: true,
    },
  ],
  totalScore: 90,
  status: 'graded',
  submittedAt: now,
  gradedAt: now,
  createdAt: now,
};

export const initialTests: Test[] = [
  {
    id: 'test-1',
    courseId: 'course-2',
    courseName: '初二数学进阶',
    title: '一次函数与勾股定理小测',
    description: '覆盖函数代入计算、方程与定理应用。',
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
    courseId: 'course-6',
    courseName: '高三多媒体创作实训',
    title: '短视频剪辑基础测评',
    description: '用于评估镜头语言和剪辑流程基础。',
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
