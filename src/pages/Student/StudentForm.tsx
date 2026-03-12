import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Form, Input, Select, Switch, Typography, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import {
  createStudentApi,
  getStudentDetailApi,
  updateStudentApi,
  uploadStudentAvatar,
  type CreateStudentParams,
} from '@/services/student';
import './StudentManagement.css';

const { Paragraph, Text, Title } = Typography;

type PovertyLevel = '非困难' | '一般困难' | '困难' | '特别困难';
type HouseholdType = '城镇' | '农村';

interface FormValues {
  studentNo: string;
  name: string;
  username: string;
  password?: string;
  avatar?: string;
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
const householdTypes: HouseholdType[] = ['城镇', '农村'];

const STUDENT_USERNAME_PREFIX = 'stu';

const ensureStudentUsernamePrefix = (username: string) => {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return STUDENT_USERNAME_PREFIX;
  }

  return trimmedUsername.startsWith(STUDENT_USERNAME_PREFIX)
    ? trimmedUsername
    : `${STUDENT_USERNAME_PREFIX}${trimmedUsername}`;
};

const StudentForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isEdit = Boolean(id);
  const avatarUrl = Form.useWatch('avatar', form);
  const studentName = Form.useWatch('name', form);

  useEffect(() => {
    if (isEdit && id) {
      void loadStudentData();
      return;
    }

    form.setFieldsValue({
      username: STUDENT_USERNAME_PREFIX,
      avatar: '',
      povertyLevel: '非困难',
      isSponsored: false,
      householdType: '城镇',
      isLeftBehind: false,
      isDisabled: false,
      isSingleParent: false,
      isKeyConcern: false,
      canView: true,
      canEdit: false,
    });
  }, [form, id, isEdit]);

  const loadStudentData = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const data = await getStudentDetailApi(id);
      form.setFieldsValue({
        studentNo: data.studentNo,
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        grade: data.grade,
        class: data.class,
        guardian: data.guardian,
        povertyLevel: data.povertyLevel as PovertyLevel,
        isSponsored: data.isSponsored,
        householdType: data.householdType as HouseholdType,
        isLeftBehind: data.isLeftBehind,
        isDisabled: data.isDisabled,
        isSingleParent: data.isSingleParent,
        isKeyConcern: data.isKeyConcern,
        canView: data.canView,
        canEdit: data.canEdit,
        email: data.email,
        phone: data.phone,
      });
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '加载学生信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload: UploadProps['beforeUpload'] = async (file) => {
    if (!file.type.startsWith('image/')) {
      messageApi.error('请上传图片文件');
      return Upload.LIST_IGNORE;
    }

    setAvatarUploading(true);
    try {
      const response = await uploadStudentAvatar(file as File);
      form.setFieldValue('avatar', response.url);
      messageApi.success('头像已上传');
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '头像上传失败');
    } finally {
      setAvatarUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleFinish = async (values: FormValues) => {
    try {
      setSubmitting(true);

      const payload = {
        ...values,
        username: isEdit ? values.username : ensureStudentUsernamePrefix(values.username),
      };

      if (!payload.password?.trim()) {
        delete payload.password;
      }

      if (isEdit && id) {
        await updateStudentApi(id, payload);
        messageApi.success('学生信息已更新');
      } else {
        await createStudentApi(payload as CreateStudentParams);
        messageApi.success('学生信息已创建');
      }

      setTimeout(() => {
        navigate('/students');
      }, 500);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message || '保存失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-page">
      {contextHolder}

      <div className="student-page-header">
        <div>
          <Title level={3}>{isEdit ? '编辑学生信息' : '新增学生'}</Title>
          <Paragraph type="secondary">
            {isEdit ? '参考教师端编辑页样式，支持直接查看并编辑头像。' : '创建学生档案时可同步维护基础资料与权限。'}
          </Paragraph>
        </div>

        <div className="student-page-actions">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
            返回列表
          </Button>
          <Button type="primary" htmlType="submit" form="student-form" icon={<SaveOutlined />} loading={submitting}>
            保存
          </Button>
        </div>
      </div>

      <Card loading={loading}>
        <div className="student-detail-hero">
          <Upload showUploadList={false} beforeUpload={handleAvatarUpload} disabled={avatarUploading}>
            <div className="student-avatar-trigger is-editable">
              <Avatar size={72} src={avatarUrl || undefined} icon={!avatarUrl && <UserOutlined />}>
                {!avatarUrl ? (studentName || '学').slice(0, 1) : null}
              </Avatar>
              <Text type="secondary">{avatarUploading ? '头像上传中...' : '点击头像上传'}</Text>
            </div>
          </Upload>
          <div className="student-detail-meta">
            <Text strong>{studentName || '待创建学生'}</Text>
            <Text type="secondary">学生档案维护</Text>
          </div>
        </div>
      </Card>

      <Card>
        <Form<FormValues> id="student-form" form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="avatar" hidden>
            <Input />
          </Form.Item>

          <div className="student-form-grid">
            <Form.Item
              name="username"
              label="账号"
              extra={!isEdit ? '账号需以 stu 开头，例如 stu1001' : undefined}
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder={isEdit ? '账号不可编辑' : '请输入学生账号，如 stu1001'} disabled={isEdit} />
            </Form.Item>
            <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
              <Input placeholder="请输入学号" disabled={isEdit} />
            </Form.Item>

            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              extra={isEdit ? '如不修改密码可留空' : '新增时请设置登录密码'}
              rules={isEdit ? [] : [{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder={isEdit ? '如不修改密码请留空' : '请输入密码'} />
            </Form.Item>
            <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
              <Select placeholder="请选择年级" options={grades.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="class" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
              <Select placeholder="请选择班级" options={classes.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="guardian" label="监护人" rules={[{ required: true, message: '请输入监护人姓名' }]}>
              <Input placeholder="请输入监护人姓名" />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input placeholder="请输入邮箱" type="email" />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="povertyLevel" label="贫困等级" rules={[{ required: true, message: '请选择贫困等级' }]}>
              <Select placeholder="请选择贫困等级" options={povertyLevels.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="householdType" label="户籍类型" rules={[{ required: true, message: '请选择户籍类型' }]}>
              <Select placeholder="请选择户籍类型" options={householdTypes.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="isSponsored" label="是否资助对象" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="isLeftBehind" label="是否留守儿童" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="isDisabled" label="是否残疾" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="isSingleParent" label="是否单亲家庭" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="isKeyConcern" label="是否重点关注" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="canView" label="查看权限" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item name="canEdit" label="编辑权限" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </div>

          <div className="student-form-actions">
            <Button onClick={() => navigate('/students')}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default StudentForm;
