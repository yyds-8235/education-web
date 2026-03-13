﻿﻿﻿import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Empty,
    List,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Statistic,
    Tag,
    Typography,
    message,
} from 'antd';
import { CloudSyncOutlined, FileExcelOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AttendanceTable } from '@/components/Organisms';
import { useAppSelector } from '@/store/hooks';
import type { AttendanceRecord, AttendanceType } from '@/types';
import {
    exportAttendanceExcel,
    exportAttendancePdf,
    filterAttendanceRecords,
    type AttendanceExportFilters,
    type AttendanceReportType,
} from '@/utils/attendanceExport';
import './Attendance.css';

const { Title, Text } = Typography;

type ExportFormat = 'excel' | 'pdf';

const labels: Record<AttendanceType, string> = {
    present: '出勤',
    late: '迟到',
    early_leave: '早退',
    absent: '旷课',
    leave: '请假',
};

const gradePool = ['初一', '初二', '初三', '高一', '高二','高三'];
const classPool = ['1班', '2班', '3班', '4班'];
const studentNamePool = [
    '王晨曦',
    '陈雨桐',
    '赵嘉宁',
    '周子轩',
    '李思远',
    '刘若溪',
    '吴浩然',
    '郑雅雯',
    '孙启航',
    '徐梦瑶',
    '朱梓涵',
    '胡宇辰',
    '林可欣',
    '高梓铭',
    '何书瑶',
    '郭嘉豪',
    '马依诺',
    '罗俊熙',
    '梁语桐',
    '谢承泽',
    '孙雨晴',
    '李明轩',
    '王芳菲',
    '张伟军',
    '刘思语',
    '周浩宇',
    '黄雨欣',
    '吴静雨',
    '郑军浩',
    '何燕萍',
    '曾超群',
    '罗雨晗',
    '曾敏俊',
];

const totalAttendanceRecords = studentNamePool.length * 2;
const maxSpecialCountPerType = Math.floor(totalAttendanceRecords * 0.03);
const specialAttendanceTypes: AttendanceType[] = ['late', 'early_leave', 'absent', 'leave'];
const specialAttendanceTypeMap = new Map<number, AttendanceType>(
    specialAttendanceTypes.flatMap((type, typeIndex) => {
        if (maxSpecialCountPerType <= 0) {
            return [];
        }

        return Array.from({ length: maxSpecialCountPerType }, (_, occurrenceIndex) => {
            const slot = typeIndex * (maxSpecialCountPerType + 1) + occurrenceIndex + 1;
            return [slot, type] as const;
        });
    }),
);

const exceptionNotes: Partial<Record<AttendanceType, string>> = {
    absent: '未到校且未提前请假',
    leave: '病假',
};

const buildAttendanceRecord = (studentIndex: number, recordIndex: number): AttendanceRecord => {
    const studentName = studentNamePool[studentIndex];
    let grade: string;
    let className: string;
    
    if (studentIndex >= 20) {
        grade = '初二';
        className = '2班';
    } else {
        grade = gradePool[studentIndex % gradePool.length];
        className = classPool[Math.floor(studentIndex / gradePool.length) % classPool.length];
    }
    
    const sequence = studentIndex * 2 + recordIndex;
    let type: AttendanceType = 'present';
    
    const juniorTwoClassTwoNonPresent: { name: string; status: AttendanceType }[] = [
        { name: '孙雨晴', status: 'late' },
        { name: '李明轩', status: 'early_leave' },
        { name: '王芳菲', status: 'absent' },
        { name: '张伟军', status: 'leave' },
        { name: '刘思语', status: 'late' },
    ];
    
    const isJuniorTwoClassTwo = grade === '初二' && className === '2班';
    const nonPresentStudent = juniorTwoClassTwoNonPresent.find(s => s.name === studentName);
    
    if (isJuniorTwoClassTwo && recordIndex === 1 && nonPresentStudent) {
        type = nonPresentStudent.status;
    } else if (specialAttendanceTypeMap.has(sequence)) {
        type = specialAttendanceTypeMap.get(sequence) ?? 'present';
    }
    
    const date = dayjs('2026-03-01').add(recordIndex, 'day');
    const studentId = `student-${studentIndex + 1}`;

    const record: AttendanceRecord = {
        id: `att-${sequence + 1}`,
        studentId,
        studentName,
        studentNo: `S2026${String(studentIndex + 1).padStart(4, '0')}`,
        grade,
        class: className,
        date: date.format('YYYY-MM-DD'),
        type,
        isException: type === 'absent',
        createdAt: date.hour(8).minute(recordIndex === 0 ? 0 : 5).second(0).millisecond(0).toISOString(),
    };

    if (type === 'present') {
        record.checkInTime = recordIndex === 0 ? '07:55' : '07:58';
        record.checkOutTime = '16:40';
    }

    if (type === 'late') {
        record.checkInTime = '08:12';
        record.checkOutTime = '16:40';
    }

    if (type === 'early_leave') {
        record.checkInTime = '07:56';
        record.checkOutTime = '15:18';
    }

    if (type === 'absent' || type === 'leave') {
        record.exceptionNote = exceptionNotes[type];
    }

    return record;
};

const attendanceSeed: AttendanceRecord[] = studentNamePool.flatMap((_, studentIndex) =>
    [0, 1].map((recordIndex) => buildAttendanceRecord(studentIndex, recordIndex)),
);

const Attendance = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [messageApi, contextHolder] = message.useMessage();
    const [records, setRecords] = useState<AttendanceRecord[]>(attendanceSeed);
    const [syncLogs, setSyncLogs] = useState<string[]>([
        '2026-03-01 07:50 已完成考勤机批量同步（设备：A楼101、B楼203）',
    ]);
    const [traceLogs, setTraceLogs] = useState<string[]>([
        '2026-03-01 09:30 标注异常：王芳菲（旷课）- 未到校且未提前请假',
        '2026-03-01 09:30 标注异常：李思远（旷课）- 未到校且未提前请假',
    ]);
    const [reportType, setReportType] = useState<AttendanceReportType>('class');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
    const [pendingReportType, setPendingReportType] = useState<AttendanceReportType>('class');
    const [pendingExportFilters, setPendingExportFilters] = useState<AttendanceExportFilters | null>(null);
    const [exportModalOpen, setExportModalOpen] = useState(false);

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
        const summaryMap = new Map<string, { total: number; late: number; absent: number; leave: number }>();

        records.forEach((item) => {
            const key = `${item.grade}${item.class}`;
            const current = summaryMap.get(key) ?? { total: 0, late: 0, absent: 0, leave: 0 };

            current.total += 1;
            if (item.type === 'late') current.late += 1;
            if (item.type === 'absent') current.absent += 1;
            if (item.type === 'leave') current.leave += 1;

            summaryMap.set(key, current);
        });

        return [...summaryMap.entries()].map(([key, value]) => ({ key, ...value }));
    }, [records]);

    const handleSyncMachineData = () => {
        const now = dayjs();
        const candidate: AttendanceRecord = {
            id: `att-${Date.now()}`,
            studentId: `student-auto-${Date.now()}`,
            studentName: '自动采集学生',
            studentNo: `S${String(Date.now()).slice(-7)}`,
            grade: '三年级',
            class: '1班',
            date: now.format('YYYY-MM-DD'),
            type: 'present',
            checkInTime: now.format('HH:mm'),
            checkOutTime: '16:40',
            isException: false,
            createdAt: now.toISOString(),
        };

        setRecords((prev) => [candidate, ...prev]);
        setSyncLogs((prev) => [`${now.format('YYYY-MM-DD HH:mm')} 已同步考勤机数据（新增 1 条）`, ...prev]);
        messageApi.success('考勤机数据同步成功');
    };

    const validateExport = (currentReportType: AttendanceReportType, filters: AttendanceExportFilters) => {
        const hasStudentFilter = Boolean(filters.studentName?.trim() || filters.studentNo?.trim());

        if (!filters.startDate || !filters.endDate) {
            return '请先选择导出时间范围。';
        }

        if (currentReportType === 'personal' && !hasStudentFilter) {
            return '个人报表请先输入姓名或学号筛选条件。';
        }

        if (currentReportType === 'class') {
            if (hasStudentFilter) {
                return '班级报表不能包含姓名或学号筛选条件。';
            }

            if (!filters.grade || !filters.className) {
                return '班级报表请先选择年级和班级。';
            }
        }

        if (currentReportType === 'grade') {
            if (hasStudentFilter) {
                return '年级报表不能包含姓名或学号筛选条件。';
            }

            if (filters.className) {
                return '年级报表不能包含班级筛选条件。';
            }

            if (!filters.grade) {
                return '年级报表请先选择年级。';
            }
        }

        return null;
    };

    const handleOpenExportModal = (filters: AttendanceExportFilters) => {
        setPendingExportFilters(filters);
        setPendingReportType(reportType);
        setExportModalOpen(true);
    };

    const handleConfirmExport = async () => {
        if (!pendingExportFilters) {
            return;
        }

        const errorMessage = validateExport(pendingReportType, pendingExportFilters);
        if (errorMessage) {
            messageApi.warning(errorMessage);
            return;
        }

        const matchedRecords = filterAttendanceRecords(records, pendingExportFilters);
        if (!matchedRecords.length) {
            messageApi.warning('当前筛选条件下没有可导出的考勤数据。');
            return;
        }

        try {
            const exportOptions = {
                ...pendingExportFilters,
                reportType: pendingReportType,
            };
            const filename = exportFormat === 'excel'
                ? exportAttendanceExcel(matchedRecords, exportOptions)
                : await exportAttendancePdf(matchedRecords, exportOptions);

            setReportType(pendingReportType);
            setExportModalOpen(false);
            setPendingExportFilters(null);
            messageApi.success(exportFormat === 'excel'
                ? `Excel 已导出：${filename}`
                : `PDF 已下载：${filename}`);
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '导出失败，请稍后重试。';
            messageApi.error(messageText);
        }
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
                    : item,
            ),
        );

        const currentRecord = records.find((item) => item.id === recordId);
        if (currentRecord) {
            setTraceLogs((prev) => [
                `${dayjs().format('YYYY-MM-DD HH:mm')} 标注异常：${currentRecord.studentName}（${labels[currentRecord.type]}）- ${note}`,
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
                        支持考勤机数据同步、异常追溯、个人/班级/年级报表确认及真实 Excel 导出。
                    </Text>
                </div>
                <Space wrap>
                    <Button icon={<CloudSyncOutlined />} onClick={handleSyncMachineData}>
                        同步考勤机数据
                    </Button>
                    <Select<AttendanceReportType>
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
                        style={{ width: 150 }}
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
                        <Statistic title="异常标记数" value={stats.exceptionCount} />
                    </Card>
                </Col>
            </Row>

            <AttendanceTable data={records} onExport={handleOpenExportModal} onMarkException={handleMarkException} />

            <div className="attendance-grid">
                <Card title="班级考勤汇总" className="attendance-log-card">
                    <List
                        dataSource={classReport}
                        renderItem={(item) => (
                            <List.Item>
                                <Space split={<span>|</span>} wrap>
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

                <Card title="数据同步日志" className="attendance-log-card" extra={<FileExcelOutlined />}>
                    <List
                        dataSource={syncLogs}
                        locale={{ emptyText: '暂无同步记录' }}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                </Card>
            </div>

            <Modal
                title="确认导出范围"
                open={exportModalOpen}
                onOk={handleConfirmExport}
                onCancel={() => {
                    setExportModalOpen(false);
                    setPendingExportFilters(null);
                }}
                okText={exportFormat === 'excel' ? '导出 Excel' : '导出 PDF'}
                cancelText="取消"
            >
                <div className="attendance-export-modal">
                    <Text type="secondary">导出前请确认报表范围。班级/年级报表会校验姓名、学号、年级、班级筛选条件。</Text>
                    <Radio.Group
                        value={pendingReportType}
                        onChange={(event) => setPendingReportType(event.target.value as AttendanceReportType)}
                        className="attendance-export-radio"
                    >
                        <Radio value="personal">个人报表</Radio>
                        <Radio value="class">班级报表</Radio>
                        <Radio value="grade">年级报表</Radio>
                    </Radio.Group>
                    <div className="attendance-export-summary">
                        <div>姓名筛选：{pendingExportFilters?.studentName?.trim() || '未设置'}</div>
                        <div>学号筛选：{pendingExportFilters?.studentNo?.trim() || '未设置'}</div>
                        <div>年级筛选：{pendingExportFilters?.grade || '未设置'}</div>
                        <div>班级筛选：{pendingExportFilters?.className || '未设置'}</div>
                        <div>
                            日期范围：{pendingExportFilters?.startDate || '-'} ~ {pendingExportFilters?.endDate || '-'}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;
