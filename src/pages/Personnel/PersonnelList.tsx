import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Popconfirm, Result, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { TableColumnsType, UploadProps } from 'antd';
import { ImportOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole, ManagedUser } from '@/types';
import { deletePersonnel, getPersonnelList, importPersonnel } from '@/services/personnel';
import {
  departmentOptions,
  getPersonnelMeta,
  gradeOptions,
  isStudentRecord,
  isTeacherRecord,
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
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [extraFilter, setExtraFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const meta = getPersonnelMeta(role);

  const refreshList = async () => {
    setLoading(true);
    try {
      const result = await getPersonnelList(role);
      setRecords(result.list);
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : `${meta.roleLabel}错误`;
      messageApi.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshList();
  }, [role]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const text = `${record.username} ${record.real_name} ${record.email} ${record.phone}`.toLowerCase();
        const matchesKeyword = !keyword.trim() || text.includes(keyword.trim().toLowerCase());
        const matchesExtra =
          extraFilter === 'all'
            ? true
            : isStudentRecord(record)
              ? record.grade === extraFilter
              : isTeacherRecord(record)
                ? record.department === extraFilter
                : true;

        return matchesKeyword && matchesExtra;
      }),
    [extraFilter, keyword, records],
  );

  const handleDelete = async (id: string) => {
    try {
      await deletePersonnel(role, id);
      messageApi.success(`${meta.roleLabel}已删除`);
      await refreshList();
    } catch (error) {
      const messageText = error instanceof Error ? error.message : `删除${meta.roleLabel}失败`;
      messageApi.error(messageText);
    }
  };

  const importProps: UploadProps = {
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    showUploadList: false,
    beforeUpload: async (file) => {
      setImporting(true);
      try {
        const result = await importPersonnel(role, file as File);
        const summary = `成功导入 ${result.importedCount} 名${meta.roleLabel}${result.skippedCount ? `，跳过 ${result.skippedCount} 条` : ''}`;
        messageApi.success(summary);
        await refreshList();
      } catch (error) {
        const messageText = error instanceof Error ? error.message : `导入${meta.roleLabel}失败`;
        messageApi.error(messageText);
      } finally {
        setImporting(false);
      }

      return Upload.LIST_IGNORE;
    },
  };

  const columns: TableColumnsType<ManagedUser> = useMemo(() => {
    const baseColumns: TableColumnsType<ManagedUser> = [
      {
        title: meta.roleLabel,
        key: 'profile',
        width: 220,
        align: 'center',
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
        align: 'center',
      },
      {
        title: role === 'student' ? '手机号 / 监护人手机号' : '手机号',
        dataIndex: 'phone',
        key: 'phone',
        width: 170,
        align: 'center',
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
          align: 'center',
          render: (_, record) => (isStudentRecord(record) ? record.student_no : '-'),
        },
        {
          title: '年级 / 班级',
          key: 'grade_class',
          width: 150,
          align: 'center',
          render: (_, record) => (isStudentRecord(record) ? `${record.grade} / ${record.class_name}` : '-'),
        },
        {
          title: '监护人',
          key: 'guardian',
          width: 120,
          align: 'center',
          render: (_, record) => (isStudentRecord(record) ? record.guardian : '-'),
        },
      );
    }

    if (role === 'teacher') {
      baseColumns.splice(
        1,
        0,
        {
          align: 'center',
          title: '教工号',
          key: 'teacher_no',
          width: 130,
          render: (_, record) => (isTeacherRecord(record) ? record.teacher_no : '-'),
        },
        {
          title: '所属学部',
          key: 'department',
          width: 120,
          align: 'center',
          render: (_, record) => (isTeacherRecord(record) ? record.department : '-'),
        },
        {
          title: '任教学科',
          key: 'subjects_json',
          width: 240,
          align: 'center',
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
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`${meta.listPath}/${record.id}/edit`);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确认删除该${meta.roleLabel}？`}
            onConfirm={(event) => {
              event?.stopPropagation();
              void handleDelete(record.id);
            }}
          >
            <Button
              type="link"
              danger
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
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
          <Paragraph type="secondary">列表、详情、编辑、删除与 Excel 导入均已切换为真实后端请求。</Paragraph>
        </div>

        <div className="personnel-page-actions">
          <Upload {...importProps}>
            <Button icon={<ImportOutlined />} loading={importing}>
              {`导入${meta.roleLabel}`}
            </Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(meta.createPath)}>
            {meta.createLabel}
          </Button>
        </div>
      </div>

      <Card className="personnel-filter-card">
        <div className="personnel-filter-row">
          <Input.Search
            placeholder={`搜索${meta.roleLabel}账号、姓名、邮箱、手机号`}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
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
          loading={loading}
          columns={columns}
          dataSource={filteredRecords}
          onRow={(record) => ({
            onClick: () => navigate(`${meta.listPath}/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: filteredRecords.length,
            showSizeChanger: false,
          }}
          scroll={{ x: 1280 }}
        />
      </Card>
    </div>
  );
};

export default PersonnelList;
