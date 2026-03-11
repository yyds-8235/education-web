import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { batchGradeObjective, fetchSubmissions, fetchTestById } from '@/store/slices/testSlice';
import type { TestSubmission } from '@/types';
import './TestGrading.css';

const { Title, Text } = Typography;

const TestGrading = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTest, submissions, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();
  const [batchGrading, setBatchGrading] = useState(false);

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    void dispatch(fetchSubmissions(testId));
  }, [dispatch, testId]);

  const handleOpenReview = (submission: TestSubmission) => {
    navigate(`/tests/grading/${submission.testId}/submissions/${submission.id}`);
  };

  const handleBatchGrade = async () => {
    if (!testId) {
      return;
    }

    setBatchGrading(true);

    try {
      await dispatch(batchGradeObjective({ testId })).unwrap();
      await dispatch(fetchSubmissions(testId)).unwrap();
      messageApi.success('客观题批量批改完成');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批量批改失败');
    } finally {
      setBatchGrading(false);
    }
  };

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: TestSubmission['status']) => (value === 'graded' ? '已批改' : '待批改'),
    },
    {
      title: '得分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (value: number | undefined) => value ?? '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TestSubmission) => (
        <Button type="link" icon={record.status === 'graded' ? <EyeOutlined /> :  <EditOutlined />} onClick={() => handleOpenReview(record)}>
          {record.status === 'graded' ? '查看' : '批改'}
        </Button>
      ),
    },
  ];

  if (!testId) {
    return <Empty description="缺少测试标识" />;
  }

  return (
    <div className="test-grading-page">
      {contextHolder}
      {batchGrading && (
        <div className="test-batch-grading-overlay">
          <div className="test-batch-grading-card">
            <Spin size="large" />
            <Title level={4} style={{ margin: 0 }}>
              客观题批量批改中
            </Title>
            <Text type="secondary">系统正在处理客观题，请稍后...</Text>
          </div>
        </div>
      )}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
            返回测试列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            测试批改
          </Title>
        </Space>
        <Button loading={batchGrading} disabled={batchGrading} onClick={() => void handleBatchGrade()}>
          客观题批量批改
        </Button>
      </div>

      {!currentTest ? (
        loading ? <Spin spinning tip="加载测试中..." /> : <Empty description="测试不存在" />
      ) : (
        <Card title={currentTest.title} extra={<Text>{currentTest.courseName}</Text>}>
          <Table rowKey="id" columns={columns} dataSource={submissions} pagination={false} />
        </Card>
      )}
    </div>
  );
};

export default TestGrading;
