import React, { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, message, Modal, Select, Table, Tag, Tooltip } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AttendanceRecord, AttendanceType } from '@/types';
import { filterAttendanceRecords, type AttendanceExportFilters } from '@/utils/attendanceExport';
import './AttendanceTable.css';

const { RangePicker } = DatePicker;

type TableFilters = AttendanceExportFilters & {
    dateRange?: [Dayjs, Dayjs];
};

export interface AttendanceTableProps {
    data: AttendanceRecord[];
    loading?: boolean;
    onExport?: (params: AttendanceExportFilters) => void;
    onMarkException?: (recordId: string, note: string) => void;
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
    };
    className?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
    data,
    loading = false,
    onExport,
    onMarkException,
    pagination,
    className = '',
}) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filters, setFilters] = useState<TableFilters>({});
    const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [exceptionNote, setExceptionNote] = useState('');

    const attendanceTypeConfig: Record<AttendanceType, { label: string; color: string; icon: React.ReactNode }> = {
        present: { label: '出勤', color: 'success', icon: <CheckCircleOutlined /> },
        late: { label: '迟到', color: 'warning', icon: <ClockCircleOutlined /> },
        early_leave: { label: '早退', color: 'gold', icon: <ClockCircleOutlined /> },
        absent: { label: '旷课', color: 'error', icon: <CloseCircleOutlined /> },
        leave: { label: '请假', color: 'processing', icon: <ExclamationCircleOutlined /> },
    };

    const defaultDateRange = useMemo<[Dayjs, Dayjs] | undefined>(() => {
        if (!data.length) {
            return undefined;
        }

        const sortedDates = [...data].sort((left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf());
        return [dayjs(sortedDates[0].date), dayjs(sortedDates[sortedDates.length - 1].date)];
    }, [data]);

    useEffect(() => {
        if (!filters.dateRange && defaultDateRange) {
            setFilters((currentFilters) => ({
                ...currentFilters,
                dateRange: defaultDateRange,
            }));
        }
    }, [defaultDateRange, filters.dateRange]);

    const gradeOptions = useMemo(
        () => [...new Set(data.map((record) => record.grade))].map((grade) => ({ label: grade, value: grade })),
        [data],
    );

    const classOptions = useMemo(
        () =>
            [
                ...new Set(
                    data
                        .filter((record) => !filters.grade || record.grade === filters.grade)
                        .map((record) => record.class),
                ),
            ].map((item) => ({ label: item, value: item })),
        [data, filters.grade],
    );

    const exportFilters = useMemo<AttendanceExportFilters>(
        () => ({
            studentName: filters.studentName,
            studentNo: filters.studentNo,
            grade: filters.grade,
            className: filters.className,
            type: filters.type,
            startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
            endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
        }),
        [filters],
    );

    const filteredData = useMemo(() => filterAttendanceRecords(data, exportFilters), [data, exportFilters]);

    const columns: ColumnsType<AttendanceRecord> = [
        {
            title: '学号',
            dataIndex: 'studentNo',
            key: 'studentNo',
            width: 130,
            fixed: 'left',
        },
        {
            title: '姓名',
            dataIndex: 'studentName',
            key: 'studentName',
            width: 120,
            fixed: 'left',
        },
        {
            title: '年级',
            dataIndex: 'grade',
            key: 'grade',
            width: 100,
        },
        {
            title: '班级',
            dataIndex: 'class',
            key: 'class',
            width: 100,
        },
        {
            title: '日期',
            dataIndex: 'date',
            key: 'date',
            width: 130,
            sorter: (left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf(),
        },
        {
            title: '状态',
            dataIndex: 'type',
            key: 'type',
            width: 110,
            render: (value: AttendanceType) => {
                const config = attendanceTypeConfig[value];
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: '签到时间',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
            width: 110,
            render: (value?: string) => value || '-',
        },
        {
            title: '签退时间',
            dataIndex: 'checkOutTime',
            key: 'checkOutTime',
            width: 110,
            render: (value?: string) => value || '-',
        },
        {
            title: '异常说明',
            dataIndex: 'exceptionNote',
            key: 'exceptionNote',
            width: 220,
            render: (value?: string) => value || '-',
        },
        {
            title: '操作',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Tooltip title={record.isException ? '更新异常说明' : '标记异常'}>
                    <Button
                        type="link"
                        onClick={() => {
                            setSelectedRecord(record);
                            setExceptionNote(record.exceptionNote ?? '');
                            setExceptionModalVisible(true);
                        }}
                    >
                        {record.isException ? '更新异常' : '标记异常'}
                    </Button>
                </Tooltip>
            ),
        },
    ];

    const handleExceptionSubmit = () => {
        if (!selectedRecord || !onMarkException) {
            setExceptionModalVisible(false);
            return;
        }

        if (!exceptionNote.trim()) {
            messageApi.warning('请输入异常说明');
            return;
        }

        onMarkException(selectedRecord.id, exceptionNote.trim());
        messageApi.success('异常标记已更新');
        setExceptionModalVisible(false);
        setSelectedRecord(null);
        setExceptionNote('');
    };

    const handleResetFilters = () => {
        setFilters({
            dateRange: defaultDateRange,
        });
    };

    const handleExport = () => {
        if (!onExport) {
            return;
        }

        if (!exportFilters.startDate || !exportFilters.endDate) {
            messageApi.warning('请先选择导出日期范围');
            return;
        }

        onExport(exportFilters);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    return (
        <div className={`attendance-table ${className}`}>
            {contextHolder}
            <div className="attendance-table-toolbar">
                <div className="toolbar-left">
                    <Input
                        placeholder="按学号筛选"
                        allowClear
                        value={filters.studentNo}
                        onChange={(event) =>
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                studentNo: event.target.value || undefined,
                            }))
                        }
                        style={{ width: 160 }}
                    />
                    <Input
                        placeholder="按姓名筛选"
                        allowClear
                        value={filters.studentName}
                        onChange={(event) =>
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                studentName: event.target.value || undefined,
                            }))
                        }
                        style={{ width: 160 }}
                    />
                    <Select
                        placeholder="选择年级"
                        allowClear
                        value={filters.grade}
                        style={{ width: 140 }}
                        options={gradeOptions}
                        onChange={(value) => {
                            const nextClassOptions = [
                                ...new Set(
                                    data
                                        .filter((record) => !value || record.grade === value)
                                        .map((record) => record.class),
                                ),
                            ];

                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                grade: value,
                                className:
                                    value && currentFilters.className && nextClassOptions.includes(currentFilters.className)
                                        ? currentFilters.className
                                        : undefined,
                            }));
                        }}
                    />
                    <Select
                        placeholder="选择班级"
                        allowClear
                        value={filters.className}
                        style={{ width: 140 }}
                        options={classOptions}
                        onChange={(value) =>
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                className: value,
                            }))
                        }
                    />
                    <Select
                        placeholder="考勤状态"
                        allowClear
                        value={filters.type}
                        style={{ width: 140 }}
                        onChange={(value) =>
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                type: value,
                            }))
                        }
                        options={Object.entries(attendanceTypeConfig).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                    />
                    <RangePicker
                        value={filters.dateRange}
                        onChange={(dates) => {
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                dateRange: dates ? (dates as [Dayjs, Dayjs]) : undefined,
                            }));
                        }}
                    />
                </div>
                <div className="toolbar-right">
                    <Button onClick={handleResetFilters}>重置筛选</Button>
                    <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
                        导出报表
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="id"
                loading={loading}
                rowSelection={rowSelection}
                pagination={
                    pagination || {
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }
                }
                scroll={{ x: 1500 }}
                className="attendance-data-table"
            />

            <Modal
                title="标记异常"
                open={exceptionModalVisible}
                onOk={handleExceptionSubmit}
                onCancel={() => {
                    setExceptionModalVisible(false);
                    setSelectedRecord(null);
                    setExceptionNote('');
                }}
                okText="确认"
                cancelText="取消"
            >
                <div className="exception-form">
                    <p>
                        学生：<strong>{selectedRecord?.studentName}</strong>
                    </p>
                    <p>
                        日期：<strong>{selectedRecord?.date}</strong>
                    </p>
                    <div className="exception-note-input">
                        <label htmlFor="attendance-exception-note">异常说明</label>
                        <Input.TextArea
                            id="attendance-exception-note"
                            value={exceptionNote}
                            onChange={(event) => setExceptionNote(event.target.value)}
                            placeholder="请输入异常说明"
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AttendanceTable;
