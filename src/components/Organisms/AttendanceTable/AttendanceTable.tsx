import React, { useState, useMemo } from 'react';
import { Table, Tag, Space, Button, Input, Select, DatePicker, Tooltip, Modal, message } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AttendanceRecord, AttendanceType } from '@/types';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import './AttendanceTable.css';

const { RangePicker } = DatePicker;

export interface AttendanceTableProps {
    data: AttendanceRecord[];
    loading?: boolean;
    onExport?: (params: { startDate: string; endDate: string; type?: AttendanceType }) => void;
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
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filters, setFilters] = useState<{
        keyword?: string;
        type?: AttendanceType;
        dateRange?: [Dayjs, Dayjs];
    }>({});
    const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [exceptionNote, setExceptionNote] = useState('');

    const attendanceTypeConfig: Record<AttendanceType, { label: string; color: string; icon: React.ReactNode }> = {
        present: { label: '出勤', color: 'success', icon: <CheckCircleOutlined /> },
        late: { label: '迟到', color: 'warning', icon: <ClockCircleOutlined /> },
        early_leave: { label: '早退', color: 'warning', icon: <ClockCircleOutlined /> },
        absent: { label: '旷课', color: 'error', icon: <CloseCircleOutlined /> },
        leave: { label: '请假', color: 'processing', icon: <ExclamationCircleOutlined /> },
    };

    const filteredData = useMemo(() => {
        return data.filter((record) => {
            if (filters.keyword) {
                const keyword = filters.keyword.toLowerCase();
                if (
                    !record.studentName.toLowerCase().includes(keyword) &&
                    !record.studentNo.toLowerCase().includes(keyword)
                ) {
                    return false;
                }
            }
            if (filters.type && record.type !== filters.type) {
                return false;
            }
            if (filters.dateRange) {
                const recordDate = dayjs(record.date);
                if (recordDate.isBefore(filters.dateRange[0], 'day') || recordDate.isAfter(filters.dateRange[1], 'day')) {
                    return false;
                }
            }
            return true;
        });
    }, [data, filters]);

    const columns: ColumnsType<AttendanceRecord> = [
        {
            title: '学号',
            dataIndex: 'studentNo',
            key: 'studentNo',
            width: 120,
            fixed: 'left',
        },
        {
            title: '姓名',
            dataIndex: 'studentName',
            key: 'studentName',
            width: 100,
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
            width: 120,
            sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
            title: '状态',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: AttendanceType) => {
                const config = attendanceTypeConfig[type];
                return (
                    <Tag icon={config.icon} color={config.color}>
                        {config.label}
                    </Tag>
                );
            },
            filters: Object.entries(attendanceTypeConfig).map(([value, config]) => ({
                text: config.label,
                value,
            })),
        },
        {
            title: '签到时间',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
            width: 120,
            render: (time) => time || '-',
        },
        {
            title: '签退时间',
            dataIndex: 'checkOutTime',
            key: 'checkOutTime',
            width: 120,
            render: (time) => time || '-',
        },
        {
            title: '异常标记',
            dataIndex: 'isException',
            key: 'isException',
            width: 100,
            render: (isException: boolean, record) => (
                <Tooltip title={isException ? record.exceptionNote : undefined}>
                    {isException ? (
                        <Tag color="error">异常</Tag>
                    ) : (
                        <Tag color="default">正常</Tag>
                    )}
                </Tooltip>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleMarkException(record)}
                    >
                        标记异常
                    </Button>
                </Space>
            ),
        },
    ];

    const handleMarkException = (record: AttendanceRecord) => {
        setSelectedRecord(record);
        setExceptionNote(record.exceptionNote || '');
        setExceptionModalVisible(true);
    };

    const handleExceptionSubmit = () => {
        if (selectedRecord && onMarkException) {
            onMarkException(selectedRecord.id, exceptionNote);
            message.success('异常标记成功');
        }
        setExceptionModalVisible(false);
        setSelectedRecord(null);
        setExceptionNote('');
    };

    const handleExport = () => {
        if (onExport && filters.dateRange) {
            onExport({
                startDate: filters.dateRange[0].format('YYYY-MM-DD'),
                endDate: filters.dateRange[1].format('YYYY-MM-DD'),
                type: filters.type,
            });
        } else {
            message.warning('请选择日期范围后导出');
        }
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    return (
        <div className={`attendance-table ${className}`}>
            <div className="attendance-table-toolbar">
                <div className="toolbar-left">
                    <Input.Search
                        placeholder="搜索学号或姓名"
                        allowClear
                        onSearch={(value) => setFilters({ ...filters, keyword: value })}
                        style={{ width: 200 }}
                    />
                    <Select
                        placeholder="考勤状态"
                        allowClear
                        style={{ width: 120 }}
                        onChange={(value) => setFilters({ ...filters, type: value })}
                        options={Object.entries(attendanceTypeConfig).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                    />
                    <RangePicker
                        onChange={(dates) => {
                            setFilters({
                                ...filters,
                                dateRange: dates as [Dayjs, Dayjs] | undefined,
                            });
                        }}
                    />
                </div>
                <div className="toolbar-right">
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
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
                scroll={{ x: 1200 }}
                className="attendance-data-table"
            />

            <Modal
                title="标记异常"
                open={exceptionModalVisible}
                onOk={handleExceptionSubmit}
                onCancel={() => setExceptionModalVisible(false)}
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
                        <label>异常说明：</label>
                        <Input.TextArea
                            value={exceptionNote}
                            onChange={(e) => setExceptionNote(e.target.value)}
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
