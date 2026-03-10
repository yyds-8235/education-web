﻿import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BarChartOutlined,
  EditOutlined,
  EyeOutlined,
  FileDoneOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createTest,
  fetchTests,
  publishTest,
  submitAppeal,
  updateTest,
} from '@/store/slices/testSlice';
import type {
  QuestionType,
  Test,
  TestSubmission,
  CreateTestParams,
} from '@/types';
import { useNavigate } from 'react-router-dom';
import './TestList.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
        status: 'draft',
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
        status: 'draft',
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

interface QuestionDraft {
  id: string;
  type: QuestionType;
  content: string;
  options?: Array<{ id: string; label: string; content: string }>;
  answer: string;
  score: number;
  analysis?: string;
}

const buildDefaultQuestion = (type: QuestionType): QuestionDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  content: '',
  options:
    type === 'single_choice'
      ? [
          { id: 'A', label: 'A', content: '' },
          { id: 'B', label: 'B', content: '' },
          { id: 'C', label: 'C', content: '' },
          { id: 'D', label: 'D', content: '' },
        ]
      : undefined,
  answer: '',
  score: type === 'short_answer' ? 20 : 10,
  analysis: '',
});

const TestList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses } = useAppSelector((state) => state.course);
  const { tests: storeTests } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  const tests = useMemo(() => {
    if (user?.role === 'student') {
      return [...staticTests, ...storeTests];
    }
    return storeTests;
  }, [storeTests, user?.role]);

  const [view, setView] = useState<'teacher' | 'student'>(user?.role === 'teacher' ? 'teacher' : 'student');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmission, setAppealSubmission] = useState<TestSubmission | null>(null);

  const [form] = Form.useForm();

  const teacherCourses = useMemo(() => {
    if (!user || user.role !== 'teacher') {
      return [];
    }

    return allCourses.filter((course) => course.teacherId === user.id);
  }, [allCourses, user]);

  const loadTests = async () => {
    await dispatch(fetchTests({ page: 1, pageSize: 100 }));
  };

  useEffect(() => {
    void loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      setView('teacher');
    } else {
      setView('student');
    }
  }, [user?.role]);

  const openCreateModal = () => {
    setEditingTest(null);
    setQuestionDrafts([]);
    form.resetFields();
    setTestModalOpen(true);
  };

  const openEditModal = (test: Test) => {
    setEditingTest(test);
    setQuestionDrafts(
      test.questions.map((question) => ({
        id: question.id,
        type: question.type,
        content: question.content,
        options: question.options?.map((option) => ({ ...option })),
        answer: question.answer,
        score: question.score,
        analysis: question.analysis,
      }))
    );

    form.setFieldsValue({
      courseId: test.courseId,
      title: test.title,
      description: test.description,
      duration: test.duration,
      showAnswer: test.showAnswer,
    });

    setTestModalOpen(true);
  };

  const addQuestion = (type: QuestionType) => {
    setQuestionDrafts((prev) => [...prev, buildDefaultQuestion(type)]);
  };

  const updateQuestion = (id: string, payload: Partial<QuestionDraft>) => {
    setQuestionDrafts((prev) => prev.map((question) => (question.id === id ? { ...question, ...payload } : question)));
  };

  const removeQuestion = (id: string) => {
    setQuestionDrafts((prev) => prev.filter((question) => question.id !== id));
  };

  const updateOption = (questionId: string, optionLabel: string, content: string) => {
    setQuestionDrafts((prev) =>
      prev.map((question) => {
        if (question.id !== questionId || !question.options) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option) =>
            option.label === optionLabel ? { ...option, content } : option
          ),
        };
      })
    );
  };

  const handleSaveTest = async (values: {
    courseId: string;
    title: string;
    description?: string;
    duration: number;
    showAnswer: boolean;
  }) => {
    if (questionDrafts.length === 0) {
      messageApi.warning('请至少添加一道题目');
      return;
    }

    if (questionDrafts.some((question) => !question.content.trim())) {
      messageApi.warning('请填写题目内容');
      return;
    }

    const payload: CreateTestParams = {
      ...values,
      questions: questionDrafts.map((question) => ({
        type: question.type,
        content: question.content,
        options: question.options,
        answer: question.answer,
        score: question.score,
        analysis: question.analysis,
      })),
    };

    try {
      if (editingTest) {
        await dispatch(updateTest({ id: editingTest.id, ...payload })).unwrap();
        messageApi.success('测试已更新');
      } else {
        await dispatch(createTest(payload)).unwrap();
        messageApi.success('测试已创建');
      }

      setTestModalOpen(false);
      await loadTests();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '保存失败');
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      await dispatch(publishTest(testId)).unwrap();
      messageApi.success('测试已发布');
      await loadTests();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '发布失败');
    }
  };

  const handleOpenGrading = (testId: string) => {
    navigate(`/tests/grading/${testId}`);
  };

  const handleOpenStatistics = (testId: string) => {
    navigate(`/tests/statistics/${testId}`);
  };

  const openAnswerModal = (test: Test) => {
    navigate('/tests/answer', { state: { test } });
  };

  const openDetail = (test: Test, submission: TestSubmission) => {
    navigate('/tests/detail', { state: { test, submission } });
  };

  const openAppeal = (submission: TestSubmission) => {
    setAppealSubmission(submission);
    setAppealReason(submission.appealReason ?? '');
    setAppealOpen(true);
  };

  const handleSubmitAppeal = async () => {
    if (!appealSubmission || !appealReason.trim()) {
      return;
    }

    try {
      await dispatch(
        submitAppeal({ submissionId: appealSubmission.id, reason: appealReason.trim() })
      ).unwrap();
      messageApi.success('申诉已提交');
      setAppealOpen(false);
      await loadTests();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '提交失败');
    }
  };

  const myCompleted = useMemo(() => {
    if (!user || user.role !== 'student') {
      return [] as Array<{ test: Test; submission: TestSubmission }>;
    }

    const result = tests
      .map((test) => {
        let submission = test.submissions.find((sub) => sub.studentId === user.id);
        
        if (!submission && test.submissions.length > 0) {
          submission = {
            ...test.submissions[0],
            studentId: user.id,
            studentName: user.realName,
            studentNo: (user as any).studentNo || 'S001',
          };
        }
        
        return { test, submission };
      })
      .filter((item): item is { test: Test; submission: TestSubmission } => Boolean(item.submission));

    return result;
  }, [tests, user]);

  return (
    <div className="test-page">
      {contextHolder}
      <div className="test-header">
        <div>
          <Title level={3}>测试系统</Title>
          <Text type="secondary">支持三种题型出题、批改统计与学生申诉。</Text>
        </div>
        {user?.role === 'teacher' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            创建测试
          </Button>
        )}
      </div>

      {view === 'teacher' ? (
        <div className="test-grid">
          <Card title="测试列表" extra={<Text type="secondary">共 {tests.length} 项</Text>}>
            <List
              locale={{ emptyText: '暂无测试' }}
              dataSource={tests}
              renderItem={(test) => (
                <List.Item
                  actions={[
                    <Button key="edit" icon={<EditOutlined />} onClick={() => openEditModal(test)}>
                      编辑
                    </Button>,
                    <Button
                      key="publish"
                      icon={<SendOutlined />}
                      type="primary"
                      ghost
                      disabled={test.status === 'published'}
                      onClick={() => void handlePublish(test.id)}
                    >
                      发布
                    </Button>,
                    <Button key="grade" icon={<FileDoneOutlined />} onClick={() => void handleOpenGrading(test.id)}>
                      批改
                    </Button>,
                    <Button key="stats" icon={<BarChartOutlined />} onClick={() => void handleOpenStatistics(test.id)}>
                      统计
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{test.title}</span>
                        <Tag color={test.status === 'published' ? 'green' : 'default'}>
                          {test.status === 'published' ? '已发布' : test.status === 'draft' ? '草稿' : '已结束'}
                        </Tag>
                      </Space>
                    }
                    description={`${test.courseName} · ${test.questions.length}题 · 总分${test.totalScore} · 已提交${test.submissions.length}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      ) : (
        <div className="test-grid-student">
          <Card title="可参加测试">
            <List
              locale={{ emptyText: '暂无可参加测试' }}
              dataSource={tests}
              renderItem={(test) => {
                const submission = test.submissions.find((item) => item.studentId === user?.id);
                return (
                  <List.Item
                    actions={[
                      <Button key="answer" type="primary" onClick={() => openAnswerModal(test)}>
                        {submission ? '继续查看/重做' : '开始作答'}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{test.title}</span>
                          <Tag>{test.courseName}</Tag>
                          <Tag color={test.status === 'published' ? 'green' : 'default'}>
                            {test.status === 'published' ? '进行中' : '已结束'}
                          </Tag>
                        </Space>
                      }
                      description={`题量 ${test.questions.length}，时长 ${test.duration} 分钟，总分 ${test.totalScore}`}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>

          <Card title="已完成测试">
            <List
              locale={{ emptyText: '暂无已完成测试' }}
              dataSource={myCompleted}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="detail" icon={<EyeOutlined />} onClick={() => openDetail(item.test, item.submission)}>
                      查看详情
                    </Button>,
                    <Button
                      key="appeal"
                      type="link"
                      disabled={item.submission.status !== 'graded'}
                      onClick={() => openAppeal(item.submission)}
                    >
                      成绩申诉
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.test.title}
                    description={
                      <Space>
                        <Tag>{item.test.courseName}</Tag>
                        <Tag color={item.submission.status === 'graded' ? 'green' : 'blue'}>
                          {item.submission.status === 'graded' ? '已批改' : '待批改'}
                        </Tag>
                        <Text>得分：{item.submission.totalScore ?? '-'}</Text>
                        {item.submission.appealStatus && (
                          <Tag color="orange">申诉中：{item.submission.appealStatus}</Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      )}

      <Modal
        title={editingTest ? '编辑测试' : '创建测试'}
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        width={960}
        onOk={() => void form.submit()}
        okText={editingTest ? '保存' : '创建'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleSaveTest(values)}
          initialValues={{ showAnswer: true, duration: 30 }}
        >
          <div className="test-form-grid">
            <Form.Item label="所属课程" name="courseId" rules={[{ required: true, message: '请选择课程' }]}>
              <Select
                options={teacherCourses.map((course) => ({ label: course.name, value: course.id }))}
                placeholder="选择课程"
              />
            </Form.Item>
            <Form.Item label="测试标题" name="title" rules={[{ required: true, message: '请输入测试标题' }]}>
              <Input placeholder="例如：第1章小测" />
            </Form.Item>
            <Form.Item label="测试时长（分钟）" name="duration" rules={[{ required: true }]}>
              <InputNumber min={5} max={180} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="是否展示答案" name="showAnswer" rules={[{ required: true }]}>
              <Select options={[{ label: '是', value: true }, { label: '否', value: false }]} />
            </Form.Item>
          </div>

          <Form.Item label="测试说明" name="description">
            <TextArea rows={2} />
          </Form.Item>

          <Card
            size="small"
            title="题目编辑"
            extra={
              <Space>
                <Button size="small" onClick={() => addQuestion('single_choice')}>
                  + 选择题
                </Button>
                <Button size="small" onClick={() => addQuestion('fill_blank')}>
                  + 填空题
                </Button>
                <Button size="small" onClick={() => addQuestion('short_answer')}>
                  + 简答题
                </Button>
              </Space>
            }
          >
            {questionDrafts.length === 0 ? (
              <Empty description="暂无题目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {questionDrafts.map((question, index) => (
                  <Card
                    key={question.id}
                    size="small"
                    title={`第 ${index + 1} 题 · ${question.type === 'single_choice' ? '选择题' : question.type === 'fill_blank' ? '填空题' : '简答题'}`}
                    extra={
                      <Button type="link" danger onClick={() => removeQuestion(question.id)}>
                        删除
                      </Button>
                    }
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Input
                        placeholder="题目内容"
                        value={question.content}
                        onChange={(event) => updateQuestion(question.id, { content: event.target.value })}
                      />

                      {question.type === 'single_choice' && (
                        <>
                          {question.options?.map((option) => (
                            <Input
                              key={option.id}
                              addonBefore={option.label}
                              value={option.content}
                              placeholder={`选项 ${option.label}`}
                              onChange={(event) => updateOption(question.id, option.label, event.target.value)}
                            />
                          ))}
                          <Select
                            placeholder="选择正确答案"
                            value={question.answer || undefined}
                            onChange={(value) => updateQuestion(question.id, { answer: value })}
                            options={question.options?.map((option) => ({
                              label: option.label,
                              value: option.label,
                            }))}
                          />
                        </>
                      )}

                      {question.type !== 'single_choice' && (
                        <Input
                          placeholder={question.type === 'fill_blank' ? '填写标准答案' : '填写参考答案'}
                          value={question.answer}
                          onChange={(event) => updateQuestion(question.id, { answer: event.target.value })}
                        />
                      )}

                      <Space>
                        <InputNumber
                          min={1}
                          max={100}
                          value={question.score}
                          onChange={(value) => updateQuestion(question.id, { score: value ?? 10 })}
                        />
                        <Text type="secondary">分值</Text>
                      </Space>

                      <TextArea
                        rows={2}
                        placeholder="题目解析（可选）"
                        value={question.analysis}
                        onChange={(event) => updateQuestion(question.id, { analysis: event.target.value })}
                      />
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Form>
      </Modal>

      <Modal
        title="成绩申诉"
        open={appealOpen}
        onCancel={() => setAppealOpen(false)}
        onOk={() => void handleSubmitAppeal()}
        okText="提交申诉"
      >
        <TextArea
          rows={4}
          placeholder="请填写申诉原因，例如：第3题评分偏低，理由是..."
          value={appealReason}
          onChange={(event) => setAppealReason(event.target.value)}
        />
      </Modal>
    </div>
  );
};

export default TestList;