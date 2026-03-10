import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import loginBackground from '@/static/login.png';
import './Login.css';

const { Paragraph, Text, Title } = Typography;

const demoAccounts = [
  { label: '教务处账号', username: 'admin', password: '123456' },
  { label: '教师账号', username: 'tch0001', password: '123456' },
  { label: '学生账号', username: 'stu10001', password: '123456' },
];

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await dispatch(login(values)).unwrap();
      messageApi.success('登录成功');
      navigate('/', { replace: true });
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
  };

  return (
    <div className="login-page">
      {contextHolder}
      <div className="login-shell">
        <section className="login-hero-panel" style={{
          backgroundImage: `url(${loginBackground})`,
          // 以下是新增属性：
          backgroundSize: 'cover',      // 核心：撑满并覆盖
          }}>
          <div className="login-hero-backdrop" />
          <div className="login-hero-content">
          <div className="login-hero-badge">Education Management System</div>
          <Title className="login-hero-title">
            智慧教学平台
          </Title>
          <Paragraph className="login-hero-description">
            极简白灰基底、专业字体与皇家蓝主按钮，适配教务处、教师端与学生端的统一登录体验。
          </Paragraph>
          </div>
        </section>

        <Card className="login-card" bordered={false}>
          <div className="login-card-head">
            <Text className="login-card-kicker">Welcome Back</Text>
            <Title level={2} className="login-title">
              账号登录
            </Title>
            <Paragraph className="login-subtitle">
              请输入 username 和 password 进入系统。
            </Paragraph>
          </div>

          <div className="login-demo-buttons">
            {demoAccounts.map((item) => (
              <button
                key={item.label}
                type="button"
                className="login-demo-chip"
                onClick={() => handleFillDemo(item.username, item.password)}
              >
                <span>{item.label}</span>
                <small>{item.username}</small>
              </button>
            ))}
          </div>

          <Form
            form={form}
            className="login-form"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            initialValues={{ username: 'teacher01', password: '123456' }}
          >
            <Form.Item
              label={<span className="login-field-label">Username</span>}
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入 username" className="login-input" />
            </Form.Item>

            <Form.Item
              label={<span className="login-field-label">Password</span>}
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入 password" className="login-input" />
            </Form.Item>

            <Form.Item className="login-submit-wrap">
              <Button type="primary" htmlType="submit" loading={loading} block className="login-submit-button">
                登录系统
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer-note">
            <span className="login-note-dot" />
            <Text type="secondary">教育成就未来</Text>
          </div>

          <Link to="/admin-login" className="login-admin-link">
            前往教务处管理员专属登录
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Login;
