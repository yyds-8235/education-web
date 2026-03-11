import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
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
import { fetchTests, publishTest, submitAppeal } from '@/store/slices/testSlice';
import type { Test, TestSubmission } from '@/types';
import './TestList.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusLabelMap: Record<Test['status'], string> = {
  draft: '草稿',
  published: '已发布',
  ended: '已结束',
};

const TestList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { tests, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmission, setAppealSubmission] = useState<TestSubmission | null>(null);

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
    return (
      <List
        loading={loading}
        dataSource={tests}
        locale={{ emptyText: loading ? null : <Empty description="暂无测试，请先创建测试" /> }}
        renderItem={(test) => {
          const isReadOnlyTest = test.status !== 'draft';
          const isFullyGraded = test.submissions.length > 0 && test.submissions.every((item) => item.status === 'graded');

          return (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  icon={isReadOnlyTest ? <EyeOutlined /> : <EditOutlined />}
                  onClick={() => (isReadOnlyTest ? handleViewDetail(test.id) : navigate(`/tests/${test.id}/edit`))}
                >
                  {isReadOnlyTest ? '查看' : '编辑'}
                </Button>,
                <Button
                  key="publish"
                  type="primary"
                  icon={<SendOutlined />}
                  disabled={test.status !== 'draft'}
                  onClick={() => void handlePublish(test.id)}
                >
                  发布
                </Button>,
                <Button
                  key="grade"
                  icon={isFullyGraded ? <EyeOutlined /> : <FileDoneOutlined />}
                  onClick={() => handleOpenGrading(test.id)}
                >
                  {isFullyGraded ? '查看' : '批改'}
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
          );
        }}
      />
    );
  };

  const renderStudentList = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="可参加测试">
        <List
          loading={loading}
          dataSource={pendingTests}
          locale={{ emptyText: loading ? null : <Empty description="暂无可参加测试" /> }}
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
      </Card>

      <Card title="已完成测试">
        <List
          loading={loading}
          dataSource={completedTests}
          locale={{ emptyText: loading ? null : <Empty description="暂无已完成测试" /> }}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tests/create')}>
            创建测试
          </Button>
        )}
      </div>

      {user?.role === 'teacher' ? renderTeacherList() : renderStudentList()}

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
