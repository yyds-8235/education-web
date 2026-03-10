import { useEffect, useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourses } from '@/store/slices/courseSlice';
import {
  createTest,
  fetchTests,
  publishTest,
  submitAppeal,
  updateTest,
} from '@/store/slices/testSlice';
import type { CreateTestParams, QuestionType, Test, TestSubmission } from '@/types';
import './TestList.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

type QuestionDraft = {
  id: string;
  type: QuestionType;
  content: string;
  options?: Array<{ id: string; label: string; content: string }>;
  answer: string;
  score: number;
  analysis?: string;
};

const questionTypeOptions: Array<{ label: string; value: QuestionType }> = [
  { label: '单选题', value: 'single_choice' },
  { label: '填空题', value: 'fill_blank' },
  { label: '简答题', value: 'short_answer' },
];

const buildDefaultQuestion = (type: QuestionType): QuestionDraft => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
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

const statusLabelMap: Record<Test['status'], string> = {
  draft: '草稿',
  published: '已发布',
  ended: '已结束',
};

const TestList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses } = useAppSelector((state) => state.course);
  const { tests, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

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

  const completedTests = useMemo(() => {
    if (!user || user.role !== 'student') {
      return [] as Array<{ test: Test; submission: TestSubmission }>;
    }

    return tests
      .map((test) => {
        const submission = test.submissions.find((item) => item.studentId === user.id);
        return submission ? { test, submission } : null;
      })
      .filter(Boolean) as Array<{ test: Test; submission: TestSubmission }>;
  }, [tests, user]);

  const pendingTests = useMemo(() => {
    if (!user || user.role !== 'student') {
      return [] as Test[];
    }

    return tests.filter((test) => !test.submissions.some((item) => item.studentId === user.id));
  }, [tests, user]);

  const loadPageData = async () => {
    try {
      if (user?.role === 'teacher') {
        await dispatch(fetchCourses({ page: 1, pageSize: 100, scope: 'mine' })).unwrap();
      }
      await dispatch(fetchTests({ page: 1, pageSize: 100 })).unwrap();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '加载测试数据失败');
    }
  };

  useEffect(() => {
    void loadPageData();
  }, [dispatch, user?.id]);

  const openCreateModal = () => {
    setEditingTest(null);
    setQuestionDrafts([]);
    form.setFieldsValue({ showAnswer: true, duration: 30 });
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
      })),
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
            option.label === optionLabel ? { ...option, content } : option,
          ),
        };
      }),
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

    if (
      questionDrafts.some(
        (question) =>
          question.type === 'single_choice' &&
          (!question.options || question.options.some((option) => !option.content.trim())),
      )
    ) {
      messageApi.warning('请补全单选题选项内容');
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
      await loadPageData();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '保存失败');
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      await dispatch(publishTest(testId)).unwrap();
      messageApi.success('测试已发布');
      await loadPageData();
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

  const handleAnswer = (testId: string) => {
    navigate('/tests/answer', { state: { testId } });
  };

  const handleViewDetail = (testId: string, submissionId?: string) => {
    navigate('/tests/detail', { state: { testId, submissionId } });
  };

  const openAppealModal = (submission: TestSubmission) => {
    setAppealSubmission(submission);
    setAppealReason(submission.appealReason ?? '');
    setAppealOpen(true);
  };

  const handleSubmitAppeal = async () => {
    if (!appealSubmission || !appealReason.trim()) {
      messageApi.warning('请填写申诉原因');
      return;
    }

    try {
      await dispatch(
        submitAppeal({ submissionId: appealSubmission.id, reason: appealReason.trim() }),
      ).unwrap();
      messageApi.success('申诉已提交');
      setAppealOpen(false);
      setAppealReason('');
      setAppealSubmission(null);
      await loadPageData();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '申诉提交失败');
    }
  };

  const renderTeacherList = () => {
    if (tests.length === 0 && !loading) {
      return <Empty description="暂无测试，请先创建测试" />;
    }

    return (
      <List
        dataSource={tests}
        renderItem={(test) => (
          <List.Item
            actions={[
              <Button key="edit" icon={<EditOutlined />} onClick={() => openEditModal(test)}>
                编辑
              </Button>,
              <Button
                key="publish"
                type="primary"
                icon={<SendOutlined />}
                disabled={test.status === 'published'}
                onClick={() => void handlePublish(test.id)}
              >
                发布
              </Button>,
              <Button key="grade" icon={<FileDoneOutlined />} onClick={() => handleOpenGrading(test.id)}>
                批改
              </Button>,
              <Button key="stats" icon={<BarChartOutlined />} onClick={() => handleOpenStatistics(test.id)}>
                统计
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space wrap>
                  <span>{test.title}</span>
                  <Tag color={test.status === 'published' ? 'green' : test.status === 'ended' ? 'purple' : 'default'}>
                    {statusLabelMap[test.status]}
                  </Tag>
                </Space>
              }
              description={`${test.courseName} · ${test.questions.length} 题 · 总分 ${test.totalScore} · 已提交 ${test.submissions.length}`}
            />
          </List.Item>
        )}
      />
    );
  };

  const renderStudentList = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="可参加测试">
        {pendingTests.length === 0 ? (
          <Empty description="暂无可参加测试" />
        ) : (
          <List
            dataSource={pendingTests}
            renderItem={(test) => (
              <List.Item
                actions={[
                  <Button
                    key="answer"
                    type="primary"
                    disabled={test.status !== 'published'}
                    onClick={() => handleAnswer(test.id)}
                  >
                    {test.status === 'published' ? '开始答题' : '查看详情'}
                  </Button>,
                  <Button key="detail" icon={<EyeOutlined />} onClick={() => handleViewDetail(test.id)}>
                    详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <span>{test.title}</span>
                      <Tag>{test.courseName}</Tag>
                      <Tag color={test.status === 'published' ? 'green' : 'purple'}>
                        {test.status === 'published' ? '进行中' : '已结束'}
                      </Tag>
                    </Space>
                  }
                  description={`题量 ${test.questions.length}，时长 ${test.duration} 分钟，总分 ${test.totalScore}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="已完成测试">
        {completedTests.length === 0 ? (
          <Empty description="暂无已完成测试" />
        ) : (
          <List
            dataSource={completedTests}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="detail"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(item.test.id, item.submission.id)}
                  >
                    查看结果
                  </Button>,
                  <Button
                    key="appeal"
                    disabled={item.submission.status !== 'graded'}
                    onClick={() => openAppealModal(item.submission)}
                  >
                    成绩申诉
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={item.test.title}
                  description={
                    <Space wrap>
                      <Tag>{item.test.courseName}</Tag>
                      <Tag color={item.submission.status === 'graded' ? 'green' : 'blue'}>
                        {item.submission.status === 'graded' ? '已批改' : '待批改'}
                      </Tag>
                      <Text>得分：{item.submission.totalScore ?? '-'}</Text>
                      {item.submission.appealStatus && (
                        <Tag color="orange">申诉状态：{item.submission.appealStatus}</Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );

  return (
    <div className="test-list-page">
      {contextHolder}
      <div className="page-header">
        <div>
          <Title level={3}>测试系统</Title>
          <Text type="secondary">
            {user?.role === 'teacher'
              ? '创建、发布测试并完成批改与统计分析。'
              : '参加测试、查看成绩并可对已批改结果发起申诉。'}
          </Text>
        </div>
        {user?.role === 'teacher' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            创建测试
          </Button>
        )}
      </div>

      {user?.role === 'teacher' ? renderTeacherList() : renderStudentList()}

      <Modal
        title={editingTest ? '编辑测试' : '创建测试'}
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={() => form.submit()}
        width={960}
      >
        <Form form={form} layout="vertical" initialValues={{ showAnswer: true, duration: 30 }} onFinish={handleSaveTest}>
          <Form.Item label="所属课程" name="courseId" rules={[{ required: true, message: '请选择课程' }]}> 
            <Select
              placeholder="请选择课程"
              options={teacherCourses.map((course) => ({ label: course.name, value: course.id }))}
            />
          </Form.Item>

          <Form.Item label="测试标题" name="title" rules={[{ required: true, message: '请输入标题' }]}> 
            <Input placeholder="请输入测试标题" />
          </Form.Item>

          <Form.Item label="测试描述" name="description">
            <TextArea rows={3} placeholder="请输入测试描述" />
          </Form.Item>

          <Space size={16} style={{ width: '100%' }}>
            <Form.Item label="测试时长（分钟）" name="duration" rules={[{ required: true, message: '请输入时长' }]}> 
              <InputNumber min={5} max={180} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item label="是否展示答案" name="showAnswer" rules={[{ required: true }]}> 
              <Select
                style={{ width: 180 }}
                options={[
                  { label: '展示', value: true },
                  { label: '不展示', value: false },
                ]}
              />
            </Form.Item>
          </Space>

          <Card
            size="small"
            title="题目设置"
            extra={
              <Space>
                {questionTypeOptions.map((item) => (
                  <Button key={item.value} onClick={() => addQuestion(item.value)}>
                    新增{item.label}
                  </Button>
                ))}
              </Space>
            }
          >
            {questionDrafts.length === 0 ? (
              <Empty description="请先添加题目" />
            ) : (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {questionDrafts.map((question, index) => (
                  <Card
                    key={question.id}
                    size="small"
                    title={`第 ${index + 1} 题 · ${questionTypeOptions.find((item) => item.value === question.type)?.label}`}
                    extra={<Button danger type="link" onClick={() => removeQuestion(question.id)}>删除</Button>}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Input.TextArea
                        rows={2}
                        placeholder="请输入题目内容"
                        value={question.content}
                        onChange={(event) => updateQuestion(question.id, { content: event.target.value })}
                      />

                      {question.type === 'single_choice' && question.options && (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {question.options.map((option) => (
                            <Input
                              key={option.label}
                              addonBefore={option.label}
                              placeholder={`请输入选项 ${option.label}`}
                              value={option.content}
                              onChange={(event) => updateOption(question.id, option.label, event.target.value)}
                            />
                          ))}
                        </Space>
                      )}

                      <Input
                        placeholder={question.type === 'fill_blank' ? '填写标准答案' : '填写参考答案'}
                        value={question.answer}
                        onChange={(event) => updateQuestion(question.id, { answer: event.target.value })}
                      />

                      <InputNumber
                        min={1}
                        max={100}
                        value={question.score}
                        onChange={(value) => updateQuestion(question.id, { score: value ?? 10 })}
                      />

                      <TextArea
                        rows={2}
                        placeholder="请输入答案解析（可选）"
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
      >
        <TextArea
          rows={4}
          value={appealReason}
          onChange={(event) => setAppealReason(event.target.value)}
          placeholder="请输入申诉原因"
        />
      </Modal>
    </div>
  );
};

export default TestList;
