import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
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
  syncStudentsApi,
  type StudentProfile as ApiStudentProfile,
  type CreateStudentParams,
} from '@/services/student';
import './StudentManagement.css';

const { Title, Text } = Typography;

type PovertyLevel = '非困难' | '一般困难' | '困难' | '特别困难';
type HouseholdType = '城镇' | '农村';
type ArchiveFilter = PovertyLevel | 'funded';

type StudentProfile = ApiStudentProfile;

interface ProfileFormValues {
  studentNo: string;
  name: string;
  username: string;
  password?: string;
  grade: string;
  class: string;
  guardian: string;
  povertyLevel: PovertyLevel;
  isSponsored: boolean;
  householdType: HouseholdType;
  isLeftBehind: boolean;
  isDisabled: boolean;
  isSingleParent: boolean;
  isKeyConcern: boolean;
  canView: boolean;
  canEdit: boolean;
  email?: string;
  phone?: string;
}

const grades = ['初一', '初二', '初三', '高一', '高二', '高三'];
const classes = ['1班', '2班', '3班', '4班'];
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
  const { user } = useAppSelector((state) => state.auth);
  const { courses, students } = useAppSelector((state) => state.course);

  const [selectedCourseId, setSelectedCourseId] = useState<string>();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>();
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<ProfileFormValues>();

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
      message.success('已拉取学生加入课程');
      setSelectedStudentIds([]);
      await dispatch(fetchCourseStudents(selectedCourseId));
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '操作失败');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourseId) {
      return;
    }
    try {
      await dispatch(removeStudentFromCourse({ courseId: selectedCourseId, studentId })).unwrap();
      message.success('已移除学生');
      await dispatch(fetchCourseStudents(selectedCourseId));
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '移除失败');
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

  const handleSyncLearningData = async () => {
    try {
      setLoading(true);
      await syncStudentsApi();
      message.success('已完成学生档案同步');
      await loadStudentList();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '同步失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    form.setFieldsValue({
      studentNo: '',
      name: '',
      username: '',
      password: '',
      grade: '初一',
      class: '1班',
      guardian: '',
      povertyLevel: '非困难',
      isSponsored: false,
      householdType: '城镇',
      isLeftBehind: false,
      isDisabled: false,
      isSingleParent: false,
      isKeyConcern: false,
      canView: true,
      canEdit: true,
      email: '',
      phone: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (profile: StudentProfile) => {
    setEditingProfile(profile);
    form.setFieldsValue({
      studentNo: profile.studentNo,
      name: profile.name,
      username: profile.username,
      grade: profile.grade,
      class: profile.class,
      guardian: profile.guardian,
      povertyLevel: profile.povertyLevel,
      isSponsored: profile.isSponsored,
      householdType: profile.householdType,
      isLeftBehind: profile.isLeftBehind,
      isDisabled: profile.isDisabled,
      isSingleParent: profile.isSingleParent,
      isKeyConcern: profile.isKeyConcern,
      canView: profile.canView,
      canEdit: profile.canEdit,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProfile(null);
    form.resetFields();
  };

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      if (editingProfile) {
        await updateStudentApi(editingProfile.id, values);
        message.success('学生信息已更新');
      } else {
        await createStudentApi(values as CreateStudentParams);
        message.success('学生信息已新增');
      }
      closeModal();
      await loadStudentList();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '保存失败');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await deleteStudentApi(id);
      message.success('学生档案已删除');
      await loadStudentList();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '删除失败');
    }
  };

  const adminColumns: ColumnsType<StudentProfile> = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 60 },
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
                <Button type="link" size="small" className="archive-expand-btn">
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
        <Switch checked={value} onChange={(checked) => updateProfile(record.id, { canView: checked })} />
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
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该学生档案？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteProfile(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <div className="student-management-header student-admin-header">
          <div>
            <Title level={3}>学生信息管理系统</Title>
            <Text type="secondary">支持学生信息增删改查，分类归档默认精简显示，点击展开弹出完整小面板。</Text>
          </div>
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleSyncLearningData}>
              同步数据
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
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

        <Modal
          title={editingProfile ? '编辑学生' : '新增学生'}
          open={modalOpen}
          onCancel={closeModal}
          onOk={() => void handleSaveProfile()}
          okText="保存"
          cancelText="取消"
          width={760}
        >
          <Form form={form} layout="vertical">
            <div className="student-form-grid">
              <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                <Input />
              </Form.Item>
              {!editingProfile && (
                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                  <Input.Password />
                </Form.Item>
              )}
              <Form.Item name="guardian" label="监护人" rules={[{ required: true, message: '请输入监护人' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                <Select options={grades.map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item name="class" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
                <Select options={classes.map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item name="povertyLevel" label="贫困等级" rules={[{ required: true, message: '请选择贫困等级' }]}>
                <Select options={povertyLevels.map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item name="householdType" label="户籍类型" rules={[{ required: true, message: '请选择户籍类型' }]}>
                <Select options={[{ value: '城镇', label: '城镇' }, { value: '农村', label: '农村' }]} />
              </Form.Item>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="手机号">
                <Input />
              </Form.Item>
            </div>

            <div className="student-form-switches">
              <Form.Item name="isSponsored" label="是否资助对象" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isLeftBehind" label="是否留守儿童" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isDisabled" label="是否残疾" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isSingleParent" label="是否单亲家庭" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isKeyConcern" label="是否重点关注学生" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="canView" label="查看权限" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="canEdit" label="编辑权限" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    );
  }

  if (user?.role !== 'teacher') {
    return <Empty description="仅教师或教务处可查看学生管理" />;
  }

  return (
    <div className="student-management-page">
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
                    actions={[
                      <Button
                        key="remove"
                        type="link"
                        danger
                        onClick={() => void handleRemoveStudent(student.studentId)}
                      >
                        移除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{student.studentName}</span>
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
