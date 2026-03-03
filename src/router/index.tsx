import { createHashRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout';
import {
  Login,
  CourseList,
  CourseDetail,
  CourseCreate,
  Classroom,
  TestList,
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
