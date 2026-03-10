import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  Input,
  Radio,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSubmission, fetchTestById, submitTest } from '@/store/slices/testSlice';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TestAnswer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentTest, currentSubmission, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const testId = (location.state?.testId ?? location.state?.test?.id) as string | undefined;

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    if (user?.role === 'student') {
      void dispatch(fetchSubmission({ testId }));
    }
  }, [dispatch, testId, user?.role]);

  useEffect(() => {
    if (!currentSubmission) {
      return;
    }

    const nextAnswers: Record<string, string> = {};
    currentSubmission.answers.forEach((item) => {
      nextAnswers[item.questionId] = item.answer;
    });
    setAnswers(nextAnswers);
  }, [currentSubmission]);

  const isReadOnly = useMemo(() => {
    if (!currentTest) {
      return true;
    }

    if (currentTest.status === 'ended') {
      return true;
    }

    return currentSubmission?.status === 'submitted' || currentSubmission?.status === 'graded';
  }, [currentSubmission?.status, currentTest]);

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!currentTest) {
      return;
    }

    const payload = currentTest.questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id] ?? '',
    }));

    try {
      await dispatch(submitTest({ testId: currentTest.id, answers: payload })).unwrap();
      messageApi.success('测试提交成功');
      navigate('/tests');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '提交失败');
    }
  };

  if (!testId) {
    return <Empty description="缺少测试标识，无法进入答题页" />;
  }

  if (loading && !currentTest) {
    return <Spin spinning tip="加载测试中..." />;
  }

  if (!currentTest) {
    return <Empty description="测试不存在" />;
  }

  return (
    <div className="test-answer-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
            返回测试列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            学生答题
          </Title>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>{currentTest.title}</Title>
          <Space wrap>
            <Text type="secondary">课程：{currentTest.courseName}</Text>
            <Text type="secondary">时长：{currentTest.duration} 分钟</Text>
            <Text type="secondary">总分：{currentTest.totalScore}</Text>
            <Tag color={currentTest.status === 'published' ? 'green' : 'purple'}>
              {currentTest.status === 'published' ? '进行中' : currentTest.status === 'ended' ? '已结束' : '草稿'}
            </Tag>
          </Space>
          {currentSubmission && (
            <Space wrap>
              <Text>得分：{currentSubmission.totalScore ?? '-'}</Text>
              <Text>状态：{currentSubmission.status === 'graded' ? '已批改' : '待批改'}</Text>
            </Space>
          )}
          {currentTest.description && <Paragraph type="secondary">{currentTest.description}</Paragraph>}
        </Space>
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
        {currentTest.questions.map((question, index) => {
          const answerRecord = currentSubmission?.answers.find((item) => item.questionId === question.id);

          return (
            <Card key={question.id} title={`第 ${index + 1} 题（${question.score} 分）`}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text>{question.content}</Text>

                {question.type === 'single_choice' && question.options && (
                  <Radio.Group
                    disabled={isReadOnly}
                    value={answers[question.id]}
                    onChange={(event) => updateAnswer(question.id, event.target.value)}
                  >
                    <Space direction="vertical">
                      {question.options.map((option) => (
                        <Radio key={option.id} value={option.label}>
                          {option.label}. {option.content}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                )}

                {question.type === 'fill_blank' && (
                  <Input
                    disabled={isReadOnly}
                    placeholder="请输入答案"
                    value={answers[question.id]}
                    onChange={(event) => updateAnswer(question.id, event.target.value)}
                  />
                )}

                {question.type === 'short_answer' && (
                  <TextArea
                    disabled={isReadOnly}
                    rows={5}
                    placeholder="请输入作答内容"
                    value={answers[question.id]}
                    onChange={(event) => updateAnswer(question.id, event.target.value)}
                  />
                )}

                {isReadOnly && currentTest.showAnswer && (
                  <Card size="small" type="inner" title="参考信息">
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text>我的答案：{answerRecord?.answer || '未作答'}</Text>
                      <Text>参考答案：{question.answer || '暂无'}</Text>
                      {typeof answerRecord?.score === 'number' && <Text>得分：{answerRecord.score}</Text>}
                      {answerRecord?.feedback && <Text type="secondary">教师反馈：{answerRecord.feedback}</Text>}
                      {question.analysis && <Text type="secondary">题目解析：{question.analysis}</Text>}
                    </Space>
                  </Card>
                )}
              </Space>
            </Card>
          );
        })}
      </Space>

      <div style={{ marginTop: 16 }}>
        {!isReadOnly && currentTest.status === 'published' && (
          <Button type="primary" onClick={() => void handleSubmit()}>
            提交测试
          </Button>
        )}
      </div>
    </div>
  );
};

export default TestAnswer;
