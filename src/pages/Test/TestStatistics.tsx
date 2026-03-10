import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  List,
  Space,
  Spin,
  Statistic,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStatistics, fetchTestById } from '@/store/slices/testSlice';

const { Title, Text, Paragraph } = Typography;

const TestStatistics = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { currentTest, statistics, loading } = useAppSelector((state) => state.test);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!testId) {
      return;
    }

    void dispatch(fetchTestById(testId));
    void dispatch(fetchStatistics(testId));
  }, [dispatch, testId]);

  useEffect(() => {
    if (!testId) {
      messageApi.warning('缺少测试标识');
    }
  }, [messageApi, testId]);

  if (!testId) {
    return <Empty description="缺少测试标识" />;
  }

  return (
    <div className="test-statistics-page">
      {contextHolder}
      <div className="test-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tests')}>
            返回测试列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            测试统计与学情分析
          </Title>
        </Space>
      </div>

      {!currentTest ? (
        loading ? <Spin spinning tip="加载测试中..." /> : <Empty description="测试不存在" />
      ) : !statistics ? (
        <Spin spinning tip="加载统计数据中..." />
      ) : (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Card title={`${currentTest.title} - 统计分析`}>
            <Space wrap style={{ marginBottom: 20 }}>
              <Card size="small"><Statistic title="平均分" value={statistics.averageScore} /></Card>
              <Card size="small"><Statistic title="通过率" value={statistics.passRate} suffix="%" /></Card>
              <Card size="small"><Statistic title="最高分" value={statistics.highestScore} /></Card>
              <Card size="small"><Statistic title="最低分" value={statistics.lowestScore} /></Card>
              <Card size="small"><Statistic title="提交人数" value={statistics.totalSubmissions} /></Card>
            </Space>

            <Card size="small" title="错题分布" style={{ marginBottom: 20 }}>
              <List
                dataSource={statistics.wrongDistribution}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={2}>
                      <Text>{item.content}</Text>
                      <Text type="secondary">错误率：{item.wrongRate}%</Text>
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
