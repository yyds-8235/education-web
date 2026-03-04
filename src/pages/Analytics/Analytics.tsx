import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Button, Card, Col, Empty, Row, Select, Space, Statistic, Typography, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, FilterOutlined, PieChartOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import './Analytics.css';

const { Title, Text } = Typography;

type Dimension = 'grade' | 'class' | 'subject' | 'teacher';

const dimensionLabels: Record<Dimension, string> = {
  grade: '年级',
  class: '班级',
  subject: '学科',
  teacher: '教师',
};

const completionDataset = [
  { name: '一年级', value: 92 },
  { name: '二年级', value: 88 },
  { name: '三年级', value: 90 },
];

const attendanceDataset = [
  { name: '一年级', value: 96.4 },
  { name: '二年级', value: 95.2 },
  { name: '三年级', value: 94.5 },
];

const trendDays = ['周一', '周二', '周三', '周四', '周五'];
const completionTrend = [85, 86, 88, 90, 91];
const attendanceTrend = [94, 95, 95.5, 96, 96.2];

const Analytics = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [dimensions, setDimensions] = useState<Dimension[]>(['grade', 'subject']);
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('term');

  const selectedDimensions = useMemo(
    () => dimensions.map((item) => dimensionLabels[item]).join('、') || '默认维度',
    [dimensions]
  );

  const completionOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { bottom: 0 },
      series: [
        {
          name: '课程完成率',
          type: 'pie',
          radius: ['35%', '65%'],
          data: completionDataset,
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
    []
  );

  const attendanceOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: attendanceDataset.map((item) => item.name),
      },
      yAxis: {
        type: 'value',
        min: 90,
        max: 100,
      },
      series: [
        {
          type: 'bar',
          data: attendanceDataset.map((item) => item.value),
          barWidth: 34,
          itemStyle: {
            color: '#2563EB',
            borderRadius: [8, 8, 0, 0],
          },
        },
      ],
    }),
    []
  );

  const trendOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: {
        top: 4,
      },
      xAxis: {
        type: 'category',
        data: trendDays,
      },
      yAxis: {
        type: 'value',
        min: 80,
        max: 100,
      },
      series: [
        {
          name: '课程完成率',
          type: 'line',
          data: completionTrend,
          smooth: true,
          lineStyle: { width: 3, color: '#10B981' },
        },
        {
          name: '考勤合格率',
          type: 'line',
          data: attendanceTrend,
          smooth: true,
          lineStyle: { width: 3, color: '#F59E0B' },
        },
      ],
    }),
    []
  );

  const handleExport = (format: 'excel' | 'pdf') => {
    message.success(`已导出${period === 'week' ? '周' : period === 'month' ? '月' : '学期'}统计报表（${format.toUpperCase()}）`);
  };

  if (user?.role !== 'admin') {
    return <Empty description="仅教务处可查看数据统计分析系统" />;
  }

  return (
    <div className="analytics-page">
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
          <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')}>
            导出 Excel
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')}>
            导出 PDF
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="课程完成率" value={90.1} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="考勤合格率" value={95.3} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="异常考勤率" value={4.7} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="报表维度数" value={dimensions.length} prefix={<FilterOutlined />} />
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
        <Col xs={24} lg={8}>
          <Card title="课程完成率分布" className="analytics-chart-card">
            <ReactECharts option={completionOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="年级考勤合格率" className="analytics-chart-card">
            <ReactECharts option={attendanceOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="教学管理趋势" className="analytics-chart-card">
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
