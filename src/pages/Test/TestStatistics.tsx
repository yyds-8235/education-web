import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  List,
  Space,
  Statistic,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStatistics } from '@/store/slices/testSlice';
import type { Test } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const TestStatistics = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { tests, statistics } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  const [currentTest, setCurrentTest] = useState<Test | null>(null);

  useEffect(() => {
    if (testId) {
      const test = tests.find((t) => t.id === testId);
      if (test) {
        setCurrentTest(test);
        void loadStatistics(testId);
      }
    }
  }, [dispatch, testId, tests]);

  const handleBack = () => {
    navigate('/tests');
  };

  const loadStatistics = async (id: string) => {
    try {
      await dispatch(fetchStatistics(id)).unwrap();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '统计失败');
    }
  };

  return (
    <div className="test-statistics-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回测试列表
          </Button>
          <Title level={3}>测试统计与学情分析</Title>
        </Space>
      </div>

      {!currentTest ? (
        <Empty description="测试不存在" />
      ) : !statistics ? (
        <Empty description="正在加载统计数据..." />
      ) : (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Card title={`${currentTest.title} - 统计分析`}>
            <Space wrap style={{ marginBottom: 20 }}>
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

            <Card size="small" title="错题分布" style={{ marginBottom: 20 }}>
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
          </Card>
        </Space>
      )}
    </div>
  );
};

export default TestStatistics;