import { useEffect } from 'react';
import { Avatar, Button, Card, Form, Input, Result, Select, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole, UserStatus } from '@/types';
import { createPersonnel, getPersonnelById, updatePersonnel } from '@/services/personnel';
import {
  classOptions,
  departmentOptions,
  getPersonnelMeta,
  gradeOptions,
  isStudentRecord,
  isTeacherRecord,
  statusOptions,
  subjectOptions,
} from './shared';
import './PersonnelManagement.css';

const { Paragraph, Text, Title } = Typography;

interface PersonnelFormPageProps {
  role: ManagedRole;
}

interface FormValues {
  username: string;
  real_name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: UserStatus;
  student_no?: string;
  grade?: string;
  class_name?: string;
  guardian?: string;
  teacher_no?: string;
  department?: string;
  subjects_json?: string[];
}

const PersonnelForm = ({ role }: PersonnelFormPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<FormValues>();

  const meta = getPersonnelMeta(role);
  const isEditMode = Boolean(id);
  const currentRecord = id ? getPersonnelById(role, id) : undefined;

  useEffect(() => {
    if (!currentRecord) {
      form.setFieldsValue({
        status: 'active',
        avatar: '',
        subjects_json: [],
      });
      return;
    }

    if (isStudentRecord(currentRecord)) {
      form.setFieldsValue({
        username: currentRecord.username,
        real_name: currentRecord.real_name,
        email: currentRecord.email,
        phone: currentRecord.phone,
        avatar: currentRecord.avatar,
        status: currentRecord.status,
        student_no: currentRecord.student_no,
        grade: currentRecord.grade,
        class_name: currentRecord.class_name,
        guardian: currentRecord.guardian,
      });
      return;
    }

    if (isTeacherRecord(currentRecord)) {
      form.setFieldsValue({
        username: currentRecord.username,
        real_name: currentRecord.real_name,
        email: currentRecord.email,
        phone: currentRecord.phone,
        avatar: currentRecord.avatar,
        status: currentRecord.status,
        teacher_no: currentRecord.teacher_no,
        department: currentRecord.department,
        subjects_json: currentRecord.subjects_json,
      });
    }
  }, [currentRecord, form]);

  const handleFinish = (values: FormValues) => {
    if (isEditMode && id) {
      const updated = updatePersonnel(role, id, values);
      if (!updated) {
        messageApi.error(`未找到要更新的${meta.roleLabel}`);
        return;
      }

      messageApi.success(`${meta.roleLabel}信息已更新`);
      navigate(`${meta.listPath}/${id}`);
      return;
    }

    const created = createPersonnel(role, values);
    messageApi.success(`${meta.roleLabel}创建成功`);
    navigate(`${meta.listPath}/${created.id}`);
  };

  if (user?.role !== 'admin') {
    return <Result status="403" title="仅教务处可访问人员管理" />;
  }

  if (isEditMode && !currentRecord) {
    return <Result status="404" title={`${meta.roleLabel}不存在`} />;
  }

  const avatarUrl = Form.useWatch('avatar', form);
  const realName = Form.useWatch('real_name', form);

  return (
    <div className="personnel-page">
      {contextHolder}

      <div className="personnel-page-header">
        <div>
          <Title level={3}>{isEditMode ? meta.editLabel : meta.createLabel}</Title>
          <Paragraph type="secondary">
            {isEditMode ? '直接在页面中修改人员信息，不使用弹窗。' : '使用静态数据新增记录，保存后可返回列表查看效果。'}
          </Paragraph>
        </div>

        <div className="personnel-page-actions">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(meta.listPath)}>
            返回列表
          </Button>
        </div>
      </div>

      <Card>
        <div className="personnel-detail-hero">
          <Avatar size={72} src={avatarUrl || undefined} icon={!avatarUrl && <UserOutlined />}>
            {!avatarUrl ? (realName || meta.roleLabel).slice(0, 1) : null}
          </Avatar>
          <div className="personnel-detail-meta">
            <Text strong>{realName || `待创建${meta.roleLabel}`}</Text>
            <Text type="secondary">{role === 'student' ? '学生档案维护' : '教师档案维护'}</Text>
          </div>
        </div>
      </Card>

      <Card>
        <Form<FormValues> layout="vertical" form={form} onFinish={handleFinish}>
          <div className="personnel-form-grid">
            <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input placeholder="请输入账号" />
            </Form.Item>
            <Form.Item name="real_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱格式' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={role === 'student' ? '手机号/监护人手机号' : '手机号'}
              rules={[{ required: true, message: '请输入手机号' }]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="avatar" label="头像 URL">
              <Input placeholder="请输入头像 URL，可为空" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={statusOptions.map((item) => ({ ...item }))} />
            </Form.Item>

            {role === 'student' ? (
              <>
                <Form.Item name="student_no" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
                  <Input placeholder="请输入学号" />
                </Form.Item>
                <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                  <Select options={gradeOptions.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
                <Form.Item name="class_name" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
                  <Select options={classOptions.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
                <Form.Item name="guardian" label="监护人姓名" rules={[{ required: true, message: '请输入监护人姓名' }]}>
                  <Input placeholder="请输入监护人姓名" />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="teacher_no" label="教工号" rules={[{ required: true, message: '请输入教工号' }]}>
                  <Input placeholder="请输入教工号" />
                </Form.Item>
                <Form.Item name="department" label="所属学部" rules={[{ required: true, message: '请选择所属学部' }]}>
                  <Select options={departmentOptions.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
                <Form.Item name="subjects_json" label="任教学科" rules={[{ required: true, message: '请至少选择一个任教学科' }]}>
                  <Select
                    mode="tags"
                    options={subjectOptions.map((item) => ({ label: item, value: item }))}
                    placeholder="请输入或选择学科"
                  />
                </Form.Item>
              </>
            )}
          </div>

          <div className="personnel-form-actions">
            <Button onClick={() => navigate(meta.listPath)}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PersonnelForm;
