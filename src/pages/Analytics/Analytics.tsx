import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Row, Col, Card, Statistic } from 'antd';
import {
    UserOutlined,
    BookOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import './Analytics.css';

const Analytics: React.FC = () => {
    const courseCompletionOption = {
        title: {
            text: '课程完成率',
            left: 'center',
        },
        tooltip: {
            trigger: 'item',
        },
        legend: {
            orient: 'vertical',
            left: 'left',
        },
        series: [
            {
                name: '完成率',
                type: 'pie',
                radius: '50%',
                data: [
                    { value: 1048, name: '已完成' },
                    { value: 735, name: '进行中' },
                    { value: 580, name: '未开始' },
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
            },
        ],
    };

    const attendanceTrendOption = {
        title: {
            text: '考勤趋势',
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五'],
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                name: '出勤人数',
                type: 'line',
                smooth: true,
                data: [120, 132, 101, 134, 90],
                itemStyle: {
                    color: '#2563EB',
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
                            { offset: 1, color: 'rgba(37, 99, 235, 0.05)' },
                        ],
                    },
                },
            },
        ],
    };

    const testScoreDistributionOption = {
        title: {
            text: '测试成绩分布',
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            type: 'category',
            data: ['0-60', '60-70', '70-80', '80-90', '90-100'],
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                name: '人数',
                type: 'bar',
                data: [10, 20, 45, 80, 35],
                itemStyle: {
                    color: '#06B6D4',
                },
            },
        ],
    };

    return (
        <div className="analytics-page">
            <div className="page-header">
                <h1 className="page-title">数据分析</h1>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="学生总数"
                            value={1128}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#2563EB' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="课程总数"
                            value={93}
                            prefix={<BookOutlined />}
                            valueStyle={{ color: '#06B6D4' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="平均出勤率"
                            value={95.2}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#10B981' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="平均测试通过率"
                            value={87.5}
                            suffix="%"
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#F59E0B' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} className="charts-row">
                <Col xs={24} lg={12}>
                    <Card className="chart-card">
                        <ReactECharts option={courseCompletionOption} style={{ height: 300 }} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card className="chart-card">
                        <ReactECharts option={attendanceTrendOption} style={{ height: 300 }} />
                    </Card>
                </Col>
                <Col xs={24}>
                    <Card className="chart-card">
                        <ReactECharts option={testScoreDistributionOption} style={{ height: 300 }} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Analytics;
