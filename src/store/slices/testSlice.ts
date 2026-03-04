import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  BatchGradeObjectiveParams,
  CreateTestParams,
  GradeParams,
  PaginatedResponse,
  QuestionStatistics,
  SubmitTestParams,
  SubmissionAnswer,
  Test,
  TestQuestion,
  TestStatistics,
  TestSubmission,
} from '@/types';
import type { RootState } from '@/store';
import { generateId } from '@/utils/generator';
import { initialTests } from '@/mock/tests';

interface TestState {
  allTests: Test[];
  tests: Test[];
  currentTest: Test | null;
  currentSubmission: TestSubmission | null;
  statistics: TestStatistics | null;
  submissions: TestSubmission[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
}

const initialState: TestState = {
  allTests: initialTests,
  tests: initialTests,
  currentTest: null,
  currentSubmission: null,
  statistics: null,
  submissions: [],
  loading: false,
  total: initialTests.length,
  page: 1,
  pageSize: 10,
};

const normalize = (value: string) => value.trim().toLowerCase();

const isObjectiveQuestion = (question: TestQuestion) =>
  question.type === 'single_choice' || question.type === 'fill_blank';

const autoGradeAnswer = (question: TestQuestion, answer: string): SubmissionAnswer => {
  if (!isObjectiveQuestion(question)) {
    return {
      questionId: question.id,
      answer,
    };
  }

  const correct = normalize(answer) === normalize(question.answer);
  return {
    questionId: question.id,
    answer,
    score: correct ? question.score : 0,
    isCorrect: correct,
  };
};

const calcTotalScore = (answers: SubmissionAnswer[]) =>
  answers.reduce((sum, answer) => sum + (answer.score ?? 0), 0);

const findTestBySubmissionId = (tests: Test[], submissionId: string) =>
  tests.find((test) => test.submissions.some((submission) => submission.id === submissionId));

const updateTestInCollection = (tests: Test[], updated: Test) => {
  const index = tests.findIndex((item) => item.id === updated.id);
  if (index === -1) {
    tests.unshift(updated);
  } else {
    tests[index] = updated;
  }
};

const paginate = (list: Test[], page: number, pageSize: number): PaginatedResponse<Test> => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;

  return {
    list: list.slice(start, start + safePageSize),
    total: list.length,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(list.length / safePageSize),
  };
};

const computeStatistics = (test: Test): TestStatistics => {
  const validSubmissions = test.submissions.filter((submission) =>
    submission.status === 'graded' || submission.status === 'submitted'
  );

  if (validSubmissions.length === 0) {
    return {
      testId: test.id,
      totalSubmissions: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      questionStats: [],
      wrongDistribution: [],
      learningBrief: '当前暂无作答数据，建议先发布测试并组织学生完成。',
      adaptiveRecommendations: ['先发布至少一次随堂练习，系统将基于结果给出个性化建议。'],
    };
  }

  const scores = validSubmissions.map((submission) => submission.totalScore ?? 0);
  const averageScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passLine = test.totalScore * 0.6;
  const passRate = Number(
    ((scores.filter((score) => score >= passLine).length / scores.length) * 100).toFixed(2)
  );

  const questionStats: QuestionStatistics[] = test.questions.map((question) => {
    const answers = validSubmissions
      .map((submission) => submission.answers.find((item) => item.questionId === question.id))
      .filter(Boolean) as SubmissionAnswer[];

    const correctCount = answers.filter((item) => {
      if (typeof item.isCorrect === 'boolean') {
        return item.isCorrect;
      }

      return (item.score ?? 0) >= question.score * 0.6;
    }).length;

    const wrongCount = answers.length - correctCount;
    const average = answers.length
      ? Number((answers.reduce((sum, item) => sum + (item.score ?? 0), 0) / answers.length).toFixed(2))
      : 0;

    return {
      questionId: question.id,
      correctRate: answers.length ? Number(((correctCount / answers.length) * 100).toFixed(2)) : 0,
      wrongCount,
      correctCount,
      averageScore: average,
    };
  });

  const wrongDistribution = test.questions
    .map((question) => {
      const stat = questionStats.find((item) => item.questionId === question.id);
      const wrongRate = stat ? Number((100 - stat.correctRate).toFixed(2)) : 0;
      return {
        questionId: question.id,
        content: question.content,
        wrongRate,
      };
    })
    .sort((a, b) => b.wrongRate - a.wrongRate);

  const weakest = wrongDistribution[0];
  const learningBrief =
    averageScore >= test.totalScore * 0.8
      ? '整体表现较好，建议增加综合应用题拉开区分度。'
      : `本次测验平均分 ${averageScore}，需重点巩固“${weakest?.content ?? '核心知识点'}”。`;

  const adaptiveRecommendations = wrongDistribution.slice(0, 3).map((item, index) => {
    const level = index === 0 ? '必做' : '选做';
    return `${level}强化：围绕“${item.content}”增加 3 道分层训练题（基础/进阶/迁移）。`;
  });

  return {
    testId: test.id,
    totalSubmissions: validSubmissions.length,
    averageScore,
    highestScore,
    lowestScore,
    passRate,
    questionStats,
    wrongDistribution,
    learningBrief,
    adaptiveRecommendations,
  };
};

export const fetchTests = createAsyncThunk(
  'test/fetchTests',
  async (
    params: { page: number; pageSize: number; courseId?: string; keyword?: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    let list = [...state.test.allTests];

    if (user?.role === 'teacher') {
      const teacherCourseIds = new Set(
        state.course.allCourses
          .filter((course) => course.teacherId === user.id)
          .map((course) => course.id)
      );
      list = list.filter((test) => teacherCourseIds.has(test.courseId));
    }

    if (user?.role === 'student') {
      const joinedCourseIds = new Set(
        Object.entries(state.course.courseStudentMap)
          .filter(([, students]) => students.some((student) => student.studentId === user.id))
          .map(([courseId]) => courseId)
      );
      list = list.filter(
        (test) => joinedCourseIds.has(test.courseId) && test.status !== 'draft'
      );
    }

    if (params.courseId) {
      list = list.filter((test) => test.courseId === params.courseId);
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      list = list.filter(
        (test) =>
          test.title.toLowerCase().includes(keyword) ||
          (test.description ?? '').toLowerCase().includes(keyword)
      );
    }

    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(list, params.page, params.pageSize);
  }
);

export const fetchTestById = createAsyncThunk(
  'test/fetchTestById',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === id);
    if (!test) {
      throw new Error('测试不存在');
    }

    return test;
  }
);

export const createTest = createAsyncThunk(
  'test/createTest',
  async (params: CreateTestParams, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== 'teacher') {
      throw new Error('仅教师可创建测试');
    }

    const course = state.course.allCourses.find((item) => item.id === params.courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    const testId = generateId();
    const now = new Date().toISOString();

    const questions: TestQuestion[] = params.questions.map((question, index) => ({
      ...question,
      id: generateId(),
      testId,
      order: index + 1,
    }));

    return {
      id: testId,
      courseId: params.courseId,
      courseName: course.name,
      title: params.title,
      description: params.description,
      duration: params.duration,
      totalScore: questions.reduce((sum, question) => sum + question.score, 0),
      showAnswer: params.showAnswer,
      status: 'draft' as const,
      questions,
      submissions: [],
      createdAt: now,
      updatedAt: now,
    };
  }
);

export const updateTest = createAsyncThunk(
  'test/updateTest',
  async (
    { id, ...params }: { id: string } & Partial<CreateTestParams>,
    { getState }
  ) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === id);

    if (!test) {
      throw new Error('测试不存在');
    }

    const questions =
      params.questions?.map((question, index) => ({
        ...question,
        id: generateId(),
        testId: test.id,
        order: index + 1,
      })) ?? test.questions;

    return {
      ...test,
      ...params,
      questions,
      totalScore: questions.reduce((sum, question) => sum + question.score, 0),
      updatedAt: new Date().toISOString(),
    } as Test;
  }
);

export const deleteTest = createAsyncThunk('test/deleteTest', async (id: string) => id);

export const publishTest = createAsyncThunk(
  'test/publishTest',
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === id);

    if (!test) {
      throw new Error('测试不存在');
    }

    if (test.questions.length === 0) {
      throw new Error('请至少添加一道题目后再发布');
    }

    return {
      ...test,
      status: 'published' as const,
      updatedAt: new Date().toISOString(),
    };
  }
);

export const submitTest = createAsyncThunk(
  'test/submitTest',
  async (params: SubmitTestParams, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    const test = state.test.allTests.find((item) => item.id === params.testId);

    if (!test) {
      throw new Error('测试不存在');
    }

    if (!user || user.role !== 'student') {
      throw new Error('仅学生可提交测试');
    }

    const objectiveAnswers = test.questions.map((question) => {
      const answer = params.answers.find((item) => item.questionId === question.id)?.answer ?? '';
      return autoGradeAnswer(question, answer);
    });

    const now = new Date().toISOString();
    const existing = test.submissions.find((submission) => submission.studentId === user.id);
    const submission: TestSubmission = {
      id: existing?.id ?? generateId(),
      testId: test.id,
      studentId: user.id,
      studentName: user.realName,
      studentNo: existing?.studentNo ?? `S2026${user.id.slice(-1).padStart(3, '0')}`,
      answers: objectiveAnswers,
      totalScore: calcTotalScore(objectiveAnswers),
      status: objectiveAnswers.every((item) => typeof item.score === 'number') ? 'graded' : 'submitted',
      submittedAt: now,
      gradedAt: objectiveAnswers.every((item) => typeof item.score === 'number') ? now : undefined,
      createdAt: existing?.createdAt ?? now,
      analysisSummary: '已自动完成客观题判分，主观题等待教师批改。',
      appealReason: existing?.appealReason,
      appealStatus: existing?.appealStatus,
    };

    return submission;
  }
);

export const fetchSubmission = createAsyncThunk(
  'test/fetchSubmission',
  async (
    { testId, studentId }: { testId: string; studentId?: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    const test = state.test.allTests.find((item) => item.id === testId);

    if (!test) {
      throw new Error('测试不存在');
    }

    const targetStudentId = studentId ?? user?.id;
    const submission = test.submissions.find((item) => item.studentId === targetStudentId);
    if (!submission) {
      throw new Error('未找到作答记录');
    }

    return submission;
  }
);

export const fetchSubmissions = createAsyncThunk(
  'test/fetchSubmissions',
  async (testId: string, { getState }) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === testId);
    if (!test) {
      throw new Error('测试不存在');
    }

    return test.submissions;
  }
);

export const gradeSubmission = createAsyncThunk(
  'test/gradeSubmission',
  async (params: GradeParams, { getState }) => {
    const state = getState() as RootState;
    const test = findTestBySubmissionId(state.test.allTests, params.submissionId);

    if (!test) {
      throw new Error('提交记录不存在');
    }

    const submission = test.submissions.find((item) => item.id === params.submissionId);
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    const gradeMap = new Map(
      params.answers.map((answer) => [answer.questionId, { score: answer.score, feedback: answer.feedback }])
    );

    const answers = submission.answers.map((answer) => {
      const override = gradeMap.get(answer.questionId);
      if (!override) {
        return answer;
      }

      return {
        ...answer,
        score: override.score,
        feedback: override.feedback,
        isCorrect: override.score > 0,
      };
    });

    return {
      ...submission,
      answers,
      totalScore: calcTotalScore(answers),
      status: 'graded' as const,
      gradedAt: new Date().toISOString(),
      analysisSummary: '教师已完成批改，请查看详细反馈。',
    };
  }
);

export const batchGradeObjective = createAsyncThunk(
  'test/batchGradeObjective',
  async (params: BatchGradeObjectiveParams, { getState }) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === params.testId);

    if (!test) {
      throw new Error('测试不存在');
    }

    const now = new Date().toISOString();

    const submissions = test.submissions.map((submission) => {
      const answers = submission.answers.map((answer) => {
        const question = test.questions.find((item) => item.id === answer.questionId);
        if (!question || !isObjectiveQuestion(question)) {
          return answer;
        }

        const correct = normalize(answer.answer) === normalize(question.answer);
        return {
          ...answer,
          score: correct ? question.score : 0,
          isCorrect: correct,
        };
      });

      return {
        ...submission,
        answers,
        totalScore: calcTotalScore(answers),
        status: answers.every((item) => typeof item.score === 'number') ? 'graded' : 'submitted',
        gradedAt: now,
      } as TestSubmission;
    });

    return {
      testId: test.id,
      submissions,
    };
  }
);

export const fetchStatistics = createAsyncThunk(
  'test/fetchStatistics',
  async (testId: string, { getState }) => {
    const state = getState() as RootState;
    const test = state.test.allTests.find((item) => item.id === testId);

    if (!test) {
      throw new Error('测试不存在');
    }

    return computeStatistics(test);
  }
);

export const submitAppeal = createAsyncThunk(
  'test/submitAppeal',
  async (
    { submissionId, reason }: { submissionId: string; reason: string },
    { getState }
  ) => {
    const state = getState() as RootState;
    const test = findTestBySubmissionId(state.test.allTests, submissionId);

    if (!test) {
      throw new Error('提交记录不存在');
    }

    const submission = test.submissions.find((item) => item.id === submissionId);
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    return {
      ...submission,
      appealReason: reason,
      appealStatus: 'pending' as const,
    };
  }
);

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setCurrentTest: (state, action) => {
      state.currentTest = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearTests: (state) => {
      state.allTests = [];
      state.tests = [];
      state.total = 0;
    },
    saveDraft: (state, action) => {
      if (!state.currentSubmission) {
        return;
      }

      state.currentSubmission.answers = Object.entries(action.payload.answers).map(
        ([questionId, answer]) => ({ questionId, answer: String(answer) })
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload.list;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchTests.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchTestById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTest = action.payload;
        state.submissions = action.payload.submissions;
      })
      .addCase(fetchTestById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.allTests.unshift(action.payload);
        state.tests.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        updateTestInCollection(state.allTests, action.payload);
        updateTestInCollection(state.tests, action.payload);

        if (state.currentTest?.id === action.payload.id) {
          state.currentTest = action.payload;
        }
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.allTests = state.allTests.filter((test) => test.id !== action.payload);
        state.tests = state.tests.filter((test) => test.id !== action.payload);
        state.total = Math.max(0, state.total - 1);

        if (state.currentTest?.id === action.payload) {
          state.currentTest = null;
          state.submissions = [];
        }
      })
      .addCase(publishTest.fulfilled, (state, action) => {
        updateTestInCollection(state.allTests, action.payload);
        updateTestInCollection(state.tests, action.payload);

        if (state.currentTest?.id === action.payload.id) {
          state.currentTest = action.payload;
        }
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        const test = state.allTests.find((item) => item.id === action.payload.testId);
        if (test) {
          const index = test.submissions.findIndex(
            (submission) => submission.studentId === action.payload.studentId
          );
          if (index === -1) {
            test.submissions.push(action.payload);
          } else {
            test.submissions[index] = action.payload;
          }

          updateTestInCollection(state.tests, test);

          if (state.currentTest?.id === test.id) {
            state.currentTest = test;
            state.submissions = test.submissions;
          }
        }

        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmission.fulfilled, (state, action) => {
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        const test = state.allTests.find((item) => item.id === action.payload.testId);
        if (!test) {
          return;
        }

        const index = test.submissions.findIndex((submission) => submission.id === action.payload.id);
        if (index !== -1) {
          test.submissions[index] = action.payload;
        }

        updateTestInCollection(state.tests, test);

        if (state.currentTest?.id === test.id) {
          state.currentTest = test;
          state.submissions = test.submissions;
        }

        if (state.currentSubmission?.id === action.payload.id) {
          state.currentSubmission = action.payload;
        }
      })
      .addCase(batchGradeObjective.fulfilled, (state, action) => {
        const test = state.allTests.find((item) => item.id === action.payload.testId);
        if (!test) {
          return;
        }

        test.submissions = action.payload.submissions;
        updateTestInCollection(state.tests, test);

        if (state.currentTest?.id === test.id) {
          state.currentTest = test;
        }
        state.submissions = action.payload.submissions;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(submitAppeal.fulfilled, (state, action) => {
        const test = state.allTests.find((item) => item.id === action.payload.testId);
        if (!test) {
          return;
        }

        const index = test.submissions.findIndex((submission) => submission.id === action.payload.id);
        if (index !== -1) {
          test.submissions[index] = action.payload;
        }

        updateTestInCollection(state.tests, test);

        if (state.currentSubmission?.id === action.payload.id) {
          state.currentSubmission = action.payload;
        }
      });
  },
});

export const { setCurrentTest, setPage, setPageSize, clearTests, saveDraft } = testSlice.actions;
export default testSlice.reducer;
