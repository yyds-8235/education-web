import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Col, Descriptions, Radio, Row, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getStudentDetailApi, type StudentProfile } from '@/services/student';
import { getMockStudentLearningProfile } from '@/mock/studentAnalytics';
import type { StudentLearningProfile } from '@/types';
import './StudentManagement.css';

const { Title, Text } = Typography;

type ViewMode = 'basic' | 'learning';

// 静态课程数据
const mockCourseData = [
  { courseId: '1', courseName: '高等数学', subject: '数学', teacherName: '张老师', progress: 85, testCount: 5, completedTestCount: 4, averageScore: 88.5, status: 'active' },
  { courseId: '2', courseName: '大学英语', subject: '英语', teacherName: '李老师', progress: 92, testCount: 6, completedTestCount: 6, averageScore: 91.2, status: 'active' },
  { courseId: '3', courseName: '计算机基础', subject: '计算机', teacherName: '王老师', progress: 78, testCount: 4, completedTestCount: 3, averageScore: 82.0, status: 'active' },
  { courseId: '4', courseName: '大学物理', subject: '物理', teacherName: '刘老师', progress: 65, testCount: 5, completedTestCount: 3, averageScore: 75.5, status: 'active' },
  { courseId: '5', courseName: '线性代数', subject: '数学', teacherName: '陈老师', progress: 95, testCount: 4, completedTestCount: 4, averageScore: 93.8, status: 'active' },
];

// 静态测试数据
const mockTestData = [
  { testId: '1', courseName: '高等数学', title: '第一章测试', totalScore: 100, studentScore: 92, submittedAt: '2024-03-01 10:30:00', status: 'graded' },
  { testId: '2', courseName: '高等数学', title: '第二章测试', totalScore: 100, studentScore: 85, submittedAt: '2024-03-05 14:20:00', status: 'graded' },
  { testId: '3', courseName: '大学英语', title: '词汇测试', totalScore: 100, studentScore: 88, submittedAt: '2024-03-02 09:15:00', status: 'graded' },
  { testId: '4', courseName: '大学英语', title: '阅读理解', totalScore: 100, studentScore: 95, submittedAt: '2024-03-06 16:45:00', status: 'graded' },
  { testId: '5', courseName: '计算机基础', title: '编程基础', totalScore: 100, studentScore: 78, submittedAt: '2024-03-03 11:00:00', status: 'graded' },
  { testId: '6', courseName: '大学物理', title: '力学测试', totalScore: 100, studentScore: 72, submittedAt: '2024-03-04 15:30:00', status: 'graded' },
  { testId: '7', courseName: '线性代数', title: '矩阵运算', totalScore: 100, studentScore: 96, submittedAt: '2024-03-07 10:00:00', status: 'graded' },
  { testId: '8', courseName: '高等数学', title: '期中考试', totalScore: 150, studentScore: 128, submittedAt: '2024-03-08 14:00:00', status: 'graded' },
];

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<ViewMode>('basic');
  const [loading, setLoading] = useState(false);
  const [basicInfo, setBasicInfo] = useState<StudentProfile | null>(null);
  const [learningInfo, setLearningInfo] = useState<StudentLearningProfile | null>(null);

  // 课程表格列定义
  const courseColumns: ColumnsType<typeof mockCourseData[0]> = [
    { title: '课程名称', dataIndex: 'courseName', key: 'courseName', width: 150 },
    { title: '学科', dataIndex: 'subject', key: 'subject', width: 100, render: (text) => <Tag color="blue">{text}</Tag> },
    { title: '教师', dataIndex: 'teacherName', key: 'teacherName', width: 100 },
    {
      title: '学习进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (value: number) => (
        <div>
          <div style={{ marginBottom: 4 }}>{value}%</div>
          <div style={{ width: '100%', height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 }}>
            <div style={{ width: `${value}%`, height: '100%', backgroundColor: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f', borderRadius: 3 }} />
          </div>
        </div>
      ),
    },
    {
      title: '测试完成',
      key: 'testCompletion',
      width: 100,
      render: (_, record) => `${record.completedTestCount}/${record.testCount}`,
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      render: (value: number) => (
        <Tag color={value >= 90 ? 'green' : value >= 80 ? 'blue' : value >= 70 ? 'orange' : 'red'}>
          {value.toFixed(1)}分
        </Tag>
      ),
    },
  ];

  // 测试表格列定义
  const testColumns: ColumnsType<typeof mockTestData[0]> = [
    { title: '课程', dataIndex: 'courseName', key: 'courseName', width: 120 },
    { title: '测试名称', dataIndex: 'title', key: 'title', width: 150 },
    {
      title: '成绩',
      key: 'score',
      width: 120,
      render: (_, record) => (
        <Space>
          <Text strong style={{ color: record.studentScore / record.totalScore >= 0.9 ? '#52c41a' : record.studentScore / record.totalScore >= 0.8 ? '#1890ff' : record.studentScore / record.totalScore >= 0.7 ? '#faad14' : '#ff4d4f' }}>
            {record.studentScore}
          </Text>
          <Text type="secondary">/ {record.totalScore}</Text>
        </Space>
      ),
    },
    {
      title: '得分率',
      key: 'rate',
      width: 100,
      render: (_, record) => {
        const rate = ((record.studentScore / record.totalScore) * 100).toFixed(1);
        return <Tag color={Number(rate) >= 90 ? 'green' : Number(rate) >= 80 ? 'blue' : Number(rate) >= 70 ? 'orange' : 'red'}>{rate}%</Tag>;
      },
    },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 160 },
  ];

  // 课程进度图表配置
  const courseProgressOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: mockCourseData.map(c => c.courseName),
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '学习进度',
        type: 'bar',
        data: mockCourseData.map(c => c.progress),
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            return value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f';
          },
          borderRadius: [8, 8, 0, 0],
        },
        label: { show: true, position: 'top', formatter: '{c}%' },
      },
    ],
  };

  // 成绩趋势图表配置
  const scoresTrendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: mockTestData.map((_, idx) => `测试${idx + 1}`),
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        name: '测试成绩',
        type: 'line',
        data: mockTestData.map(t => ((t.studentScore / t.totalScore) * 100).toFixed(1)),
        smooth: true,
        lineStyle: { width: 3, color: '#1890ff' },
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  // 学科成绩分布图表配置
  const subjectScoreOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}分' },
    legend: { bottom: 0 },
    series: [
      {
        name: '学科平均成绩',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: '数学', value: 91.2 },
          { name: '英语', value: 91.2 },
          { name: '计算机', value: 82.0 },
          { name: '物理', value: 75.5 },
        ],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{c}分' },
      },
    ],
  };

  useEffect(() => {
    if (!id) return;
    void loadStudentData();
  }, [id]);

  const loadStudentData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // 加载基本信息
      const basic = await getStudentDetailApi(id);
      setBasicInfo(basic);

      // 加载学情信息
      try {
        const learning = getMockStudentLearningProfile(id);
        setLearningInfo(learning);
      } catch {
        // 如果没有学情数据，不影响基本信息显示
        setLearningInfo(null);
      }
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '加载学生信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!basicInfo) {
    return (
      <Card>
        <Text type="secondary">学生信息不存在</Text>
      </Card>
    );
  }

  return (
    <div className="student-detail-page">
      {contextHolder}

      <div className="student-detail-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>学生详情</Title>
        </Space>
        <Button icon={<EditOutlined />} onClick={() => navigate(`/students/${id}/edit`)}>
          编辑信息
        </Button>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 学生基本信息卡片 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar src={basicInfo.avatar} icon={!basicInfo.avatar && <UserOutlined />} size={80} />
            <div>
              <Title level={4} style={{ margin: 0 }}>{basicInfo.name}</Title>
              <Space size="middle" style={{ marginTop: 8 }}>
                <Text type="secondary">学号：{basicInfo.studentNo}</Text>
                <Text type="secondary">账号：{basicInfo.username}</Text>
                <Text type="secondary">{basicInfo.grade} {basicInfo.class}</Text>
              </Space>
            </div>
          </div>

          {/* 切换器 */}
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="basic">基本信息</Radio.Button>
            <Radio.Button value="learning">学情信息</Radio.Button>
          </Radio.Group>

          {/* 基本信息视图 */}
          {viewMode === 'basic' && (
            <Card title="基本信息" bordered={false}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="学号">{basicInfo.studentNo}</Descriptions.Item>
                <Descriptions.Item label="姓名">{basicInfo.name}</Descriptions.Item>
                <Descriptions.Item label="账号">{basicInfo.username}</Descriptions.Item>
                <Descriptions.Item label="年级/班级">{basicInfo.grade} {basicInfo.class}</Descriptions.Item>
                <Descriptions.Item label="监护人">{basicInfo.guardian}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{basicInfo.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{basicInfo.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="贫困等级">
                  <Tag color="gold">{basicInfo.povertyLevel}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否资助对象">
                  <Tag color={basicInfo.isSponsored ? 'green' : 'default'}>
                    {basicInfo.isSponsored ? '是' : '否'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="户籍类型">{basicInfo.householdType}</Descriptions.Item>
                <Descriptions.Item label="是否留守儿童">
                  <Tag color={basicInfo.isLeftBehind ? 'orange' : 'default'}>
                    {basicInfo.isLeftBehind ? '是' : '否'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否残疾">
                  <Tag color={basicInfo.isDisabled ? 'red' : 'default'}>
                    {basicInfo.isDisabled ? '是' : '否'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否单亲家庭">
                  <Tag color={basicInfo.isSingleParent ? 'purple' : 'default'}>
                    {basicInfo.isSingleParent ? '是' : '否'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否重点关注">
                  <Tag color={basicInfo.isKeyConcern ? 'red' : 'default'}>
                    {basicInfo.isKeyConcern ? '是' : '否'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="查看权限">
                  <Tag color={basicInfo.canView ? 'green' : 'default'}>
                    {basicInfo.canView ? '已开启' : '已关闭'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="编辑权限">
                  <Tag color={basicInfo.canEdit ? 'green' : 'default'}>
                    {basicInfo.canEdit ? '已开启' : '已关闭'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 学情信息视图 */}
          {viewMode === 'learning' && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 学习概况统计 */}
              <Card title="学习概况" bordered={false}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Card>
                      <Statistic title="总课程数" value={5} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="平均进度" value={83} suffix="%" valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="已完成测试" value={8} suffix="/ 10" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="平均成绩" value={86.2} suffix="分" valueStyle={{ color: '#1890ff' }} />
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* 图表展示 */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="课程学习进度" bordered={false}>
                    <ReactECharts option={courseProgressOption} style={{ height: 300 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="学科成绩分布" bordered={false}>
                    <ReactECharts option={subjectScoreOption} style={{ height: 300 }} />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card title="测试成绩趋势" bordered={false}>
                    <ReactECharts option={scoresTrendOption} style={{ height: 300 }} />
                  </Card>
                </Col>
              </Row>

              {/* 课程详细列表 */}
              <Card title="课程详情" bordered={false}>
                <Table
                  columns={courseColumns}
                  dataSource={mockCourseData}
                  rowKey="courseId"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </Card>

              {/* 测试记录列表 */}
              <Card title="测试记录" bordered={false}>
                <Table
                  columns={testColumns}
                  dataSource={mockTestData}
                  rowKey="testId"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 800 }}
                />
              </Card>

              {/* 学习洞察 */}
              <Card title="学习洞察" bordered={false}>
                <Space direction="vertical" size="small">
                  <Text>• 课程进度稳定，线性代数和大学英语表现优秀</Text>
                  <Text>• 大学物理进度较慢，建议加强学习</Text>
                  <Text>• 测试成绩整体呈上升趋势，学习效果良好</Text>
                  <Text>• 数学类科目成绩突出，平均分达到91.2分</Text>
                  <Text>• 建议重点关注物理学科，当前平均分75.5分</Text>
                </Space>
              </Card>
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default StudentDetail;
