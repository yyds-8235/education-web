import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Popconfirm, Result, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole, ManagedUser, UserStatus } from '@/types';
import { deletePersonnel, getPersonnelList } from '@/services/personnel';
import {
  departmentOptions,
  getPersonnelMeta,
  gradeOptions,
  isStudentRecord,
  isTeacherRecord,
  statusColorMap,
  statusOptions,
  statusTextMap,
} from './shared';
import './PersonnelManagement.css';

const { Paragraph, Text, Title } = Typography;

interface PersonnelListProps {
  role: ManagedRole;
}

const PersonnelList = ({ role }: PersonnelListProps) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [records, setRecords] = useState<ManagedUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [extraFilter, setExtraFilter] = useState<string>('all');

  const meta = getPersonnelMeta(role);

  const refreshList = () => {
    setRecords(getPersonnelList(role));
  };

  useEffect(() => {
    refreshList();
  }, [role]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const text = `${record.username} ${record.real_name} ${record.email} ${record.phone}`.toLowerCase();
        const matchesKeyword = !keyword.trim() || text.includes(keyword.trim().toLowerCase());
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        const matchesExtra =
          extraFilter === 'all'
            ? true
            : isStudentRecord(record)
              ? record.grade === extraFilter
              : isTeacherRecord(record)
                ? record.department === extraFilter
                : true;

        return matchesKeyword && matchesStatus && matchesExtra;
      }),
    [extraFilter, keyword, records, statusFilter],
  );

  const handleDelete = (id: string) => {
    const deleted = deletePersonnel(role, id);
    if (deleted) {
      messageApi.success(`${meta.roleLabel}已删除`);
      refreshList();
      return;
    }

    messageApi.error(`未找到要删除的${meta.roleLabel}`);
  };

  const columns: TableColumnsType<ManagedUser> = useMemo(() => {
    const baseColumns: TableColumnsType<ManagedUser> = [
      {
        title: meta.roleLabel,
        key: 'profile',
        width: 220,
        render: (_, record) => (
          <Space>
            <Avatar src={record.avatar || undefined} icon={!record.avatar && <UserOutlined />}>
              {!record.avatar ? record.real_name.slice(0, 1) : null}
            </Avatar>
            <div>
              <div>{record.real_name}</div>
              <Text type="secondary">{record.username}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 220,
      },
      {
        title: role === 'student' ? '手机号/监护人手机号' : '手机号',
        dataIndex: 'phone',
        key: 'phone',
        width: 170,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (value: UserStatus) => <Tag color={statusColorMap[value]}>{statusTextMap[value]}</Tag>,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
      },
    ];

    if (role === 'student') {
      baseColumns.splice(
        1,
        0,
        {
          title: '学号',
          key: 'student_no',
          width: 120,
          render: (_, record) => (isStudentRecord(record) ? record.student_no : '-'),
        },
        {
          title: '年级 / 班级',
          key: 'grade_class',
          width: 150,
          render: (_, record) => (isStudentRecord(record) ? `${record.grade} · ${record.class_name}` : '-'),
        },
        {
          title: '监护人',
          key: 'guardian',
          width: 120,
          render: (_, record) => (isStudentRecord(record) ? record.guardian : '-'),
        },
      );
    }

    if (role === 'teacher') {
      baseColumns.splice(
        1,
        0,
        {
          title: '教工号',
          key: 'teacher_no',
          width: 130,
          render: (_, record) => (isTeacherRecord(record) ? record.teacher_no : '-'),
        },
        {
          title: '所属学部',
          key: 'department',
          width: 120,
          render: (_, record) => (isTeacherRecord(record) ? record.department : '-'),
        },
        {
          title: '任教学科',
          key: 'subjects_json',
          width: 240,
          render: (_, record) =>
            isTeacherRecord(record)
              ? record.subjects_json.map((subject) => (
                  <Tag key={`${record.id}-${subject}`} color="blue">
                    {subject}
                  </Tag>
                ))
              : '-',
        },
      );
    }

    baseColumns.push({
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => navigate(`${meta.listPath}/${record.id}`)}>
            详情
          </Button>
          <Button type="link" onClick={() => navigate(`${meta.listPath}/${record.id}/edit`)}>
            编辑
          </Button>
          <Popconfirm title={`确认删除该${meta.roleLabel}？`} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    });

    return baseColumns;
  }, [meta.listPath, meta.roleLabel, navigate, role]);

  if (user?.role !== 'admin') {
    return <Result status="403" title="仅教务处可访问人员管理" />;
  }

  return (
    <div className="personnel-page">
      {contextHolder}

      <div className="personnel-page-header">
        <div>
          <Title level={3}>{meta.title}</Title>
          <Paragraph type="secondary">当前使用静态数据演示基础增删改查，详情和编辑均使用独立页面。</Paragraph>
        </div>

        <div className="personnel-page-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(meta.createPath)}>
            {meta.createLabel}
          </Button>
        </div>
      </div>

      <Card className="personnel-filter-card">
        <div className="personnel-filter-row">
          <Input
            placeholder={`搜索${meta.roleLabel}账号、姓名、邮箱、手机号`}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[{ label: '全部状态', value: 'all' }, ...statusOptions]}
          />
          <Select
            value={extraFilter}
            onChange={(value) => setExtraFilter(value)}
            options={[
              { label: role === 'student' ? '全部年级' : '全部学部', value: 'all' },
              ...(role === 'student' ? gradeOptions : departmentOptions).map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />
        </div>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1280 }}
        />
      </Card>
    </div>
  );
};

export default PersonnelList;
