import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  batchGradeObjective,
  createTest,
  fetchStatistics,
  fetchSubmissions,
  fetchTests,
  gradeSubmission,
  publishTest,
  submitAppeal,
  submitTest,
  updateTest,
} from '@/store/slices/testSlice';
import type {
  QuestionType,
  Test,
  TestSubmission,
  CreateTestParams,
} from '@/types';
import './TestList.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses } = useAppSelector((state) => state.course);
  const { tests, submissions, statistics } = useAppSelector((state) => state.test);

  const [view, setView] = useState<'teacher' | 'student'>(user?.role === 'teacher' ? 'teacher' : 'student');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [gradingTest, setGradingTest] = useState<Test | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<TestSubmission | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: number; feedback?: string }>>({});
  const [answerTest, setAnswerTest] = useState<Test | null>(null);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [detailSubmission, setDetailSubmission] = useState<TestSubmission | null>(null);
  const [detailTest, setDetailTest] = useState<Test | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmission, setAppealSubmission] = useState<TestSubmission | null>(null);
  const [statsTestId, setStatsTestId] = useState<string>();

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
      message.warning('请至少添加一道题目');
      return;
    }

    if (questionDrafts.some((question) => !question.content.trim())) {
      message.warning('请填写题目内容');
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
        message.success('测试已更新');
      } else {
        await dispatch(createTest(payload)).unwrap();
        message.success('测试已创建');
      }

      setTestModalOpen(false);
      await loadTests();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '保存失败');
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      await dispatch(publishTest(testId)).unwrap();
      message.success('测试已发布');
      await loadTests();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '发布失败');
    }
  };

  const openGrading = async (test: Test) => {
    setGradingTest(test);
    await dispatch(fetchSubmissions(test.id));
  };

  const openGradeModal = (submission: TestSubmission) => {
    if (!gradingTest) {
      return;
    }

    const draft: Record<string, { score: number; feedback?: string }> = {};
    submission.answers.forEach((answer) => {
      draft[answer.questionId] = {
        score: answer.score ?? 0,
        feedback: answer.feedback,
      };
    });

    setGradingSubmission(submission);
    setGradeDraft(draft);
    setGradeModalOpen(true);
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission) {
      return;
    }

    const answers = Object.entries(gradeDraft).map(([questionId, grade]) => ({
      questionId,
      score: grade.score,
      feedback: grade.feedback,
    }));

    try {
      await dispatch(
        gradeSubmission({
          submissionId: gradingSubmission.id,
          answers,
        })
      ).unwrap();
      message.success('批改完成');
      setGradeModalOpen(false);
      if (gradingTest) {
        await dispatch(fetchSubmissions(gradingTest.id));
      }
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '批改失败');
    }
  };

  const handleBatchGrade = async () => {
    if (!gradingTest) {
      return;
    }

    try {
      await dispatch(batchGradeObjective({ testId: gradingTest.id })).unwrap();
      await dispatch(fetchSubmissions(gradingTest.id));
      message.success('客观题批量批改完成');
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '批量批改失败');
    }
  };

  const handleLoadStats = async (testId: string) => {
    setStatsTestId(testId);
    try {
      await dispatch(fetchStatistics(testId)).unwrap();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '统计失败');
    }
  };

  const openAnswerModal = (test: Test) => {
    const mine = test.submissions.find((submission) => submission.studentId === user?.id);
    const draft = Object.fromEntries((mine?.answers ?? []).map((answer) => [answer.questionId, answer.answer]));
    setAnswerDraft(draft);
    setAnswerTest(test);
    setAnswerModalOpen(true);
  };

  const handleSubmitAnswer = async () => {
    if (!answerTest) {
      return;
    }

    const answers = answerTest.questions.map((question) => ({
      questionId: question.id,
      answer: answerDraft[question.id] ?? '',
    }));

    try {
      await dispatch(submitTest({ testId: answerTest.id, answers })).unwrap();
      message.success('提交成功');
      setAnswerModalOpen(false);
      await loadTests();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '提交失败');
    }
  };

  const openDetail = (test: Test, submission: TestSubmission) => {
    setDetailTest(test);
    setDetailSubmission(submission);
    setDetailOpen(true);
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
      message.success('申诉已提交');
      setAppealOpen(false);
      await loadTests();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '提交失败');
    }
  };

  const myCompleted = useMemo(() => {
    if (!user || user.role !== 'student') {
      return [] as Array<{ test: Test; submission: TestSubmission }>;
    }

    return tests
      .map((test) => ({
        test,
        submission: test.submissions.find((submission) => submission.studentId === user.id),
      }))
      .filter((item): item is { test: Test; submission: TestSubmission } => Boolean(item.submission));
  }, [tests, user]);

  const gradingColumns: ColumnsType<TestSubmission> = [
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '学号',
      dataIndex: 'studentNo',
      key: 'studentNo',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value) => <Badge status={value === 'graded' ? 'success' : 'processing'} text={value === 'graded' ? '已批改' : '待批改'} />,
    },
    {
      title: '得分',
      dataIndex: 'totalScore',
      render: (value) => value ?? '-',
    },
    {
      title: '操作',
      render: (_, submission) => (
        <Button type="link" onClick={() => openGradeModal(submission)}>
          批改
        </Button>
      ),
    },
  ];

  return (
    <div className="test-page">
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

      {/* <Segmented
        value={view}
        onChange={(value) => setView(value as 'teacher' | 'student')}
        options={
          user?.role === 'teacher'
            ? [
                { label: '教师视图', value: 'teacher' },
                { label: '学生视图预览', value: 'student' },
              ]
            : [{ label: '学生视图', value: 'student' }]
        }
      /> */}

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
                    <Button key="grade" icon={<FileDoneOutlined />} onClick={() => void openGrading(test)}>
                      批改
                    </Button>,
                    <Button key="stats" icon={<BarChartOutlined />} onClick={() => void handleLoadStats(test.id)}>
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

          <Card
            title={gradingTest ? `批改面板 - ${gradingTest.title}` : '批改面板'}
            extra={
              gradingTest ? (
                <Button onClick={() => void handleBatchGrade()} type="primary">
                  批量批改客观题
                </Button>
              ) : undefined
            }
          >
            {!gradingTest ? (
              <Empty description="请先从左侧选择测试进行批改" />
            ) : (
              <Table
                rowKey="id"
                dataSource={submissions}
                columns={gradingColumns}
                pagination={false}
                locale={{ emptyText: '暂无学生提交' }}
              />
            )}
          </Card>

          <Card title="测试统计与学情分析">
            {!statsTestId || !statistics ? (
              <Empty description="点击测试列表中的“统计”查看分析" />
            ) : (
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Space wrap>
                  <Card size="small">
                    <Statistic title="平均分" value={statistics.averageScore} />
                  </Card>
                  <Card size="small">
                    <Statistic title="通过率" value={statistics.passRate} suffix="%" />
                  </Card>
                  <Card size="small">
                    <Statistic title="最高分" value={statistics.highestScore} />
                  </Card>
                  <Card size="small">
                    <Statistic title="最低分" value={statistics.lowestScore} />
                  </Card>
                </Space>

                <Card size="small" title="错题分布">
                  <List
                    dataSource={statistics.wrongDistribution}
                    renderItem={(item) => (
                      <List.Item>
                        <Space direction="vertical" size={2}>
                          <Text>{item.content}</Text>
                          <Text type="secondary">错误率 {item.wrongRate}%</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>

                <Card size="small" title="学情简报">
                  <Paragraph>{statistics.learningBrief}</Paragraph>
                  <List
                    size="small"
                    dataSource={statistics.adaptiveRecommendations}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Card>
              </Space>
            )}
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
        title={answerTest ? `作答：${answerTest.title}` : '作答'}
        open={answerModalOpen}
        onCancel={() => setAnswerModalOpen(false)}
        onOk={() => void handleSubmitAnswer()}
        okText="提交测试"
        width={900}
      >
        {!answerTest ? null : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {answerTest.questions.map((question, index) => (
              <Card key={question.id} size="small" title={`第 ${index + 1} 题（${question.score} 分）`}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text>{question.content}</Text>

                  {question.type === 'single_choice' && (
                    <Radio.Group
                      value={answerDraft[question.id]}
                      onChange={(event) =>
                        setAnswerDraft((prev) => ({ ...prev, [question.id]: event.target.value }))
                      }
                    >
                      <Space direction="vertical">
                        {question.options?.map((option) => (
                          <Radio key={option.id} value={option.label}>
                            {option.label}. {option.content}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  )}

                  {question.type === 'fill_blank' && (
                    <Input
                      placeholder="请输入答案"
                      value={answerDraft[question.id]}
                      onChange={(event) =>
                        setAnswerDraft((prev) => ({ ...prev, [question.id]: event.target.value }))
                      }
                    />
                  )}

                  {question.type === 'short_answer' && (
                    <TextArea
                      rows={4}
                      placeholder="请输入作答内容"
                      value={answerDraft[question.id]}
                      onChange={(event) =>
                        setAnswerDraft((prev) => ({ ...prev, [question.id]: event.target.value }))
                      }
                    />
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Modal>

      <Modal
        title={gradingSubmission ? `批改：${gradingSubmission.studentName}` : '批改'}
        open={gradeModalOpen}
        onCancel={() => setGradeModalOpen(false)}
        onOk={() => void handleGradeSubmit()}
        okText="提交批改"
        width={900}
      >
        {!gradingSubmission || !gradingTest ? null : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {gradingTest.questions.map((question) => {
              const answer = gradingSubmission.answers.find((item) => item.questionId === question.id);
              return (
                <Card key={question.id} size="small" title={`${question.content}（满分 ${question.score}）`}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>学生答案：{answer?.answer || '未作答'}</Text>
                    <Text type="secondary">参考答案：{question.answer || '无'}</Text>
                    <Space>
                      <InputNumber
                        min={0}
                        max={question.score}
                        value={gradeDraft[question.id]?.score ?? 0}
                        onChange={(value) =>
                          setGradeDraft((prev) => ({
                            ...prev,
                            [question.id]: {
                              ...prev[question.id],
                              score: value ?? 0,
                            },
                          }))
                        }
                      />
                      <Text type="secondary">得分</Text>
                    </Space>
                    <Input
                      placeholder="批改反馈（可选）"
                      value={gradeDraft[question.id]?.feedback}
                      onChange={(event) =>
                        setGradeDraft((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            feedback: event.target.value,
                          },
                        }))
                      }
                    />
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Modal>

      <Modal
        title={detailTest ? `测试详情：${detailTest.title}` : '测试详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={900}
      >
        {!detailSubmission || !detailTest ? null : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small">
              <Space wrap>
                <Tag>{detailTest.courseName}</Tag>
                <Tag color={detailSubmission.status === 'graded' ? 'green' : 'blue'}>
                  {detailSubmission.status === 'graded' ? '已批改' : '待批改'}
                </Tag>
                <Text>总分：{detailSubmission.totalScore ?? '-'}</Text>
                <Text>提交时间：{detailSubmission.submittedAt ? new Date(detailSubmission.submittedAt).toLocaleString() : '-'}</Text>
              </Space>
            </Card>

            {detailTest.questions.map((question, index) => {
              const answer = detailSubmission.answers.find((item) => item.questionId === question.id);
              return (
                <Card key={question.id} size="small" title={`第 ${index + 1} 题`}> 
                  <Space direction="vertical" size={6}>
                    <Text>{question.content}</Text>
                    <Text>我的答案：{answer?.answer || '未作答'}</Text>
                    <Text type="secondary">得分：{answer?.score ?? '-'} / {question.score}</Text>
                    <Text type="secondary">解析：{question.analysis || '无'}</Text>
                    {answer?.feedback && <Text type="secondary">教师反馈：{answer.feedback}</Text>}
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
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
