import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Radio,
  Result,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getStudentDetailApi, type StudentProfile } from '@/services/student';
import './StudentManagement.css';

const { Paragraph, Text, Title } = Typography;

type ViewMode = 'basic' | 'learning';

type CourseRecord = {
  courseId: string;
  courseName: string;
  subject: string;
  teacherName: string;
  progress: number;
  testCount: number;
  completedTestCount: number;
  averageScore: number;
  status: 'active' | 'paused';
};

type TestRecord = {
  testId: string;
  courseName: string;
  title: string;
  totalScore: number;
  studentScore: number;
  submittedAt: string;
};

const mockCourseData: CourseRecord[] = [
  { courseId: '1', courseName: '初二语文基础', subject: '语文', teacherName: '张老师', progress: 98.5, testCount: 5, completedTestCount: 5, averageScore: 92.5, status: 'active' },
  { courseId: '2', courseName: '初二数学进阶', subject: '数学', teacherName: '李老师', progress: 99.0, testCount: 6, completedTestCount: 6, averageScore: 93.2, status: 'active' },
  { courseId: '3', courseName: '初二英语冲刺', subject: '英语', teacherName: '王老师', progress: 98.2, testCount: 4, completedTestCount: 4, averageScore: 91.8, status: 'active' },
  { courseId: '4', courseName: '初二物理入门', subject: '物理', teacherName: '刘老师', progress: 98.8, testCount: 5, completedTestCount: 5, averageScore: 92.0, status: 'active' },
];

const mockTestData: TestRecord[] = [
  { testId: '1', courseName: '初二语文基础', title: '现代文阅读测验', totalScore: 100, studentScore: 93, submittedAt: '2026-03-01 10:30:00' },
  { testId: '2', courseName: '初二数学进阶', title: '一次函数单元测试', totalScore: 100, studentScore: 96, submittedAt: '2026-03-02 16:45:00' },
  { testId: '3', courseName: '初二英语冲刺', title: '时态专项练习', totalScore: 100, studentScore: 91, submittedAt: '2026-03-03 11:00:00' },
  { testId: '4', courseName: '初二物理入门', title: '力学基础测试', totalScore: 100, studentScore: 92, submittedAt: '2026-03-04 15:30:00' },
];

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<ViewMode>('basic');
  const [loading, setLoading] = useState(false);
  const [basicInfo, setBasicInfo] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadStudentData = async () => {
      setLoading(true);
      try {
        const basic = await getStudentDetailApi(id);
        setBasicInfo(basic);
      } catch (error) {
        const err = error as Error;
        messageApi.error(err.message || '加载学生信息失败');
        setBasicInfo(null);
      } finally {
        setLoading(false);
      }
    };

    void loadStudentData();
  }, [id, messageApi]);

  const overview = useMemo(() => {
    const totalCourses = mockCourseData.length;
    const averageProgress = totalCourses
      ? Number((mockCourseData.reduce((sum, item) => sum + item.progress, 0) / totalCourses).toFixed(1))
      : 0;
    const totalTests = mockCourseData.reduce((sum, item) => sum + item.testCount, 0);
    const completedTests = mockCourseData.reduce((sum, item) => sum + item.completedTestCount, 0);
    const averageScore = totalCourses
      ? Number((mockCourseData.reduce((sum, item) => sum + item.averageScore, 0) / totalCourses).toFixed(1))
      : 0;

    return {
      totalCourses,
      averageProgress,
      totalTests,
      completedTests,
      averageScore,
    };
  }, []);

  const courseColumns: ColumnsType<CourseRecord> = [
    { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
    { title: '学科', dataIndex: 'subject', key: 'subject', render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '学习进度', dataIndex: 'progress', key: 'progress', render: (value: number) => `${value}%` },
    { title: '测验完成', key: 'tests', render: (_, record) => `${record.completedTestCount}/${record.testCount}` },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (value: number) => <Tag color={value >= 90 ? 'green' : value >= 80 ? 'blue' : value >= 70 ? 'orange' : 'red'}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: CourseRecord['status']) => <Tag color={value === 'active' ? 'green' : 'default'}>{value === 'active' ? '进行中' : '已暂停'}</Tag>,
    },
  ];

  const testColumns: ColumnsType<TestRecord> = [
    { title: '课程', dataIndex: 'courseName', key: 'courseName' },
    { title: '测验名称', dataIndex: 'title', key: 'title' },
    {
      title: '成绩',
      key: 'score',
      render: (_, record) => `${record.studentScore} / ${record.totalScore}`,
    },
    {
      title: '得分率',
      key: 'rate',
      render: (_, record) => {
        const rate = Number(((record.studentScore / record.totalScore) * 100).toFixed(1));
        return <Tag color={rate >= 90 ? 'green' : rate >= 80 ? 'blue' : rate >= 70 ? 'orange' : 'red'}>{rate}%</Tag>;
      },
    },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
  ];

  const courseProgressOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: mockCourseData.map((item) => item.courseName),
        axisLabel: { interval: 0, rotate: 20 },
      },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        {
          name: '学习进度',
          type: 'bar',
          data: mockCourseData.map((item) => item.progress),
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: '#1677ff',
          },
        },
      ],
    }),
    [],
  );

  const scoreTrendOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: mockTestData.map((item) => item.title),
        axisLabel: { interval: 0, rotate: 20 },
      },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [
        {
          name: '得分率',
          type: 'line',
          smooth: true,
          data: mockTestData.map((item) => Number(((item.studentScore / item.totalScore) * 100).toFixed(1))),
          itemStyle: { color: '#52c41a' },
          lineStyle: { color: '#52c41a', width: 3 },
        },
      ],
    }),
    [],
  );

  if (loading) {
    return (
      <div className="student-page">
        {contextHolder}
        <Card>
          <Spin />
        </Card>
      </div>
    );
  }

  if (!id || !basicInfo) {
    return (
      <div className="student-page">
        {contextHolder}
        <Result status="404" title="学生信息不存在" />
      </div>
    );
  }

  return (
    <div className="student-page">
      {contextHolder}

      <div className="student-page-header">
        <div>
          <Title level={3}>学生详情</Title>
          <Paragraph type="secondary">详情页样式与教师端保持一致，基础资料与学情信息分区展示。</Paragraph>
        </div>

        <div className="student-page-actions">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
            返回列表
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/students/${id}/edit`)}>
            编辑
          </Button>
        </div>
      </div>

      <Card>
        <div className="student-detail-hero">
          <Avatar size={72} src={basicInfo.avatar || undefined} icon={!basicInfo.avatar && <UserOutlined />}>
            {!basicInfo.avatar ? basicInfo.name.slice(0, 1) : null}
          </Avatar>
          <div className="student-detail-meta">
            <Text strong>{basicInfo.name}</Text>
            <Text type="secondary">账号：{basicInfo.username}</Text>
            <Space>
              <Tag>{basicInfo.studentNo}</Tag>
              <Tag color="blue">{basicInfo.grade} {basicInfo.class}</Tag>
              <Tag color={basicInfo.canEdit ? 'green' : 'default'}>{basicInfo.canEdit ? '可编辑' : '只读'}</Tag>
            </Space>
          </div>
        </div>
      </Card>

      <Card>
        <Radio.Group value={viewMode} onChange={(event) => setViewMode(event.target.value)} buttonStyle="solid">
          <Radio.Button value="basic">基本信息</Radio.Button>
          <Radio.Button value="learning">学情信息</Radio.Button>
        </Radio.Group>
      </Card>

      {viewMode === 'basic' ? (
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="账号">{basicInfo.username}</Descriptions.Item>
            <Descriptions.Item label="学号">{basicInfo.studentNo}</Descriptions.Item>
            <Descriptions.Item label="姓名">{basicInfo.name}</Descriptions.Item>
            <Descriptions.Item label="年级 / 班级">{basicInfo.grade} {basicInfo.class}</Descriptions.Item>
            <Descriptions.Item label="监护人">{basicInfo.guardian || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{basicInfo.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{basicInfo.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="贫困等级"><Tag color="gold">{basicInfo.povertyLevel}</Tag></Descriptions.Item>
            <Descriptions.Item label="是否资助对象"><Tag color={basicInfo.isSponsored ? 'green' : 'default'}>{basicInfo.isSponsored ? '是' : '否'}</Tag></Descriptions.Item>
            <Descriptions.Item label="户籍类型">{basicInfo.householdType}</Descriptions.Item>
            <Descriptions.Item label="是否留守儿童"><Tag color={basicInfo.isLeftBehind ? 'orange' : 'default'}>{basicInfo.isLeftBehind ? '是' : '否'}</Tag></Descriptions.Item>
            <Descriptions.Item label="是否残疾"><Tag color={basicInfo.isDisabled ? 'red' : 'default'}>{basicInfo.isDisabled ? '是' : '否'}</Tag></Descriptions.Item>
            <Descriptions.Item label="是否单亲家庭"><Tag color={basicInfo.isSingleParent ? 'purple' : 'default'}>{basicInfo.isSingleParent ? '是' : '否'}</Tag></Descriptions.Item>
            <Descriptions.Item label="是否重点关注"><Tag color={basicInfo.isKeyConcern ? 'red' : 'default'}>{basicInfo.isKeyConcern ? '是' : '否'}</Tag></Descriptions.Item>
            <Descriptions.Item label="查看权限"><Tag color={basicInfo.canView ? 'green' : 'default'}>{basicInfo.canView ? '已开启' : '已关闭'}</Tag></Descriptions.Item>
            <Descriptions.Item label="编辑权限"><Tag color={basicInfo.canEdit ? 'green' : 'default'}>{basicInfo.canEdit ? '已开启' : '已关闭'}</Tag></Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card><Statistic title="在修课程" value={overview.totalCourses} /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card><Statistic title="平均进度" value={overview.averageProgress} suffix="%" /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card><Statistic title="已完成测验" value={overview.completedTests} suffix={`/ ${overview.totalTests}`} /></Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card><Statistic title="平均成绩" value={overview.averageScore} suffix="分" /></Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="课程学习进度">
                <ReactECharts option={courseProgressOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="测验得分趋势">
                <ReactECharts option={scoreTrendOption} style={{ height: 320 }} />
              </Card>
            </Col>
          </Row>

          <Card title="课程详情">
            <Table columns={courseColumns} dataSource={mockCourseData} rowKey="courseId" pagination={false} scroll={{ x: 800 }} />
          </Card>

          <Card title="测验记录">
            <Table columns={testColumns} dataSource={mockTestData} rowKey="testId" pagination={false} scroll={{ x: 800 }} />
          </Card>
        </Space>
      )}
    </div>
  );
};

export default StudentDetail;
