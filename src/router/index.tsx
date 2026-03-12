import { createHashRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import {
  Login,
  AdminLogin,
  CourseList,
  CourseDetail,
  CourseCreate,
  Classroom,
  TestList,
  TestGrading,
  TestStatistics,
  TestAnswer,
  TestDetail,
  TestEditorPage,
  TestSubmissionReview,
  Schedule,
  Attendance,
  Analytics,
  StudentManagement,
  StudentLearningProfilePage,
  StudentDetailPage,
  StudentFormPage,
  Dashboard,
  TeacherListPage,
  TeacherCreatePage,
  TeacherDetailPage,
  TeacherEditPage,
} from '@/pages';

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin-login',
    element: <AdminLogin />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'courses',
        element: <CourseList />,
      },
      {
        path: 'courses/create',
        element: <CourseCreate />,
      },
      {
        path: 'courses/:id',
        element: <CourseDetail />,
      },
      {
        path: 'courses/:id/edit',
        element: <CourseCreate />,
      },
      {
        path: 'classroom',
        element: <Classroom />,
      },
      {
        path: 'tests',
        element: <TestList />,
      },
      {
        path: 'tests/create',
        element: <TestEditorPage />,
      },
      {
        path: 'tests/:id/edit',
        element: <TestEditorPage />,
      },
      {
        path: 'tests/answer',
        element: <TestAnswer />,
      },
      {
        path: 'tests/detail',
        element: <TestDetail />,
      },
      {
        path: 'tests/grading/:testId',
        element: <TestGrading />,
      },
      {
        path: 'tests/grading/:testId/submissions/:submissionId',
        element: <TestSubmissionReview />,
      },
      {
        path: 'tests/statistics/:testId',
        element: <TestStatistics />,
      },
      {
        path: 'schedule',
        element: <Schedule />,
      },
      {
        path: 'attendance',
        element: <Attendance />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'personnel/teachers',
        element: <TeacherListPage />,
      },
      {
        path: 'personnel/teachers/new',
        element: <TeacherCreatePage />,
      },
      {
        path: 'personnel/teachers/:id',
        element: <TeacherDetailPage />,
      },
      {
        path: 'personnel/teachers/:id/edit',
        element: <TeacherEditPage />,
      },
      {
        path: 'students',
        element: <StudentManagement />,
      },
      {
        path: 'students/new',
        element: <StudentFormPage />,
      },
      {
        path: 'students/:id/detail',
        element: <StudentDetailPage />,
      },
      {
        path: 'students/:id/edit',
        element: <StudentFormPage />,
      },
      {
        path: 'students/:id/learning',
        element: <StudentLearningProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
