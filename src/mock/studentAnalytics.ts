import { initialCourses, initialCourseStudents } from '@/mock/courses';
import { initialTests } from '@/mock/tests';
import { mockStudents } from '@/mock/users';
import type {
  StudentLearningActivity,
  StudentLearningProfile,
  StudentLearningStudent,
  StudentLearningSubmissionStatus,
  StudentLearningTest,
  StudentLearningTrendPoint,
} from '@/types';

const courseStatusTextMap = {
  active: 'Active',
  archived: 'Archived',
  draft: 'Draft',
} as const;

const submissionStatusTextMap: Record<StudentLearningSubmissionStatus, string> = {
  not_started: 'Pending',
  draft: 'Unpublished',
  submitted: 'Waiting for grading',
  graded: 'Graded',
};

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const buildFallbackStudent = (
  studentId: string,
  seed?: Partial<StudentLearningStudent>,
): StudentLearningStudent => {
  const matchedStudent = mockStudents.find((item) => item.id === studentId);

  return {
    id: studentId,
    studentNo: seed?.studentNo ?? `S-${studentId.slice(-6).toUpperCase()}`,
    name: seed?.name ?? matchedStudent?.realName ?? 'Unknown student',
    username: seed?.username ?? matchedStudent?.username,
    grade: seed?.grade ?? 'Unassigned grade',
    className: seed?.className ?? 'Unassigned class',
    guardian: seed?.guardian,
    phone: seed?.phone ?? matchedStudent?.phone,
    email: seed?.email ?? matchedStudent?.email,
    tags: seed?.tags ?? ['Profile pending'],
  };
};

export const buildEmptyStudentLearningProfile = (
  studentId: string,
  seed?: Partial<StudentLearningStudent>,
): StudentLearningProfile => ({
  student: buildFallbackStudent(studentId, seed),
  overview: {
    totalCourses: 0,
    activeCourses: 0,
    averageProgress: 0,
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    pendingTests: 0,
  },
  courses: [],
  tests: [],
  trend: [],
  activities: [],
  insights: ['No course or test records are available yet.'],
});

export const getMockStudentLearningProfile = (
  studentId: string,
  seed?: Partial<StudentLearningStudent>,
): StudentLearningProfile => {
  const matchedStudent = mockStudents.find((item) => item.id === studentId);
  const joinedCourses = Object.values(initialCourseStudents)
    .flat()
    .filter((item) => item.studentId === studentId);

  if (!matchedStudent && joinedCourses.length === 0 && !seed) {
    throw new Error('Student learning profile not found');
  }

  const courses = joinedCourses
    .flatMap((courseStudent) => {
      const course = initialCourses.find((item) => item.id === courseStudent.courseId);
      if (!course) {
        return [];
      }

      const relatedTests = initialTests.filter((test) => test.courseId === course.id);
      const studentSubmissions = relatedTests
        .map((test) => test.submissions.find((submission) => submission.studentId === studentId))
        .filter((submission) => Boolean(submission));

      const gradedScores = studentSubmissions
        .filter((submission) => typeof submission?.totalScore === 'number')
        .map((submission) => submission!.totalScore as number);

      const latestStudyAt = [...studentSubmissions]
        .flatMap((submission) => [submission?.gradedAt, submission?.submittedAt])
        .filter((time): time is string => Boolean(time))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

      return [{
        courseId: course.id,
        courseName: course.name,
        subject: course.subject,
        teacherName: course.teacherName,
        grade: course.grade,
        className: course.class,
        joinedAt: courseStudent.joinedAt,
        progress: courseStudent.progress,
        status: course.status,
        chapterCount: course.chapters.length,
        resourceCount: course.chapters.reduce((total, chapter) => total + chapter.resources.length, 0),
        testCount: relatedTests.length,
        completedTestCount: studentSubmissions.length,
        averageScore: gradedScores.length
          ? round(gradedScores.reduce((total, score) => total + score, 0) / gradedScores.length)
          : undefined,
        latestStudyAt,
      }];
    });

  const student = buildFallbackStudent(studentId, {
    ...seed,
    studentNo: seed?.studentNo ?? joinedCourses[0]?.studentNo,
    name: seed?.name ?? matchedStudent?.realName,
    username: seed?.username ?? matchedStudent?.username,
    grade: seed?.grade ?? courses[0]?.grade,
    className: seed?.className ?? courses[0]?.className,
    phone: seed?.phone ?? matchedStudent?.phone,
    email: seed?.email ?? matchedStudent?.email,
    tags: seed?.tags ?? [
      courses[0] ? `${courses[0].grade}${courses[0].className}` : 'Awaiting class assignment',
      courses.length > 0 ? `${courses.length} active courses` : 'No courses joined',
    ],
  });

  const courseIdSet = new Set(courses.map((item) => item.courseId));
  const tests: StudentLearningTest[] = initialTests
    .filter((test) => courseIdSet.has(test.courseId))
    .map((test) => {
      const submission = test.submissions.find((item) => item.studentId === studentId);
      const answeredCount = submission?.answers.length ?? 0;
      const correctCount = submission?.answers.filter((answer) => answer.isCorrect).length ?? 0;
      const submissionStatus: StudentLearningSubmissionStatus = submission?.status
        ?? (test.status === 'draft' ? 'draft' : 'not_started');

      return {
        testId: test.id,
        courseId: test.courseId,
        courseName: test.courseName,
        title: test.title,
        testStatus: test.status,
        submissionStatus,
        duration: test.duration,
        totalScore: test.totalScore,
        studentScore: submission?.totalScore,
        questionCount: test.questions.length,
        objectiveCorrectRate: answeredCount > 0 ? round((correctCount / answeredCount) * 100) : undefined,
        submittedAt: submission?.submittedAt,
        gradedAt: submission?.gradedAt,
        appealStatus: submission?.appealStatus,
        analysisSummary: submission?.analysisSummary,
      };
    })
    .sort((left, right) => new Date(right.gradedAt ?? right.submittedAt ?? 0).getTime() - new Date(left.gradedAt ?? left.submittedAt ?? 0).getTime());

  const scoredTests = tests.filter((item) => typeof item.studentScore === 'number');
  const averageProgress = courses.length
    ? round(courses.reduce((total, course) => total + course.progress, 0) / courses.length)
    : 0;
  const averageScore = scoredTests.length
    ? round(scoredTests.reduce((total, test) => total + (test.studentScore ?? 0), 0) / scoredTests.length)
    : 0;

  const activityPool: StudentLearningActivity[] = [
    ...courses.map((course) => ({
      id: `course-${course.courseId}`,
      type: 'course' as const,
      title: `Joined course ${course.courseName}`,
      description: `${course.subject} · ${course.teacherName} · ${courseStatusTextMap[course.status]}`,
      time: course.joinedAt,
      status: `${course.progress}% progress`,
    })),
    ...tests
      .filter((test) => test.submittedAt || test.gradedAt)
      .map((test) => ({
        id: `test-${test.testId}`,
        type: 'test' as const,
        title: `Completed test ${test.title}`,
        description: `${test.courseName} · ${submissionStatusTextMap[test.submissionStatus]}`,
        time: test.gradedAt ?? test.submittedAt ?? new Date().toISOString(),
        status: typeof test.studentScore === 'number' ? `${test.studentScore} points` : submissionStatusTextMap[test.submissionStatus],
      })),
  ].sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime());

  const latestActivityAt = activityPool[0]?.time;
  const trend: StudentLearningTrendPoint[] = courses.slice(0, 6).map((course) => {
    const latestTest = tests.find((test) => test.courseId === course.courseId && typeof test.studentScore === 'number');
    return {
      label: course.courseName,
      progress: course.progress,
      score: latestTest?.studentScore,
    };
  });

  const insights: string[] = [];
  if (courses.length === 0) {
    insights.push('The student has not joined any course yet.');
  }
  if (averageProgress >= 80) {
    insights.push('Course progress is stable and above target.');
  } else if (averageProgress > 0) {
    insights.push('Follow up on courses with lower completion rates first.');
  }
  if (averageScore >= 85) {
    insights.push('Test scores are stable and can be extended with advanced exercises.');
  } else if (averageScore > 0) {
    insights.push('Reviewing wrong answers should help improve score consistency.');
  }
  if (tests.some((test) => test.submissionStatus === 'submitted')) {
    insights.push('There are tests waiting for grading and teacher feedback.');
  }
  if (insights.length === 0) {
    insights.push('More learning records are needed for deeper analysis.');
  }

  return {
    student,
    overview: {
      totalCourses: courses.length,
      activeCourses: courses.filter((course) => course.status === 'active').length,
      averageProgress,
      totalTests: tests.length,
      completedTests: tests.filter((test) => test.submissionStatus === 'submitted' || test.submissionStatus === 'graded').length,
      averageScore,
      pendingTests: tests.filter((test) => test.submissionStatus === 'not_started' || test.submissionStatus === 'submitted').length,
      latestActivityAt,
    },
    courses,
    tests,
    trend,
    activities: activityPool.slice(0, 8),
    insights,
  };
};
