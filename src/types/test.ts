export type QuestionType = 'single_choice' | 'fill_blank' | 'short_answer';

export interface Test {
    id: string;
    courseId: string;
    courseName: string;
    title: string;
    description?: string;
    duration: number;
    totalScore: number;
    showAnswer: boolean;
    status: 'draft' | 'published' | 'ended';
    questions: TestQuestion[];
    submissions: TestSubmission[];
    createdAt: string;
    updatedAt: string;
}

export interface TestQuestion {
    id: string;
    testId: string;
    type: QuestionType;
    content: string;
    options?: QuestionOption[];
    answer: string;
    score: number;
    order: number;
    analysis?: string;
}

export interface QuestionOption {
    id: string;
    label: string;
    content: string;
}

export interface TestSubmission {
    id: string;
    testId: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    answers: SubmissionAnswer[];
    totalScore?: number;
    status: 'draft' | 'submitted' | 'graded';
    submittedAt?: string;
    gradedAt?: string;
    appealReason?: string;
    appealStatus?: 'pending' | 'accepted' | 'rejected';
    analysisSummary?: string;
    createdAt: string;
}

export interface SubmissionAnswer {
    questionId: string;
    answer: string;
    score?: number;
    feedback?: string;
    isCorrect?: boolean;
}

export interface TestStatistics {
    testId: string;
    totalSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    questionStats: QuestionStatistics[];
    wrongDistribution: Array<{ questionId: string; content: string; wrongRate: number }>;
    learningBrief: string;
    adaptiveRecommendations: string[];
}

export interface QuestionStatistics {
    questionId: string;
    correctRate: number;
    wrongCount: number;
    correctCount: number;
    averageScore: number;
}

export interface CreateTestParams {
    courseId: string;
    title: string;
    description?: string;
    duration: number;
    showAnswer: boolean;
    questions: Omit<TestQuestion, 'id' | 'testId' | 'order'>[];
}

export interface SubmitTestParams {
    testId: string;
    answers: { questionId: string; answer: string }[];
}

export interface GradeParams {
    submissionId: string;
    answers: { questionId: string; score: number; feedback?: string }[];
}

export interface BatchGradeObjectiveParams {
    testId: string;
}

export interface AppealParams {
    submissionId: string;
    reason: string;
}
