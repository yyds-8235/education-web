import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourses } from '@/store/slices/courseSlice';
import { createTest, fetchTestById, updateTest } from '@/store/slices/testSlice';
import type { CreateTestParams, QuestionType } from '@/types';

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

const TestEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAppSelector((state) => state.auth);
  const { allCourses } = useAppSelector((state) => state.course);
  const { currentTest, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const teacherCourses = useMemo(() => {
    if (!user || user.role !== 'teacher') {
      return [];
    }

    return allCourses.filter((course) => course.teacherId === user.id);
  }, [allCourses, user]);

  const totalScore = useMemo(
    () => questionDrafts.reduce((sum, question) => sum + question.score, 0),
    [questionDrafts],
  );
  const editingTest = isEdit && currentTest?.id === id ? currentTest : null;

  useEffect(() => {
    if (user?.role !== 'teacher') {
      return;
    }

    void dispatch(fetchCourses({ page: 1, pageSize: 100, scope: 'mine' }));
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (!isEdit || !id) {
      form.setFieldsValue({ showAnswer: true, duration: 30 });
      return;
    }

    void dispatch(fetchTestById(id));
  }, [dispatch, form, id, isEdit]);

  useEffect(() => {
    if (!isEdit || !id || currentTest?.id !== id) {
      return;
    }

    form.setFieldsValue({
      courseId: currentTest.courseId,
      title: currentTest.title,
      description: currentTest.description,
      duration: currentTest.duration,
      showAnswer: currentTest.showAnswer,
    });

    setQuestionDrafts(
      currentTest.questions.map((question) => ({
        id: question.id,
        type: question.type,
        content: question.content,
        options: question.options?.map((option) => ({ ...option })),
        answer: question.answer,
        score: question.score,
        analysis: question.analysis,
      })),
    );
  }, [currentTest, form, id, isEdit]);

  const addQuestion = (type: QuestionType) => {
    setQuestionDrafts((prev) => [...prev, buildDefaultQuestion(type)]);
  };

  const updateQuestion = (questionId: string, payload: Partial<QuestionDraft>) => {
    setQuestionDrafts((prev) =>
      prev.map((question) => (question.id === questionId ? { ...question, ...payload } : question)),
    );
  };

  const removeQuestion = (questionId: string) => {
    setQuestionDrafts((prev) => prev.filter((question) => question.id !== questionId));
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

    setSaving(true);

    try {
      if (isEdit && id) {
        await dispatch(updateTest({ id, ...payload })).unwrap();
        messageApi.success('测试已更新');
      } else {
        await dispatch(createTest(payload)).unwrap();
        messageApi.success('测试已创建');
      }

      navigate('/tests');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'teacher') {
    return <Empty description="仅教师可操作测试编辑" />;
  }

  if (isEdit && loading && !editingTest) {
    return <Spin spinning tip="加载测试中..." />;
  }

  if (editingTest && editingTest.status !== 'draft') {
    return (
      <div className="test-editor-page">
        {contextHolder}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')} style={{ alignSelf: 'flex-start' }}>
            返回测试列表
          </Button>
          <Empty description="已发布或已结束的测试仅支持查看" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => navigate('/tests/detail', { state: { testId: id } })}>
              前往查看详情
            </Button>
          </Empty>
        </Space>
      </div>
    );
  }

  return (
    <div className="test-editor-page">
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Space direction="vertical" size={4}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
                返回测试列表
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {isEdit ? '编辑测试' : '创建测试'}
              </Title>
            </Space>
            <Text type="secondary">配置测试基础信息、题目内容和答案解析。</Text>
          </Space>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            保存测试
          </Button>
        </div>

        <Form form={form} layout="vertical" initialValues={{ showAnswer: true, duration: 30 }} onFinish={handleSaveTest}>
          <Card>
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

            <Space size={16} style={{ width: '100%' }} wrap>
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
              <Form.Item label="题目数">
                <InputNumber value={questionDrafts.length} readOnly style={{ width: 120 }} />
              </Form.Item>
              <Form.Item label="总分">
                <InputNumber value={totalScore} readOnly style={{ width: 120 }} />
              </Form.Item>
            </Space>
          </Card>

          <Card
            style={{ marginTop: 16 }}
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
      </Space>
    </div>
  );
};

export default TestEditorPage;
