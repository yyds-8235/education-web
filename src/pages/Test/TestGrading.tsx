import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { batchGradeObjective, fetchSubmissions, gradeSubmission } from '@/store/slices/testSlice';
import type { Test, TestSubmission } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const TestGrading = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { tests, submissions } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  const [gradingTest, setGradingTest] = useState<Test | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<TestSubmission | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: number; feedback?: string }>>({});

  useEffect(() => {
    if (testId) {
      const test = tests.find((t) => t.id === testId);
      if (test) {
        setGradingTest(test);
        void dispatch(fetchSubmissions(test.id));
      }
    }
  }, [dispatch, testId, tests]);

  const handleBack = () => {
    navigate('/tests');
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
      messageApi.success('批改完成');
      setGradeModalOpen(false);
      if (gradingTest) {
        await dispatch(fetchSubmissions(gradingTest.id));
      }
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批改失败');
    }
  };

  const handleBatchGrade = async () => {
    if (!gradingTest) {
      return;
    }

    try {
      await dispatch(batchGradeObjective({ testId: gradingTest.id })).unwrap();
      await dispatch(fetchSubmissions(gradingTest.id));
      messageApi.success('客观题批量批改完成');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批量批改失败');
    }
  };

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
      render: (value) => <Tag color={value === 'graded' ? 'green' : 'default'}>{value === 'graded' ? '已批改' : '待批改'}</Tag>,
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
    <div className="test-grading-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回测试列表
          </Button>
          <Title level={3}>批改面板</Title>
        </Space>
      </div>

      {!gradingTest ? (
        <Empty description="测试不存在" />
      ) : (
        <Card
          title={`${gradingTest.title} - 批改面板`}
          extra={
            <Button onClick={() => void handleBatchGrade()} type="primary">
              批量批改客观题
            </Button>
          }
        >
          <Table
            rowKey="id"
            dataSource={submissions}
            columns={gradingColumns}
            pagination={false}
            locale={{ emptyText: '暂无学生提交' }}
          />
        </Card>
      )}

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