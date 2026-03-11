import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Form, Input, Result, Select, Spin, Typography, Upload, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import { useAppSelector } from '@/store/hooks';
import type { ManagedRole } from '@/types';
import { createPersonnel, getPersonnelById, updatePersonnel, uploadPersonnelAvatar } from '@/services/personnel';
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
  status: 'active' | 'inactive' | 'suspended';
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [recordFound, setRecordFound] = useState(true);

  const meta = getPersonnelMeta(role);
  const isEditMode = Boolean(id);

  useEffect(() => {
    const initForm = async () => {
      if (!isEditMode || !id) {
        form.setFieldsValue({
          status: 'active',
          avatar: '',
          subjects_json: [],
        });
        return;
      }

      setLoading(true);
      try {
        const currentRecord = await getPersonnelById(role, id);
        setRecordFound(true);

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
      } catch (error) {
        setRecordFound(false);
        const messageText = error instanceof Error ? error.message : `获取${meta.roleLabel}信息失败`;
        messageApi.error(messageText);
      } finally {
        setLoading(false);
      }
    };

    void initForm();
  }, [form, id, isEditMode, messageApi, meta.roleLabel, role]);

  const handleFinish = async (values: FormValues) => {
    const payload = {
      ...form.getFieldsValue(true),
      ...values,
    } as FormValues;
    const saveMessageKey = 'personnel-save';

    setSubmitting(true);
    messageApi.open({
      key: saveMessageKey,
      type: 'loading',
      content: '请稍后...',
      duration: 0,
    });

    try {
      if (isEditMode && id) {
        await updatePersonnel(role, id, payload);
        messageApi.open({
          key: saveMessageKey,
          type: 'success',
          content: `${meta.roleLabel}保存成功，即将跳转详情页面`,
          duration: 1.5,
        });
        setTimeout(() => navigate(`${meta.listPath}/${id}`), 1500);
        return;
      }

      const created = await createPersonnel(role, payload);
      messageApi.open({
        key: saveMessageKey,
        type: 'success',
        content: `${meta.roleLabel}保存成功，即将跳转详情页面`,
        duration: 1.5,
      });
      setTimeout(() => navigate(`${meta.listPath}/${created.id}`), 1500);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : `${meta.roleLabel}错误`;
      messageApi.open({
        key: saveMessageKey,
        type: 'error',
        content: messageText,
        duration: 2,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload: UploadProps['beforeUpload'] = async (file) => {
    if (!file.type.startsWith('image/')) {
      messageApi.error('请上传图片文件');
      return Upload.LIST_IGNORE;
    }

    setAvatarUploading(true);
    try {
      const response = await uploadPersonnelAvatar(file as File);
      form.setFieldValue('avatar', response.url);
      messageApi.success('头像已上传');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '头像上传失败';
      messageApi.error(messageText);
    } finally {
      setAvatarUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const avatarUrl = Form.useWatch('avatar', form);
  const realName = Form.useWatch('real_name', form);

  if (user?.role !== 'admin') {
    return <Result status="403" title="仅教务处可访问人员管理" />;
  }

  if (isEditMode && !recordFound && !loading) {
    return <Result status="404" title={`${meta.roleLabel}不存在`} />;
  }

  if (loading) {
    return (
      <div className="personnel-page">
        {contextHolder}
        <Card>
          <Spin />
        </Card>
      </div>
    );
  }

  return (
    <div className="personnel-page">
      {contextHolder}

      <div className="personnel-page-header">
        <div>
          <Title level={3}>{isEditMode ? meta.editLabel : meta.createLabel}</Title>
          <Paragraph type="secondary">
            {isEditMode ? '编辑页面会加载并保存当前人员信息。' : '创建后会立即写入后端数据并跳转到详情页。'}
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
          <Upload showUploadList={false} beforeUpload={handleAvatarUpload} disabled={avatarUploading}>
            <div className="personnel-avatar-trigger is-editable">
              <Avatar size={72} src={avatarUrl || undefined} icon={!avatarUrl && <UserOutlined />}>
                {!avatarUrl ? (realName || meta.roleLabel).slice(0, 1) : null}
              </Avatar>
              <Text type="secondary">{avatarUploading ? '头像上传中...' : '点击头像上传'}</Text>
            </div>
          </Upload>
          <div className="personnel-detail-meta">
            <Text strong>{realName || `待创建${meta.roleLabel}`}</Text>
            <Text type="secondary">{role === 'student' ? '学生档案维护' : '教师档案维护'}</Text>
          </div>
        </div>
      </Card>

      <Card>
        <Form<FormValues> layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="avatar" hidden>
            <Input />
          </Form.Item>

          <div className="personnel-form-grid">
            <Form.Item
              name="username"
              label="账号"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder="请输入账号" disabled={isEditMode} />
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
              label={role === 'student' ? '手机号 / 监护人手机号' : '手机号'}
              rules={[{ required: true, message: '请输入手机号' }]}
            >
              <Input placeholder="请输入手机号" />
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
                <Form.Item name="guardian" label="监护人" rules={[{ required: true, message: '请输入监护人姓名' }]}>
                  <Input placeholder="请输入监护人姓名" />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="teacher_no" label="教工号" rules={[{ required: true, message: '请输入教工号' }]}>
                  <Input placeholder="请输入教工号" />
                </Form.Item>
                <Form.Item name="department" label="所属学院" rules={[{ required: true, message: '请选择所属学院' }]}>
                  <Select options={departmentOptions.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
                <Form.Item
                  name="subjects_json"
                  label="任教学科"
                  rules={[{ required: true, message: '请至少选择一个任教学科' }]}
                >
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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PersonnelForm;
