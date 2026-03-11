import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  List,
  Popconfirm,
  Popover,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import { DeleteOutlined, EditOutlined, ImportOutlined, PlusOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockStudents } from '@/mock/users';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addStudentsToCourse,
  fetchCourses,
  fetchCourseStudents,
  removeStudentFromCourse,
} from '@/store/slices/courseSlice';
import {
  getStudentListApi,
  createStudentApi,
  updateStudentApi,
  deleteStudentApi,
  updateStudentPermissionsApi,
  type StudentProfile as ApiStudentProfile,
  type CreateStudentParams,
} from '@/services/student';
import './StudentManagement.css';

const { Title, Text } = Typography;

type PovertyLevel = '非困难' | '一般困难' | '困难' | '特别困难';
type ArchiveFilter = PovertyLevel | 'funded';

type StudentProfile = ApiStudentProfile;

const grades = ['初一', '初二', '初三', '高一', '高二', '高三'];
const povertyLevels: PovertyLevel[] = ['非困难', '一般困难', '困难', '特别困难'];

const getProfileTags = (profile: StudentProfile) => [
  `贫困等级：${profile.povertyLevel}`,
  `是否资助对象：${profile.isSponsored ? '是' : '否'}`,
  `户籍类型：${profile.householdType}`,
  `是否留守儿童：${profile.isLeftBehind ? '是' : '否'}`,
  `是否残疾：${profile.isDisabled ? '是' : '否'}`,
  `是否单亲家庭：${profile.isSingleParent ? '是' : '否'}`,
  `是否重点关注学生：${profile.isKeyConcern ? '是' : '否'}`,
];

const StudentManagement = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, students } = useAppSelector((state) => state.course);
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>();

  useEffect(() => {
    if (user?.role !== 'teacher') {
      return;
    }
    void dispatch(fetchCourses({ page: 1, pageSize: 100, scope: 'mine' }));
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (!selectedCourseId) {
      return;
    }
    void dispatch(fetchCourseStudents(selectedCourseId));
  }, [dispatch, selectedCourseId]);

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadStudentList();
    }
  }, [user?.role, pagination.page, pagination.pageSize, keyword, gradeFilter, archiveFilter]);

  const loadStudentList = async () => {
    setLoading(true);
    try {
      const response = await getStudentListApi({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword,
        grade: gradeFilter,
        archiveFilter,
      });
      setProfiles(response.list);
      setPagination((prev) => ({ ...prev, total: response.total }));
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '加载学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  const availableStudents = useMemo(() => {
    const joinedSet = new Set(students.map((student) => student.studentId));
    return mockStudents.filter((student) => !joinedSet.has(student.id));
  }, [students]);

  const handleAddStudents = async () => {
    if (!selectedCourseId || selectedStudentIds.length === 0) {
      return;
    }
    try {
      await dispatch(addStudentsToCourse({ courseId: selectedCourseId, studentIds: selectedStudentIds })).unwrap();
      messageApi.success('已拉取学生加入课程');
      setSelectedStudentIds([]);
      await dispatch(fetchCourseStudents(selectedCourseId));
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '操作失败');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourseId) {
      return;
    }
    try {
      await dispatch(removeStudentFromCourse({ courseId: selectedCourseId, studentId })).unwrap();
      messageApi.success('已移除学生');
      await dispatch(fetchCourseStudents(selectedCourseId));
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '移除失败');
    }
  };

  const updateProfile = async (id: string, changes: Partial<StudentProfile>) => {
    try {
      if (changes.canView !== undefined || changes.canEdit !== undefined) {
        await updateStudentPermissionsApi(id, {
          canView: changes.canView ?? profiles.find((p) => p.id === id)?.canView ?? true,
          canEdit: changes.canEdit ?? profiles.find((p) => p.id === id)?.canEdit ?? false,
        });
        message.success('权限已更新');
        await loadStudentList();
      }
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '更新失败');
    }
  };

  const handleSyncLearningData = () => {
    const syncedAt = new Date().toLocaleString();
    setProfiles((prev) => prev.map((item) => ({ ...item, syncedAt })));
    messageApi.success('已完成学生数据同步');
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await deleteStudentApi(id);
      messageApi.success('学生档案已删除');
      await loadStudentList();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '删除失败');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      // 模拟导入功能
      // 实际项目中应该调用导入API
      await new Promise(resolve => setTimeout(resolve, 2000));

      messageApi.success(`成功导入学生数据（文件：${file.name}）`);
      await loadStudentList();
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    showUploadList: false,
    beforeUpload: (file) => {
      void handleImport(file as File);
      return false; // 阻止自动上传
    },
  };

  const handleViewLearningProfile = (profile: Partial<StudentProfile> & { id: string; name?: string; studentNo?: string }) => {
    navigate(`/students/${profile.id}/learning`, {
      state: {
        student: {
          id: profile.id,
          name: profile.name,
          studentNo: profile.studentNo,
          username: 'username' in profile ? profile.username : undefined,
          grade: 'grade' in profile ? profile.grade : undefined,
          className: 'class' in profile ? profile.class : undefined,
          guardian: 'guardian' in profile ? profile.guardian : undefined,
          tags: profile.name ? ['点击查看学情信息'] : undefined,
        },
      },
    });
  };

  const adminColumns: ColumnsType<StudentProfile> = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 60 },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (avatar: string | undefined) => (
        <Avatar src={avatar} icon={!avatar && <UserOutlined />} size={40} />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      // render: (value: string) => (
      //   <Space>
      //     <span>{value}</span>
      //     <Tag color="processing">查看详情</Tag>
      //   </Space>
      // ),
    },
    { title: '账号', dataIndex: 'username', key: 'username', width: 60 },
    {
      title: '年级/班级',
      key: 'gradeClass',
      width: 70,
      render: (_, record) => `${record.grade} ${record.class}`,
    },
    {
      title: '分类归档',
      key: 'archive',
      width: 190,
      render: (_, record) => {
        const tags = getProfileTags(record);
        const previewTags = tags.slice(0, 2);
        const hiddenCount = Math.max(0, tags.length - previewTags.length);
        const popoverContent = (
          <div className="archive-popover-panel">
            <Space size={[8, 8]} wrap>
              {tags.map((tag, index) => (
                <Tag
                  key={`${record.id}-full-${tag}`}
                  color={index === 0 ? 'gold' : index === 1 ? (record.isSponsored ? 'green' : 'default') : 'blue'}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        );

        return (
          <Space size={[6, 6]} wrap>
            {previewTags.map((tag, index) => (
              <Tag
                key={`${record.id}-${tag}`}
                color={index === 0 ? 'gold' : index === 1 ? (record.isSponsored ? 'green' : 'default') : 'blue'}
              >
                {tag}
              </Tag>
            ))}
            {hiddenCount > 0 ? (
              <Popover
                trigger="click"
                placement="bottomLeft"
                content={popoverContent}
                title={`${record.name} - 分类归档`}
              >
                <Button type="link" size="small" className="archive-expand-btn" onClick={(event) => event.stopPropagation()}>
                  展开 +{hiddenCount}
                </Button>
              </Popover>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: '查看权限',
      dataIndex: 'canView',
      key: 'canView',
      width: 60,
      render: (value: boolean, record) => (
        <Switch
          checked={value}
          onClick={(_checked, event) => event?.stopPropagation()}
          onChange={(checked) => updateProfile(record.id, { canView: checked })}
        />
      ),
    },
    {
      title: '编辑权限',
      dataIndex: 'canEdit',
      key: 'canEdit',
      width: 60,
      render: (value: boolean, record) => (
        <Switch
          checked={value}
          disabled={!record.canView}
          onClick={(_checked, event) => event?.stopPropagation()}
          onChange={(checked) => updateProfile(record.id, { canEdit: checked })}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" icon={<EditOutlined />} onClick={(event) => {
            event.stopPropagation();
            navigate(`/students/${record.id}/edit`);
          }}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该学生档案？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteProfile(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} onClick={(event) => event.stopPropagation()}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (user?.role === 'admin') {
    return (
      <div className="student-management-page">
        {contextHolder}
        <div className="student-management-header student-admin-header">
          <div>
            <Title level={3}>学生信息管理系统</Title>
            <Text type="secondary">支持学生信息增删改查，分类归档默认精简显示，点击展开弹出完整小面板。</Text>
          </div>
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<ImportOutlined />} loading={importing}>
                导入学生
              </Button>
            </Upload>
            <Button icon={<SyncOutlined />} onClick={handleSyncLearningData}>
              同步数据
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/students/new')}>
              新增学生
            </Button>
          </Space>
        </div>

        <Card>
          <Space wrap>
            <Input.Search
              placeholder="按学号/姓名/标签检索"
              allowClear
              style={{ width: 280 }}
              onSearch={(value) => {
                setKeyword(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
            <Select
              allowClear
              placeholder="筛选年级"
              style={{ width: 140 }}
              value={gradeFilter}
              onChange={(value) => {
                setGradeFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={grades.map((value) => ({ value, label: value }))}
            />
            <Select
              allowClear
              placeholder="筛选分类归档"
              style={{ width: 220 }}
              value={archiveFilter}
              onChange={(value) => {
                setArchiveFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { value: 'funded', label: '资助对象' },
                ...povertyLevels.map((level) => ({ value: level, label: `贫困等级：${level}` })),
              ]}
            />
          </Space>

          <Divider />

          <Table
            rowKey="id"
            columns={adminColumns}
            dataSource={profiles}
            loading={loading}
            rowClassName={() => 'student-clickable-row'}
            onRow={(record) => ({
              onClick: () => navigate(`/students/${record.id}/detail`),
              title: '点击查看学生详情',
            })}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, page, pageSize });
              },
            }}
            scroll={{ x: 1300 }}
          />
        </Card>
      </div>
    );
  }

  if (user?.role !== 'teacher') {
    return <Empty description="仅教师或教务处可查看学生管理" />;
  }

  return (
    <div className="student-management-page">
      {contextHolder}
      <div className="student-management-header">
        <Title level={3}>学生管理</Title>
        <Text type="secondary">按课程管理已加入学生，支持教师拉取与移除。</Text>
      </div>

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            placeholder="选择课程"
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            options={courses.map((course) => ({
              label: `${course.name}（${course.studentCount}人）`,
              value: course.id,
            }))}
          />

          {selectedCourseId ? (
            <>
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="选择要拉取的学生"
                  style={{ width: '100%' }}
                  value={selectedStudentIds}
                  onChange={setSelectedStudentIds}
                  options={availableStudents.map((student) => ({
                    label: `${student.realName}（${student.username}）`,
                    value: student.id,
                  }))}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => void handleAddStudents()}>
                  拉取加入
                </Button>
              </Space.Compact>

              <List
                bordered
                locale={{ emptyText: '当前课程暂无学生' }}
                dataSource={students}
                renderItem={(student) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    title="点击查看学情信息"
                    onClick={() => handleViewLearningProfile({
                      id: student.studentId,
                      name: student.studentName,
                      studentNo: student.studentNo,
                    })}
                    actions={[
                      <Button
                        key="remove"
                        type="link"
                        danger
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveStudent(student.studentId);
                        }}
                      >
                        移除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{student.studentName}</span>
                          <Tag color="processing">点击查看学情</Tag>
                          <Tag>{student.studentNo}</Tag>
                        </Space>
                      }
                      description={`加入时间：${new Date(student.joinedAt).toLocaleString()}，学习进度 ${student.progress}%`}
                    />
                  </List.Item>
                )}
              />
            </>
          ) : (
            <Empty description="请先选择课程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default StudentManagement;