import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  InputNumber,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSubmissions, fetchTestById, gradeSubmission } from '@/store/slices/testSlice';
import type { TestQuestion } from '@/types';

const { Title, Text } = Typography;

const TestSubmissionReview = () => {
  const { testId, submissionId } = useParams<{ testId: string; submissionId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTest, submissions, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    void dispatch(fetchSubmissions(testId));
  }, [dispatch, testId]);

  const submission = useMemo(
    () =>
      submissions.find((item) => item.id === submissionId)
      ?? currentTest?.submissions.find((item) => item.id === submissionId)
      ?? null,
    [currentTest?.submissions, submissionId, submissions],
  );

  useEffect(() => {
    if (!submission) {
      return;
    }

    const nextDraft: Record<string, { score: number }> = {};
    submission.answers.forEach((answer) => {
      nextDraft[answer.questionId] = { score: answer.score ?? 0 };
    });
    setGradeDraft(nextDraft);
  }, [submission]);

  const questionMap = useMemo(() => {
    const map = new Map<string, TestQuestion>();
    currentTest?.questions.forEach((question) => map.set(question.id, question));
    return map;
  }, [currentTest]);

  const isReadonly = submission?.status === 'graded';

  const handleSubmitGrade = async () => {
    if (!submission) {
      return;
    }

    setSaving(true);

    try {
      await dispatch(
        gradeSubmission({
          submissionId: submission.id,
          answers: Object.entries(gradeDraft).map(([questionId, value]) => ({
            questionId,
            score: value.score,
          })),
        }),
      ).unwrap();
      messageApi.success('批改完成');
      navigate(`/tests/grading/${submission.testId}`);
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '批改失败');
    } finally {
      setSaving(false);
    }
  };

  if (!testId || !submissionId) {
    return <Empty description="缺少批改标识" />;
  }

  if (loading && (!currentTest || !submission)) {
    return <Spin spinning tip="加载批改内容中..." />;
  }

  if (!currentTest || !submission) {
    return <Empty description="未找到对应测试或提交记录" />;
  }

  return (
    <div className="test-submission-review-page">
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Space direction="vertical" size={4}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/tests/grading/${testId}`)}>
                返回批改列表
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {isReadonly ? '查看批改' : '测试批改'}
              </Title>
            </Space>
            <Text type="secondary">
              {currentTest.title} · {submission.studentName}（{submission.studentNo}）
            </Text>
          </Space>
          {!isReadonly && (
            <Button type="primary" loading={saving} onClick={() => void handleSubmitGrade()}>
              提交批改
            </Button>
          )}
        </div>

        <Card>
          <Space wrap>
            <Text>课程：{currentTest.courseName}</Text>
            <Text>提交状态：{submission.status === 'graded' ? '已批改' : '待批改'}</Text>
            <Text>总分：{submission.totalScore ?? '-'}</Text>
          </Space>
        </Card>

        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {submission.answers.map((answer) => {
            const question = questionMap.get(answer.questionId);
            if (!question) {
              return null;
            }

            return (
              <Card key={answer.questionId} title={`${question.content}（满分 ${question.score}）`}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text>学生答案：{answer.answer || '未作答'}</Text>
                  <Text type="secondary">参考答案：{question.answer || '暂无'}</Text>
                  {question.analysis && <Text type="secondary">解析：{question.analysis}</Text>}
                  <Space>
                    <InputNumber
                      min={0}
                      max={question.score}
                      disabled={isReadonly}
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
      </Space>
    </div>
  );
};

export default TestSubmissionReview;
