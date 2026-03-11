import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Form, Input, Select, Space, Switch, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { createStudentApi, getStudentDetailApi, updateStudentApi, type CreateStudentParams, type StudentProfile } from '@/services/student';
import './StudentManagement.css';

const { Title } = Typography;

type PovertyLevel = '非困难' | '一般困难' | '困难' | '特别困难';
type HouseholdType = '城镇' | '农村';

interface FormValues {
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
const householdTypes: HouseholdType[] = ['城镇', '农村'];

const StudentForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      void loadStudentData();
    } else {
      // 新增时设置默认值
      form.setFieldsValue({
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
    }
  }, [id, isEdit]);

  const loadStudentData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await getStudentDetailApi(id);
      form.setFieldsValue({
        studentNo: data.studentNo,
        name: data.name,
        username: data.username,
        grade: data.grade,
        class: data.class,
        guardian: data.guardian,
        povertyLevel: data.povertyLevel,
        isSponsored: data.isSponsored,
        householdType: data.householdType,
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit && id) {
        await updateStudentApi(id, values);
        messageApi.success('学生信息已更新');
      } else {
        await createStudentApi(values as CreateStudentParams);
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
    <div className="student-form-page">
      {contextHolder}

      <div className="student-form-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEdit ? '编辑学生信息' : '新增学生'}
          </Title>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={handleSubmit}>
          保存
        </Button>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical" style={{ maxWidth: 1200 }}>
          <Title level={5}>基本信息</Title>
          <div className="student-form-grid">
            <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
              <Input placeholder="请输入学号" />
            </Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input placeholder="请输入账号" />
            </Form.Item>
            {!isEdit && (
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}
            <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
              <Select placeholder="请选择年级" options={grades.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="class" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
              <Select placeholder="请选择班级" options={classes.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="guardian" label="监护人" rules={[{ required: true, message: '请输入监护人' }]}>
              <Input placeholder="请输入监护人姓名" />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input placeholder="请输入邮箱" type="email" />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </div>

          <Title level={5} style={{ marginTop: 24 }}>分类归档信息</Title>
          <div className="student-form-grid">
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
          </div>

          <Title level={5} style={{ marginTop: 24 }}>权限设置</Title>
          <div className="student-form-grid">
            <Form.Item name="canView" label="查看权限" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item name="canEdit" label="编辑权限" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default StudentForm;
