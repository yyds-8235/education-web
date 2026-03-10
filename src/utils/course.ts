import type { Course, CourseStudent } from '@/types';

export const getJoinedCourseIds = (
  courses: Course[],
  courseStudentMap: Record<string, CourseStudent[]>,
  userId: string,
): Set<string> => {
  const joinedCourseIds = new Set(
    Object.entries(courseStudentMap)
      .filter(([, students]) => students.some((student) => student.studentId === userId))
      .map(([courseId]) => courseId),
  );

  courses.forEach((course) => {
    if (course.joined) {
      joinedCourseIds.add(course.id);
    }
  });

  return joinedCourseIds;
};

export const isStudentJoinedCourse = (
  courseId: string,
  courses: Course[],
  courseStudentMap: Record<string, CourseStudent[]>,
  userId: string,
): boolean => getJoinedCourseIds(courses, courseStudentMap, userId).has(courseId);
