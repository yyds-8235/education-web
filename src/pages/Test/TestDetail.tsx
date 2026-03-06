import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Test, TestSubmission } from '@/types';
import { useAppSelector } from '@/store/hooks';

const { Title, Text } = Typography;

const staticTests: Test[] = [
  {
    id: 'test-1',
    courseId: 'course-1',
    courseName: '小学数学',
    title: '第一单元测试',
    description: '测试第一单元知识点',
    duration: 30,
    totalScore: 100,
    showAnswer: true,
    status: 'published',
    questions: [
      {
        id: 'q1',
        testId: 'test-1',
        type: 'single_choice',
        content: '1 + 1 = ?',
        options: [
          { id: 'A', label: 'A', content: '1' },
          { id: 'B', label: 'B', content: '2' },
          { id: 'C', label: 'C', content: '3' },
          { id: 'D', label: 'D', content: '4' },
        ],
        answer: 'B',
        score: 10,
        order: 1,
        analysis: '1 + 1 = 2',
      },
      {
        id: 'q2',
        testId: 'test-1',
        type: 'single_choice',
        content: '2 × 3 = ?',
        options: [
          { id: 'A', label: 'A', content: '5' },
          { id: 'B', label: 'B', content: '6' },
          { id: 'C', label: 'C', content: '7' },
          { id: 'D', label: 'D', content: '8' },
        ],
        answer: 'B',
        score: 10,
        order: 2,
        analysis: '2 × 3 = 6',
      },
      {
        id: 'q3',
        testId: 'test-1',
        type: 'fill_blank',
        content: '5 + 5 = ___',
        answer: '10',
        score: 20,
        order: 3,
        analysis: '5 + 5 = 10',
      },
      {
        id: 'q4',
        testId: 'test-1',
        type: 'short_answer',
        content: '请简述加法的基本性质。',
        answer: '加法交换律：a + b = b + a；加法结合律：(a + b) + c = a + (b + c)',
        score: 60,
        order: 4,
        analysis: '加法的基本性质包括交换律和结合律。',
      },
    ],
    submissions: [
      {
        id: 'sub-1',
        testId: 'test-1',
        studentId: 'student-1',
        studentName: '张三',
        studentNo: 'S2026001',
        answers: [
          { questionId: 'q1', answer: 'B', score: 10, isCorrect: true },
          { questionId: 'q2', answer: 'B', score: 10, isCorrect: true },
          { questionId: 'q3', answer: '10', score: 20, isCorrect: true },
          { questionId: 'q4', answer: '加法交换律和结合律', score: 50, isCorrect: true, feedback: '回答正确！' },
        ],
        totalScore: 90,
        status: 'graded',
        submittedAt: '2026-03-05T10:00:00.000Z',
        gradedAt: '2026-03-05T12:00:00.000Z',
        createdAt: '2026-03-05T10:00:00.000Z',
      },
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'test-2',
    courseId: 'course-2',
    courseName: '小学语文',
    title: '古诗词测试',
    description: '测试古诗词掌握情况',
    duration: 45,
    totalScore: 100,
    showAnswer: true,
    status: 'published',
    questions: [
      {
        id: 'q1',
        testId: 'test-2',
        type: 'single_choice',
        content: '春眠不觉晓，处处闻啼___',
        options: [
          { id: 'A', label: 'A', content: '鸟' },
          { id: 'B', label: 'B', content: '鸡' },
          { id: 'C', label: 'C', content: '鸭' },
          { id: 'D', label: 'D', content: '鹅' },
        ],
        answer: 'A',
        score: 10,
        order: 1,
        analysis: '出自孟浩然的《春晓》',
      },
      {
        id: 'q2',
        testId: 'test-2',
        type: 'fill_blank',
        content: '举头望明月，___头思故乡',
        answer: '低',
        score: 20,
        order: 2,
        analysis: '出自李白的《静夜思》',
      },
      {
        id: 'q3',
        testId: 'test-2',
        type: 'short_answer',
        content: '请背诵一首你最喜欢的古诗，并说明理由。',
        answer: '略',
        score: 70,
        order: 3,
        analysis: '学生自由发挥，只要言之有理即可。',
      },
    ],
    submissions: [
      {
        id: 'sub-2',
        testId: 'test-2',
        studentId: 'student-1',
        studentName: '张三',
        studentNo: 'S2026001',
        answers: [
          { questionId: 'q1', answer: 'A', score: 10, isCorrect: true },
          { questionId: 'q2', answer: '低', score: 20, isCorrect: true },
          { questionId: 'q3', answer: '静夜思', score: 60, isCorrect: true, feedback: '很好！' },
        ],
        totalScore: 90,
        status: 'graded',
        submittedAt: '2026-03-06T10:00:00.000Z',
        gradedAt: '2026-03-06T12:00:00.000Z',
        createdAt: '2026-03-06T10:00:00.000Z',
      },
    ],
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  },
  {
    id: 'test-3',
    courseId: 'course-3',
    courseName: '小学英语',
    title: 'Unit 1 测试',
    description: '测试第一单元词汇和语法',
    duration: 30,
    totalScore: 100,
    showAnswer: true,
    status: 'ended',
    questions: [
      {
        id: 'q1',
        testId: 'test-3',
        type: 'single_choice',
        content: 'What ___ your name?',
        options: [
          { id: 'A', label: 'A', content: 'is' },
          { id: 'B', label: 'B', content: 'are' },
          { id: 'C', label: 'C', content: 'am' },
          { id: 'D', label: 'D', content: 'be' },
        ],
        answer: 'A',
        score: 10,
        order: 1,
        analysis: '第二人称单数用is',
      },
      {
        id: 'q2',
        testId: 'test-3',
        type: 'fill_blank',
        content: '___ is a book.',
        answer: 'This',
        score: 20,
        order: 2,
        analysis: '这是一本书。',
      },
      {
        id: 'q3',
        testId: 'test-3',
        type: 'short_answer',
        content: '请用英语介绍你自己。',
        answer: '略',
        score: 70,
        order: 3,
        analysis: '学生自由发挥，包括姓名、年龄、爱好等。',
      },
    ],
    submissions: [
      {
        id: 'sub-3',
        testId: 'test-3',
        studentId: 'student-1',
        studentName: '张三',
        studentNo: 'S2026001',
        answers: [
          { questionId: 'q1', answer: 'A', score: 10, isCorrect: true },
          { questionId: 'q2', answer: 'This', score: 20, isCorrect: true },
          { questionId: 'q3', answer: 'My name is Zhang San.', score: 50, isCorrect: true, feedback: 'Good!' },
        ],
        totalScore: 80,
        status: 'graded',
        submittedAt: '2026-03-04T10:00:00.000Z',
        gradedAt: '2026-03-04T12:00:00.000Z',
        createdAt: '2026-03-04T10:00:00.000Z',
      },
    ],
    createdAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
  },
];

const TestDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tests: storeTests } = useAppSelector((state) => state.test);

  const testData = location.state?.test as Test | undefined;
  const submissionData = location.state?.submission as TestSubmission | undefined;
  const testId = location.state?.testId as string | undefined;
  const submissionId = location.state?.submissionId as string | undefined;

  const allTests = useMemo(() => {
    return [...staticTests, ...storeTests];
  }, [storeTests]);

  const test = useMemo(() => {
    if (testData) {
      return testData;
    }
    if (testId) {
      return allTests.find((t) => t.id === testId);
    }
    return null;
  }, [testData, testId, allTests]);

  const submission = useMemo(() => {
    if (submissionData) {
      return submissionData;
    }
    if (test && submissionId) {
      return test.submissions.find((s) => s.id === submissionId);
    }
    if (test) {
      return test.submissions[0];
    }
    return null;
  }, [submissionData, submissionId, test]);

  if (!test || !submission) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
          返回测试列表
        </Button>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text>未找到测试详情</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/tests')}
        style={{ marginBottom: 16 }}
      >
        返回测试列表
      </Button>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>{test.title}</Title>
            <Space>
              <Tag>{test.courseName}</Tag>
              <Tag color={submission.status === 'graded' ? 'green' : 'blue'}>
                {submission.status === 'graded' ? '已批改' : '待批改'}
              </Tag>
            </Space>
          </div>

          <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
            <Space wrap>
              <Text>总分：{submission.totalScore ?? '-'}</Text>
              <Text>提交时间：{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}</Text>
              {submission.gradedAt && (
                <Text>批改时间：{new Date(submission.gradedAt).toLocaleString()}</Text>
              )}
              {submission.appealStatus && (
                <Tag color="orange">申诉状态：{submission.appealStatus}</Tag>
              )}
            </Space>
          </Card>

          {test.questions.map((question, index) => {
            const answer = submission.answers.find((item) => item.questionId === question.id);
            return (
              <Card 
                key={question.id} 
                size="small" 
                title={`第 ${index + 1} 题 · ${question.type === 'single_choice' ? '选择题' : question.type === 'fill_blank' ? '填空题' : '简答题'}（${question.score} 分）`}
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text strong>{question.content}</Text>
                  
                  <div style={{ padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                    <Text>我的答案：{answer?.answer || '未作答'}</Text>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <Text type="secondary">
                      得分：{answer?.score ?? '-'} / {question.score}
                    </Text>
                    {answer?.isCorrect !== undefined && (
                      <Tag color={answer.isCorrect ? 'green' : 'red'}>
                        {answer.isCorrect ? '正确' : '错误'}
                      </Tag>
                    )}
                  </div>

                  {answer?.feedback && (
                    <div style={{ padding: 8, backgroundColor: '#fff7e6', borderRadius: 4 }}>
                      <Text type="secondary">教师反馈：{answer.feedback}</Text>
                    </div>
                  )}

                  {test.showAnswer && (
                    <div style={{ padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                      <Text>正确答案：{question.answer}</Text>
                      {question.analysis && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">解析：{question.analysis}</Text>
                        </div>
                      )}
                    </div>
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};

export default TestDetail;
