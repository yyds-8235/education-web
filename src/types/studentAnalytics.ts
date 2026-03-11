import type { CourseStatus } from './course';
import type { TestSubmission } from './test';

export type StudentLearningSubmissionStatus = 'not_started' | 'draft' | 'submitted' | 'graded';

export interface StudentLearningStudent {
  id: string;
  studentNo: string;
  name: string;
  username?: string;
  grade: string;
  className: string;
  guardian?: string;
  phone?: string;
  email?: string;
  tags: string[];
}

export interface StudentLearningOverview {
  totalCourses: number;
  activeCourses: number;
  averageProgress: number;
  totalTests: number;
  completedTests: number;
  averageScore: number;
  pendingTests: number;
  latestActivityAt?: string;
}

export interface StudentLearningCourse {
  courseId: string;
  courseName: string;
  subject: string;
  teacherName: string;
  grade: string;
  className: string;
  joinedAt: string;
  progress: number;
  status: CourseStatus;
  chapterCount: number;
  resourceCount: number;
  testCount: number;
  completedTestCount: number;
  averageScore?: number;
  latestStudyAt?: string;
}

export interface StudentLearningTest {
  testId: string;
  courseId: string;
  courseName: string;
  title: string;
  testStatus: 'draft' | 'published' | 'ended';
  submissionStatus: StudentLearningSubmissionStatus;
  duration: number;
  totalScore: number;
  studentScore?: number;
  questionCount: number;
  objectiveCorrectRate?: number;
  submittedAt?: string;
  gradedAt?: string;
  appealStatus?: TestSubmission['appealStatus'];
  analysisSummary?: string;
}

export interface StudentLearningTrendPoint {
  label: string;
  progress: number;
  score?: number;
}

export interface StudentLearningActivity {
  id: string;
  type: 'course' | 'test';
  title: string;
  description: string;
  time: string;
  status: string;
}

export interface StudentLearningProfile {
  student: StudentLearningStudent;
  overview: StudentLearningOverview;
  courses: StudentLearningCourse[];
  tests: StudentLearningTest[];
  trend: StudentLearningTrendPoint[];
  activities: StudentLearningActivity[];
  insights: string[];
}
