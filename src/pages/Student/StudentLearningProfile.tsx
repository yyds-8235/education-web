import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  ArrowLeftOutlined,
  BookOutlined,
  DotChartOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Result,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getStudentLearningProfileApi } from '@/services/student';
import { buildEmptyStudentLearningProfile } from '@/mock/studentAnalytics';
import { useAppSelector } from '@/store/hooks';
import type {
  StudentLearningCourse,
  StudentLearningProfile,
  StudentLearningStudent,
  StudentLearningTest,
} from '@/types';
import './StudentLearningProfile.css';

const { Title, Paragraph, Text } = Typography;

interface StudentLearningLocationState {
  student?: Partial<StudentLearningStudent>;
}

const courseStatusColorMap = {
  active: 'green',
  archived: 'default',
  draft: 'gold',
} as const;

const courseStatusTextMap = {
  active: '进行中',
  archived: '已归档',
  draft: '筹备中',
} as const;

const testStatusColorMap = {
  draft: 'default',
  published: 'processing',
  ended: 'purple',
} as const;

const testStatusTextMap = {
  draft: '草稿',
  published: '已发布',
  ended: '已结束',
} as const;

const submissionStatusColorMap = {
  not_started: 'default',
  draft: 'default',
  submitted: 'gold',
  graded: 'green',
} as const;

const submissionStatusTextMap = {
  not_started: '未作答',
  draft: '未发布',
  submitted: '待批改',
  graded: '已完成',
} as const;

const StudentLearningProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<StudentLearningProfile | null>(null);

  const locationState = location.state as StudentLearningLocationState | null;

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getStudentLearningProfileApi(id, {
          seedStudent: locationState?.student,
        });
        setProfile(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '加载学生学情信息失败';
        messageApi.error(errorMessage);
        setProfile(buildEmptyStudentLearningProfile(id, locationState?.student));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [id, locationState?.student, messageApi]);

  const courseColumns: ColumnsType<StudentLearningCourse> = [
    {
      title: '课程信息',
      key: 'courseName',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.courseName}</Text>
          <Text type="secondary">{record.subject} · {record.teacherName}</Text>
        </Space>
      ),
    },
    {
      title: '班级',
      key: 'className',
      render: (_, record) => `${record.grade} ${record.className}`,
    },
    {
      title: '学习进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: '测试完成',
      key: 'tests',
      render: (_, record) => `${record.completedTestCount}/${record.testCount}`,
    },
    {
      title: '平均得分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (value?: number) => (typeof value === 'number' ? `${value} 分` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: StudentLearningCourse['status']) => (
        <Tag color={courseStatusColorMap[value]}>{courseStatusTextMap[value]}</Tag>
      ),
    },
  ];

  const testColumns: ColumnsType<StudentLearningTest> = [
    {
      title: '测试名称',
      key: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.title}</Text>
          <Text type="secondary">{record.courseName}</Text>
        </Space>
      ),
    },
    {
      title: '测试状态',
      dataIndex: 'testStatus',
      key: 'testStatus',
      render: (value: StudentLearningTest['testStatus']) => (
        <Tag color={testStatusColorMap[value]}>{testStatusTextMap[value]}</Tag>
      ),
    },
    {
      title: '作答状态',
      dataIndex: 'submissionStatus',
      key: 'submissionStatus',
      render: (value: StudentLearningTest['submissionStatus']) => (
        <Tag color={submissionStatusColorMap[value]}>{submissionStatusTextMap[value]}</Tag>
      ),
    },
    {
      title: '得分',
      dataIndex: 'studentScore',
      key: 'studentScore',
      render: (value: number | undefined, record) => (typeof value === 'number' ? `${value}/${record.totalScore}` : '-'),
    },
    {
      title: '客观题正确率',
      dataIndex: 'objectiveCorrectRate',
      key: 'objectiveCorrectRate',
      render: (value?: number) => (typeof value === 'number' ? `${value}%` : '-'),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (value?: string) => (value ? new Date(value).toLocaleString() : '-'),
    },
  ];

  const progressOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: profile?.courses.map((course) => course.courseName) ?? [],
      axisLabel: {
        interval: 0,
        rotate: 20,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: '课程进度',
        type: 'bar',
        barWidth: 28,
        data: profile?.courses.map((course) => course.progress) ?? [],
        itemStyle: {
          color: '#2563EB',
          borderRadius: [8, 8, 0, 0],
        },
      },
    ],
  }), [profile?.courses]);

  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { top: 4 },
    xAxis: {
      type: 'category',
      data: profile?.trend.map((item) => item.label) ?? [],
      axisLabel: {
        interval: 0,
        rotate: 20,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: '课程进度',
        type: 'line',
        smooth: true,
        data: profile?.trend.map((item) => item.progress) ?? [],
        lineStyle: { width: 3, color: '#10B981' },
      },
      {
        name: '测试得分',
        type: 'line',
        smooth: true,
        data: profile?.trend.map((item) => item.score ?? null) ?? [],
        lineStyle: { width: 3, color: '#F59E0B' },
      },
    ],
  }), [profile?.trend]);

  const statusDistributionOption = useMemo(() => {
    const distribution = profile?.tests.reduce<Record<string, number>>((result, item) => {
      result[item.submissionStatus] = (result[item.submissionStatus] ?? 0) + 1;
      return result;
    }, {}) ?? {};

    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          label: { formatter: '{b}\n{c}项' },
          data: Object.entries(distribution).map(([key, value]) => ({
            name: submissionStatusTextMap[key as StudentLearningTest['submissionStatus']],
            value,
          })),
        },
      ],
    };
  }, [profile?.tests]);

  if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return <Result status="403" title="仅教师或教务处可查看学生学情信息" />;
  }

  if (!id) {
    return <Empty description="缺少学生标识" />;
  }

  return (
    <div className="student-learning-page">
      {contextHolder}
      <div className="student-learning-header">
        <div>
          <Title level={3} className="student-learning-title">学生学情信息</Title>
          <Text type="secondary">查看学生的课程进度、测试完成情况与最近学习动态。</Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </div>

      <Card loading={loading}>
        {profile ? (
          <div className="student-learning-hero">
            <div className="student-learning-hero-main">
              <Avatar size={72} icon={<UserOutlined />}>
                {profile.student.name.slice(0, 1)}
              </Avatar>
              <div className="student-learning-hero-meta">
                <Space align="center" wrap>
                  <Title level={4} style={{ margin: 0 }}>{profile.student.name}</Title>
                  <Tag color="processing">{profile.student.studentNo}</Tag>
                </Space>
                <Text type="secondary">
                  {profile.student.grade} {profile.student.className}
                  {profile.student.username ? ` · 账号：${profile.student.username}` : ''}
                </Text>
                <div className="student-learning-tag-group">
                  {profile.student.tags.map((tag) => (
                    <Tag key={`${profile.student.id}-${tag}`}>{tag}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {profile ? (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="在修课程" value={profile.overview.totalCourses} prefix={<BookOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="平均进度" value={profile.overview.averageProgress} suffix="%" prefix={<DotChartOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="测试均分" value={profile.overview.averageScore} suffix="分" prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="待处理测试" value={profile.overview.pendingTests} prefix={<TeamOutlined />} />
              </Card>
            </Col>
          </Row>

          <Card>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="学号">{profile.student.studentNo}</Descriptions.Item>
              <Descriptions.Item label="姓名">{profile.student.name}</Descriptions.Item>
              <Descriptions.Item label="年级 / 班级">{profile.student.grade} {profile.student.className}</Descriptions.Item>
              <Descriptions.Item label="账号">{profile.student.username ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="监护人">{profile.student.guardian ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{profile.student.phone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱" span={2}>{profile.student.email ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Row gutter={[12, 12]}>
            <Col xs={24} lg={8}>
              <Card title="课程进度分布" className="student-learning-chart-card">
                {profile.courses.length > 0 ? (
                  <ReactECharts option={progressOption} style={{ height: 280 }} />
                ) : (
                  <Card className="student-learning-empty-card"><Empty description="暂无课程数据" /></Card>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="课程 / 测试趋势" className="student-learning-chart-card">
                {profile.trend.length > 0 ? (
                  <ReactECharts option={trendOption} style={{ height: 280 }} />
                ) : (
                  <Card className="student-learning-empty-card"><Empty description="暂无趋势数据" /></Card>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="测试状态分布" className="student-learning-chart-card">
                {profile.tests.length > 0 ? (
                  <ReactECharts option={statusDistributionOption} style={{ height: 280 }} />
                ) : (
                  <Card className="student-learning-empty-card"><Empty description="暂无测试数据" /></Card>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} lg={14}>
              <Card title="课程学习信息">
                <Table
                  rowKey="courseId"
                  columns={courseColumns}
                  dataSource={profile.courses}
                  pagination={false}
                  locale={{ emptyText: '暂无课程学习记录' }}
                  scroll={{ x: 820 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="学习建议">
                <Timeline
                  items={profile.insights.map((item, index) => ({
                    color: index === 0 ? 'blue' : 'gray',
                    children: item,
                  }))}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} lg={14}>
              <Card title="测试与作答信息">
                <Table
                  rowKey="testId"
                  columns={testColumns}
                  dataSource={profile.tests}
                  pagination={false}
                  locale={{ emptyText: '暂无测试记录' }}
                  scroll={{ x: 900 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="最近学习动态">
                {profile.activities.length > 0 ? (
                  <Timeline
                    items={profile.activities.map((item) => ({
                      color: item.type === 'test' ? 'green' : 'blue',
                      children: (
                        <Space direction="vertical" size={0}>
                          <Text strong>{item.title}</Text>
                          <Text type="secondary">{item.description}</Text>
                          <Text type="secondary">{new Date(item.time).toLocaleString()} · {item.status}</Text>
                        </Space>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="暂无学习动态" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card>
          <Paragraph type="secondary">暂无学情数据。</Paragraph>
        </Card>
      )}
    </div>
  );
};

export default StudentLearningProfilePage;
