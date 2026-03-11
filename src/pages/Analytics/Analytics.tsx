import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Button, Card, Col, Empty, Row, Select, Space, Statistic, Typography, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, FilterOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import { exportAnalyticsExcel, exportAnalyticsPdf } from '@/utils/analyticsExport';
import type { AnalyticsExportOptions, AnalyticsGradeRow, AnalyticsTrendRow } from '@/utils/analyticsExport';
import './Analytics.css';

const { Title, Text } = Typography;

type Dimension = 'grade' | 'class' | 'subject' | 'teacher';

const dimensionLabels: Record<Dimension, string> = {
  grade: '年级',
  class: '班级',
  subject: '学科',
  teacher: '教师',
};

// 静态数据：初一到高三共6个年级
const gradeData = [
  { name: '初一', studentCount: 320, courseCompletion: 92, attendance: 96.4, abnormal: 3.6, avgScore: 85.2 },
  { name: '初二', studentCount: 315, courseCompletion: 88, attendance: 95.2, abnormal: 4.8, avgScore: 82.5 },
  { name: '初三', studentCount: 310, courseCompletion: 90, attendance: 94.5, abnormal: 5.5, avgScore: 87.3 },
  { name: '高一', studentCount: 280, courseCompletion: 86, attendance: 93.8, abnormal: 6.2, avgScore: 80.1 },
  { name: '高二', studentCount: 275, courseCompletion: 84, attendance: 92.5, abnormal: 7.5, avgScore: 78.9 },
  { name: '高三', studentCount: 270, courseCompletion: 95, attendance: 97.2, abnormal: 2.8, avgScore: 91.5 },
];

// 按学科统计的数据
const subjectData = [
  { name: '语文', studentCount: 1770, courseCompletion: 89, attendance: 95.1, abnormal: 4.9, avgScore: 84.5 },
  { name: '数学', studentCount: 1770, courseCompletion: 87, attendance: 94.8, abnormal: 5.2, avgScore: 82.3 },
  { name: '英语', studentCount: 1770, courseCompletion: 91, attendance: 95.5, abnormal: 4.5, avgScore: 86.1 },
  { name: '物理', studentCount: 825, courseCompletion: 85, attendance: 93.2, abnormal: 6.8, avgScore: 79.8 },
  { name: '化学', studentCount: 825, courseCompletion: 86, attendance: 93.5, abnormal: 6.5, avgScore: 80.5 },
  { name: '生物', studentCount: 825, courseCompletion: 88, attendance: 94.1, abnormal: 5.9, avgScore: 83.2 },
];

// 按班级统计的数据（示例：每个年级3个班）
const classData = [
  { name: '初一1班', studentCount: 108, courseCompletion: 93, attendance: 97.1, abnormal: 2.9, avgScore: 86.5 },
  { name: '初一2班', studentCount: 106, courseCompletion: 91, attendance: 96.2, abnormal: 3.8, avgScore: 84.8 },
  { name: '初一3班', studentCount: 106, courseCompletion: 92, attendance: 95.9, abnormal: 4.1, avgScore: 84.3 },
  { name: '初二1班', studentCount: 105, courseCompletion: 89, attendance: 95.8, abnormal: 4.2, avgScore: 83.2 },
  { name: '初二2班', studentCount: 105, courseCompletion: 87, attendance: 94.9, abnormal: 5.1, avgScore: 82.1 },
  { name: '初二3班', studentCount: 105, courseCompletion: 88, attendance: 94.9, abnormal: 5.1, avgScore: 82.2 },
];

// 按教师统计的数据
const teacherData = [
  { name: '张老师', studentCount: 210, courseCompletion: 92, attendance: 96.5, abnormal: 3.5, avgScore: 87.2 },
  { name: '李老师', studentCount: 205, courseCompletion: 89, attendance: 95.3, abnormal: 4.7, avgScore: 84.5 },
  { name: '王老师', studentCount: 198, courseCompletion: 91, attendance: 96.1, abnormal: 3.9, avgScore: 86.3 },
  { name: '刘老师', studentCount: 195, courseCompletion: 87, attendance: 94.2, abnormal: 5.8, avgScore: 82.8 },
  { name: '陈老师', studentCount: 188, courseCompletion: 88, attendance: 94.8, abnormal: 5.2, avgScore: 83.6 },
  { name: '赵老师', studentCount: 180, courseCompletion: 90, attendance: 95.6, abnormal: 4.4, avgScore: 85.1 },
];

// 趋势数据：根据不同周期
const trendDataByPeriod = {
  week: {
    labels: ['周一', '周二', '周三', '周四', '周五'],
    completion: [85, 86, 88, 90, 91],
    attendance: [94, 95, 95.5, 96, 96.2],
    score: [82.5, 83.2, 84.1, 85.0, 85.8],
  },
  month: {
    labels: ['第1周', '第2周', '第3周', '第4周'],
    completion: [83, 86, 89, 91],
    attendance: [93.5, 94.8, 95.5, 96.2],
    score: [81.2, 83.5, 84.8, 85.8],
  },
  term: {
    labels: ['9月', '10月', '11月', '12月', '1月'],
    completion: [78, 82, 86, 89, 91],
    attendance: [92, 93.5, 94.5, 95.5, 96.2],
    score: [78.5, 81.2, 83.5, 84.8, 85.8],
  },
};

const Analytics = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [dimensions, setDimensions] = useState<Dimension[]>(['grade', 'subject']);
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('term');
  const [exporting, setExporting] = useState(false);

  const selectedDimensions = useMemo(
    () => dimensions.map((item) => dimensionLabels[item]).join('、') || '默认维度',
    [dimensions]
  );

  // 根据选择的维度获取对应的数据
  const currentData = useMemo(() => {
    // 如果选择了多个维度，优先使用第一个
    const primaryDimension = dimensions[0] || 'grade';

    switch (primaryDimension) {
      case 'grade':
        return gradeData;
      case 'subject':
        return subjectData;
      case 'class':
        return classData;
      case 'teacher':
        return teacherData;
      default:
        return gradeData;
    }
  }, [dimensions]);

  // 根据周期获取趋势数据
  const trendData = useMemo(() => trendDataByPeriod[period], [period]);

  // 计算汇总数据
  const summaryData = useMemo(() => {
    const totalStudents = currentData.reduce((sum, g) => sum + g.studentCount, 0);
    const avgCompletion = currentData.reduce((sum, g) => sum + g.courseCompletion * g.studentCount, 0) / totalStudents;
    const avgAttendance = currentData.reduce((sum, g) => sum + g.attendance * g.studentCount, 0) / totalStudents;
    const avgAbnormal = currentData.reduce((sum, g) => sum + g.abnormal * g.studentCount, 0) / totalStudents;

    return {
      courseCompletion: Number(avgCompletion.toFixed(1)),
      attendance: Number(avgAttendance.toFixed(1)),
      abnormal: Number(avgAbnormal.toFixed(1)),
    };
  }, [currentData]);

  const completionOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: '课程完成率',
          type: 'pie',
          radius: ['35%', '65%'],
          data: currentData.map(g => ({ name: g.name, value: g.courseCompletion })),
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            formatter: '{b}\n{c}%',
          },
        },
      ],
    }),
    [currentData]
  );

  const attendanceOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: currentData.map(g => g.name),
        axisLabel: {
          interval: 0,
          rotate: currentData.length > 6 ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value',
        min: 85,
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      series: [
        {
          name: '考勤合格率',
          type: 'bar',
          data: currentData.map(g => g.attendance),
          barWidth: 28,
          itemStyle: {
            color: '#2563EB',
            borderRadius: [8, 8, 0, 0],
          },
        },
      ],
    }),
    [currentData]
  );

  const trendOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: {
        top: 4,
      },
      xAxis: {
        type: 'category',
        data: trendData.labels,
      },
      yAxis: {
        type: 'value',
        min: 75,
        max: 100,
      },
      series: [
        {
          name: '课程完成率',
          type: 'line',
          data: trendData.completion,
          smooth: true,
          lineStyle: { width: 3, color: '#10B981' },
          itemStyle: { color: '#10B981' },
        },
        {
          name: '考勤合格率',
          type: 'line',
          data: trendData.attendance,
          smooth: true,
          lineStyle: { width: 3, color: '#F59E0B' },
          itemStyle: { color: '#F59E0B' },
        },
        {
          name: '平均成绩',
          type: 'line',
          data: trendData.score,
          smooth: true,
          lineStyle: { width: 3, color: '#8B5CF6' },
          itemStyle: { color: '#8B5CF6' },
        },
      ],
    }),
    [trendData]
  );

  const scoreOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: currentData.map(g => g.name),
        axisLabel: {
          interval: 0,
          rotate: currentData.length > 6 ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value',
        min: 70,
        max: 95,
        axisLabel: { formatter: '{value}分' },
      },
      series: [
        {
          name: '平均成绩',
          type: 'line',
          data: currentData.map(g => g.avgScore),
          smooth: true,
          lineStyle: { width: 3, color: '#8B5CF6' },
          itemStyle: { color: '#8B5CF6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' },
              ],
            },
          },
        },
      ],
    }),
    [currentData]
  );

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const periodLabels = { week: '本周', month: '本月', term: '本学期' };

      const exportData: AnalyticsExportOptions = {
        periodLabel: periodLabels[period],
        dimensionLabel: selectedDimensions,
        summary: {
          courseCompletionRate: summaryData.courseCompletion,
          attendanceRate: summaryData.attendance,
          abnormalAttendanceRate: summaryData.abnormal,
          dimensionCount: dimensions.length,
        },
        grades: currentData.map((g): AnalyticsGradeRow => ({
          grade: g.name,
          studentCount: g.studentCount,
          courseCompletionRate: g.courseCompletion,
          attendanceRate: g.attendance,
          abnormalAttendanceRate: g.abnormal,
          averageScore: g.avgScore,
        })),
        trends: trendData.labels.map((label, idx): AnalyticsTrendRow => ({
          label,
          courseCompletionRate: trendData.completion[idx],
          attendanceRate: trendData.attendance[idx],
          averageScore: trendData.score[idx],
        })),
      };

      if (format === 'excel') {
        const filename = exportAnalyticsExcel(exportData);
        messageApi.success(`已导出 Excel 报表：${filename}`);
      } else {
        const filename = await exportAnalyticsPdf(exportData);
        messageApi.success(`已导出 PDF 报表：${filename}`);
      }
    } catch (error) {
      messageApi.error(`导出失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    messageApi.info('数据已刷新');
  };

  // 根据维度生成图表标题
  const chartTitles = useMemo(() => {
    const primaryDimension = dimensions[0] || 'grade';
    const dimensionName = dimensionLabels[primaryDimension];

    return {
      completion: `${dimensionName}课程完成率分布`,
      attendance: `${dimensionName}考勤合格率`,
      score: `${dimensionName}平均成绩`,
      trend: period === 'week' ? '教学管理趋势（本周）' : period === 'month' ? '教学管理趋势（本月）' : '教学管理趋势（本学期）',
    };
  }, [dimensions, period]);

  if (user?.role !== 'admin') {
    return <Empty description="仅教务处可查看数据统计分析系统" />;
  }

  return (
    <div className="analytics-page">
      {contextHolder}
      <div className="analytics-header">
        <div>
          <Title level={3} className="analytics-title">
            数据统计分析系统
          </Title>
          <Text type="secondary">
            基于教学管理数据生成多维报表，支持自定义统计维度、可视化展示与 Excel/PDF 导出。
          </Text>
        </div>
        <Space wrap>
          <Select
            mode="multiple"
            value={dimensions}
            onChange={(value) => setDimensions(value as Dimension[])}
            options={Object.entries(dimensionLabels).map(([value, label]) => ({ value, label }))}
            style={{ width: 280 }}
            maxTagCount={2}
            placeholder="自定义统计维度"
          />
          <Select
            value={period}
            onChange={setPeriod}
            options={[
              { label: '本周', value: 'week' },
              { label: '本月', value: 'month' },
              { label: '本学期', value: 'term' },
            ]}
            style={{ width: 110 }}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
            loading={exporting}
          >
            导出 Excel
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleExport('pdf')}
            loading={exporting}
          >
            导出 PDF
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="课程完成率"
              value={summaryData.courseCompletion}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="考勤合格率"
              value={summaryData.attendance}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#2563EB' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="异常考勤率"
              value={summaryData.abnormal}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#EF4444' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="报表维度数"
              value={dimensions.length}
              prefix={<FilterOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="analytics-dimension-card">
        <Space>
          <PieChartOutlined />
          <span>当前统计维度：{selectedDimensions}</span>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card title={chartTitles.completion} className="analytics-chart-card">
            <ReactECharts option={completionOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={chartTitles.attendance} className="analytics-chart-card">
            <ReactECharts option={attendanceOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card title={chartTitles.score} className="analytics-chart-card">
            <ReactECharts option={scoreOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={chartTitles.trend} className="analytics-chart-card">
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
