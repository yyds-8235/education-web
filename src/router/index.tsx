import { createHashRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import {
  Login,
  CourseList,
  CourseDetail,
  CourseCreate,
  Classroom,
  TestList,
  TestGrading,
  TestStatistics,
  TestAnswer,
  TestDetail,
  Schedule,
  Attendance,
  Analytics,
  StudentManagement,
  Dashboard,
} from '@/pages';

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
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
        path: 'students',
        element: <StudentManagement />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
