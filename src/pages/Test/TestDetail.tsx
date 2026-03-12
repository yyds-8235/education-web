﻿﻿﻿import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSubmission, fetchTestById } from '@/store/slices/testSlice';

const { Title, Text, Paragraph } = Typography;

const appealStatusTextMap = {
  pending: '待处理',
  accepted: '已通过',
  rejected: '已驳回',
} as const;

const TestDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentTest, currentSubmission, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  const testId = (location.state?.testId ?? location.state?.test?.id) as string | undefined;
  const submissionId = (location.state?.submissionId ?? location.state?.submission?.id) as string | undefined;

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    if (user?.role === 'student') {
      void dispatch(fetchSubmission({ testId }));
    }
  }, [dispatch, testId, user?.role]);

  const submission = useMemo(() => {
    if (!currentTest) {
      return null;
    }

    if (submissionId) {
      return currentTest.submissions.find((item) => item.id === submissionId) ?? currentSubmission;
    }

    return currentSubmission;
  }, [currentSubmission, currentTest, submissionId]);

  useEffect(() => {
    if (!testId) {
      messageApi.warning('缺少测试标识');
    }
  }, [messageApi, testId]);

  if (!testId) {
    return <Empty description="缺少测试标识" />;
  }

  if (loading && !currentTest) {
    return <Spin spinning tip="加载测试详情中..." />;
  }

  if (!currentTest) {
    return <Empty description="测试不存在" />;
  }

  return (
    <div className="test-detail-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
            返回测试列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            测试详情
          </Title>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>{currentTest.title}</Title>
          <Space wrap>
            <Tag>{currentTest.courseName}</Tag>
            <Tag color={currentTest.status === 'published' ? 'green' : currentTest.status === 'ended' ? 'purple' : 'default'}>
              {currentTest.status === 'published' ? '已发布' : currentTest.status === 'ended' ? '已结束' : '草稿'}
            </Tag>
            <Text type="secondary">时长：{currentTest.duration} 分钟</Text>
            <Text type="secondary">总分：{currentTest.totalScore}</Text>
          </Space>
          {currentTest.description && <Paragraph type="secondary">{currentTest.description}</Paragraph>}
          {submission && (
            <Space wrap>
              <Text>我的得分：{submission.totalScore ?? '-'}</Text>
              <Text>提交状态：{submission.status === 'graded' ? '已批改' : '待批改'}</Text>
              {submission.appealStatus && <Tag color="orange">申诉状态：{appealStatusTextMap[submission.appealStatus]}</Tag>}
            </Space>
          )}
        </Space>
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
        {currentTest.questions.map((question, index) => {
          const answer = submission?.answers.find((item) => item.questionId === question.id);

          return (
            <Card key={question.id} title={`第 ${index + 1} 题（${question.score} 分）`}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text>{question.content}</Text>
                {question.options && question.options.length > 0 && (
                  <Space direction="vertical" size={4}>
                    {question.options.map((option) => (
                      <Text key={option.id}>{option.label}. {option.content}</Text>
                    ))}
                  </Space>
                )}
                {submission && <Text>学生答案：{answer?.answer || '未作答'}</Text>}
                {(currentTest.showAnswer || user?.role === 'teacher') && <Text>参考答案：{question.answer || '暂无'}</Text>}
                {typeof answer?.score === 'number' && <Text>得分：{answer.score}</Text>}
                {answer?.feedback && <Text type="secondary">教师反馈：{answer.feedback}</Text>}
                {question.analysis && <Text type="secondary">解析：{question.analysis}</Text>}
              </Space>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default TestDetail;
