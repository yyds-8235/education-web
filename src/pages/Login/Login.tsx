﻿import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import './Login.css';

const { Title, Text } = Typography;

const demoAccounts = [
  { label: '教务处账号', username: 'admin', password: '123456' },
  { label: '教师账号', username: 'teacher01', password: '123456' },
  { label: '学生账号', username: 'student01', password: '123456' },
];

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await dispatch(login(values)).unwrap();
      message.success('登录成功');
      navigate('/', { replace: true });
    } catch (error) {
      const err = error as Error;
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
  };

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size={8} className="login-title-wrap">
          <Title level={3} className="login-title">
            教学平台登录
          </Title>
          <Text type="secondary">支持教务处、教师端与学生端演示，默认密码均为 123456。</Text>
        </Space>

        <Alert
          className="login-alert"
          type="info"
          showIcon
          message="演示账号"
          description="admin / 123456（教务处），teacher01 / 123456（教师），student01 / 123456（学生）"
        />

        <Space wrap className="login-demo-buttons">
          {demoAccounts.map((item) => (
            <Button
              key={item.label}
              onClick={() => handleFillDemo(item.username, item.password)}
              size="small"
            >
              填入{item.label}
            </Button>
          ))}
        </Space>

        <Form
          form={form}
          className="login-form"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{ username: 'teacher01', password: '123456' }}
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
