import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  batchGradeObjective,
  fetchSubmissions,
  fetchTestById,
  gradeSubmission,
} from '@/store/slices/testSlice';
import type { TestQuestion, TestSubmission } from '@/types';

const { Title, Text } = Typography;

const TestGrading = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTest, submissions, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();
  const [gradingSubmission, setGradingSubmission] = useState<TestSubmission | null>(null);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: number }>>({});

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    void dispatch(fetchSubmissions(testId));
  }, [dispatch, testId]);

  const handleOpenGrading = (submission: TestSubmission) => {
    setGradingSubmission(submission);
    const draft: Record<string, { score: number }> = {};
    submission.answers.forEach((answer) => {
      draft[answer.questionId] = { score: answer.score ?? 0 };
    });
    setGradeDraft(draft);
  };

  const handleSubmitGrade = async () => {
    if (!gradingSubmission) {
      return;
    }

    try {
      await dispatch(
        gradeSubmission({
          submissionId: gradingSubmission.id,
          answers: Object.entries(gradeDraft).map(([questionId, value]) => ({
            questionId,
            score: value.score,
          })),
        }),
      ).unwrap();
      messageApi.success('批改完成');
      setGradingSubmission(null);
      if (testId) {
        await dispatch(fetchSubmissions(testId)).unwrap();
      }
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批改失败');
    }
  };

  const handleBatchGrade = async () => {
    if (!testId) {
      return;
    }

    try {
      await dispatch(batchGradeObjective({ testId })).unwrap();
      await dispatch(fetchSubmissions(testId)).unwrap();
      messageApi.success('客观题批量批改完成');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批量批改失败');
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
        <Button type="link" onClick={() => handleOpenGrading(record)}>
          批改
        </Button>
      ),
    },
  ];

  const questionMap = useMemo(() => {
    const map = new Map<string, TestQuestion>();
    currentTest?.questions.forEach((question) => map.set(question.id, question));
    return map;
  }, [currentTest]);

  if (!testId) {
    return <Empty description="缺少测试标识" />;
  }

  return (
    <div className="test-grading-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
            返回测试列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            测试批改
          </Title>
        </Space>
        <Button onClick={() => void handleBatchGrade()}>客观题批量批改</Button>
      </div>

      {!currentTest ? (
        loading ? <Spin spinning tip="加载测试中..." /> : <Empty description="测试不存在" />
      ) : (
        <Card title={currentTest.title} extra={<Text>{currentTest.courseName}</Text>}>
          <Table rowKey="id" columns={columns} dataSource={submissions} pagination={false} />
        </Card>
      )}

      <Modal
        title={gradingSubmission ? `批改 - ${gradingSubmission.studentName}` : '批改测试'}
        open={Boolean(gradingSubmission)}
        onCancel={() => setGradingSubmission(null)}
        onOk={() => void handleSubmitGrade()}
        width={840}
      >
        {gradingSubmission && currentTest && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {gradingSubmission.answers.map((answer) => {
              const question = questionMap.get(answer.questionId);
              if (!question) {
                return null;
              }

              return (
                <Card key={answer.questionId} size="small" title={`${question.content}（满分 ${question.score}）`}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text>学生答案：{answer.answer || '未作答'}</Text>
                    <Text type="secondary">参考答案：{question.answer || '暂无'}</Text>
                    <Space>
                      <InputNumber
                        min={0}
                        max={question.score}
                        value={gradeDraft[question.id]?.score ?? 0}
                        onChange={(value) =>
                          setGradeDraft((prev) => ({
                            ...prev,
                            [question.id]: { score: value ?? 0 },
                          }))
                        }
                      />
                      <Text type="secondary">得分</Text>
                    </Space>
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default TestGrading;
