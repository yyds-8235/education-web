import { useMemo, useState } from 'react';
import { Button, Card, Col, Empty, List, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { CloudSyncOutlined, FileExcelOutlined, FilePdfOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AttendanceTable } from '@/components/Organisms';
import { useAppSelector } from '@/store/hooks';
import type { AttendanceRecord, AttendanceType } from '@/types';
import './Attendance.css';

const { Title, Text } = Typography;

const attendanceSeed: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'student-1',
    studentName: '王同学',
    studentNo: 'S2026001',
    grade: '一年级',
    class: '1班',
    date: '2026-03-01',
    type: 'present',
    checkInTime: '07:56',
    checkOutTime: '16:35',
    isException: false,
    createdAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'att-2',
    studentId: 'student-2',
    studentName: '陈同学',
    studentNo: 'S2026002',
    grade: '一年级',
    class: '1班',
    date: '2026-03-01',
    type: 'late',
    checkInTime: '08:20',
    checkOutTime: '16:35',
    isException: false,
    createdAt: '2026-03-01T08:20:00.000Z',
  },
  {
    id: 'att-3',
    studentId: 'student-3',
    studentName: '赵同学',
    studentNo: 'S2026003',
    grade: '一年级',
    class: '2班',
    date: '2026-03-01',
    type: 'absent',
    isException: true,
    exceptionNote: '家长请假未及时补录',
    createdAt: '2026-03-01T08:30:00.000Z',
  },
  {
    id: 'att-4',
    studentId: 'student-4',
    studentName: '周同学',
    studentNo: 'S2026004',
    grade: '二年级',
    class: '1班',
    date: '2026-03-01',
    type: 'early_leave',
    checkInTime: '07:55',
    checkOutTime: '15:10',
    isException: false,
    createdAt: '2026-03-01T07:55:00.000Z',
  },
  {
    id: 'att-5',
    studentId: 'student-5',
    studentName: '李同学',
    studentNo: 'S2026005',
    grade: '二年级',
    class: '2班',
    date: '2026-03-01',
    type: 'leave',
    isException: false,
    createdAt: '2026-03-01T08:10:00.000Z',
  },
];

type ReportType = 'personal' | 'class' | 'grade';
type ExportFormat = 'excel' | 'pdf';

const labels: Record<AttendanceType, string> = {
  present: '出勤',
  late: '迟到',
  early_leave: '早退',
  absent: '旷课',
  leave: '请假',
};

const Attendance = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [records, setRecords] = useState<AttendanceRecord[]>(attendanceSeed);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    '2026-03-01 07:50 已完成考勤机批次同步（设备：A楼-01，B楼-03）',
  ]);
  const [traceLogs, setTraceLogs] = useState<string[]>([
    '2026-03-01 09:30 标注异常：赵同学（旷课）- 家长请假未及时补录',
  ]);
  const [reportType, setReportType] = useState<ReportType>('class');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');

  const stats = useMemo(() => {
    const total = records.length;
    const lateCount = records.filter((item) => item.type === 'late').length;
    const absentCount = records.filter((item) => item.type === 'absent').length;
    const exceptionCount = records.filter((item) => item.isException).length;
    const attendanceRate = total === 0 ? 0 : ((total - absentCount) / total) * 100;
    return {
      total,
      lateCount,
      absentCount,
      exceptionCount,
      attendanceRate: Number(attendanceRate.toFixed(1)),
    };
  }, [records]);

  const classReport = useMemo(() => {
    const map = new Map<string, { total: number; late: number; absent: number; leave: number }>();
    records.forEach((item) => {
      const key = `${item.grade}${item.class}`;
      const current = map.get(key) ?? { total: 0, late: 0, absent: 0, leave: 0 };
      current.total += 1;
      if (item.type === 'late') {
        current.late += 1;
      }
      if (item.type === 'absent') {
        current.absent += 1;
      }
      if (item.type === 'leave') {
        current.leave += 1;
      }
      map.set(key, current);
    });
    return [...map.entries()].map(([key, value]) => ({ key, ...value }));
  }, [records]);

  const handleSyncMachineData = () => {
    const candidate: AttendanceRecord = {
      id: `att-${Date.now()}`,
      studentId: 'student-auto',
      studentName: '自动采集学生',
      studentNo: `S${String(Date.now()).slice(-6)}`,
      grade: '三年级',
      class: '1班',
      date: dayjs().format('YYYY-MM-DD'),
      type: 'present',
      checkInTime: dayjs().format('HH:mm'),
      checkOutTime: '16:40',
      isException: false,
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => [candidate, ...prev]);
    setSyncLogs((prev) => [
      `${dayjs().format('YYYY-MM-DD HH:mm')} 已同步考勤机数据（新增 1 条）`,
      ...prev,
    ]);
    messageApi.success('考勤机数据同步成功');
  };

  const handleExport = (params: { startDate: string; endDate: string; type?: AttendanceType }) => {
    const typeLabel = params.type ? labels[params.type] : '全部类型';
    messageApi.success(
      `已导出${reportType === 'personal' ? '个人' : reportType === 'class' ? '班级' : '年级'}考勤报表（${typeLabel}，${exportFormat.toUpperCase()}）`
    );
  };

  const handleMarkException = (recordId: string, note: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              isException: true,
              exceptionNote: note,
            }
          : item
      )
    );

    const current = records.find((item) => item.id === recordId);
    if (current) {
      setTraceLogs((prev) => [
        `${dayjs().format('YYYY-MM-DD HH:mm')} 标注异常：${current.studentName}（${labels[current.type]}）- ${note}`,
        ...prev,
      ]);
    }
  };

  if (user?.role !== 'admin') {
    return <Empty description="仅教务处可查看考勤管理系统" />;
  }

  return (
    <div className="attendance-page">
      {contextHolder}
      <div className="attendance-header">
        <div>
          <Title level={3} className="attendance-title">
            考勤管理系统
          </Title>
          <Text type="secondary">
            支持考勤机数据同步、迟到/早退/旷课/请假分类统计、异常标注追溯与报表导出。
          </Text>
        </div>
        <Space>
          <Button icon={<CloudSyncOutlined />} onClick={handleSyncMachineData}>
            同步考勤机数据
          </Button>
          <Select<ReportType>
            value={reportType}
            onChange={setReportType}
            options={[
              { value: 'personal', label: '个人报表' },
              { value: 'class', label: '班级报表' },
              { value: 'grade', label: '年级报表' },
            ]}
            style={{ width: 130 }}
          />
          <Select<ExportFormat>
            value={exportFormat}
            onChange={setExportFormat}
            options={[
              { value: 'excel', label: 'Excel' },
              { value: 'pdf', label: 'PDF' },
            ]}
            style={{ width: 110 }}
          />
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="考勤记录数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="迟到人次" value={stats.lateCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="旷课人次" value={stats.absentCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="考勤合格率" value={stats.attendanceRate} suffix="%" />
          </Card>
        </Col>
      </Row>

      <AttendanceTable data={records} onExport={handleExport} onMarkException={handleMarkException} />

      <div className="attendance-grid">
        <Card title="班级考勤汇总" className="attendance-log-card">
          <List
            dataSource={classReport}
            renderItem={(item) => (
              <List.Item>
                <Space split={<span>|</span>}>
                  <strong>{item.key}</strong>
                  <span>总记录 {item.total}</span>
                  <Tag color="orange">迟到 {item.late}</Tag>
                  <Tag color="red">旷课 {item.absent}</Tag>
                  <Tag color="blue">请假 {item.leave}</Tag>
                </Space>
              </List.Item>
            )}
          />
        </Card>
        <Card title="考勤异常追溯" className="attendance-log-card" extra={<WarningOutlined />}>
          <List
            dataSource={traceLogs}
            locale={{ emptyText: '暂无异常记录' }}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Card>
        <Card
          title="数据同步日志"
          className="attendance-log-card"
          extra={exportFormat === 'excel' ? <FileExcelOutlined /> : <FilePdfOutlined />}
        >
          <List
            dataSource={syncLogs}
            locale={{ emptyText: '暂无同步记录' }}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
