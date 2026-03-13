﻿import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import loginBackground from '@/static/login.png';
import './Login.css';

const { Paragraph, Text, Title } = Typography;

const demoAccounts = [
  { label: '教师账号', username: 'tch0001', password: '123456', description: '用于课程、测试与批改管理' },
  { label: '学生账号', username: 'stu10024', password: '123456', description: '用于学习、测试与成绩查询' },
];

const featureList = [
  '统一支持教师端与学生端登录',
  '覆盖课程、测试、考勤与学情查看',
  '与管理员后台形成完整教务闭环',
];

interface LoginFormValues {
  username: string;
  password: string;
}

const Login = () => {
  const [form] = Form.useForm<LoginFormValues>();
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

  const handleSubmit = async (values: LoginFormValues) => {
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

      <div className="login-layout">
        <section className="login-showcase" style={{ backgroundImage: `url(${loginBackground})` }}>
          <div className="login-showcase-mask" />
          <div className="login-showcase-content">
            <div className="login-showcase-main">
              <div className="login-showcase-copy">
                <Text className="login-showcase-kicker">Education Learning Portal</Text>
                <Title className="login-showcase-title">教与学一体化登录入口</Title>
                <Paragraph className="login-showcase-description">
                  面向教师与学生的统一入口，连接课程学习、测试作答、学情追踪与教学管理场景。
                </Paragraph>

                <div className="login-feature-list">
                  {featureList.map((item) => (
                    <div key={item} className="login-feature-item">
                      <span className="login-feature-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="login-demo-panel">
                  <Text className="login-demo-title">快速体验</Text>
                  <div className="login-demo-grid">
                    {demoAccounts.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="login-demo-card"
                        onClick={() => handleFillDemo(item.username, item.password)}
                      >
                        <div className="login-demo-card-head">
                          <span>{item.label}</span>
                          <RightOutlined />
                        </div>
                        <strong>{item.username}</strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="login-showcase-form-wrap">
                <Card className="login-card" bordered={false}>
                  <div className="login-card-head">
                    <Text className="login-card-kicker">Welcome Back</Text>
                    <Title level={2} className="login-card-title">
                      账号登录
                    </Title>
                    <Paragraph className="login-card-subtitle">
                      请输入教师或学生账号与密码登录系统。
                    </Paragraph>
                  </div>

                  <Form<LoginFormValues>
                    form={form}
                    className="login-form"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    size="large"
                    initialValues={{ username: 'tch0001', password: '123456' }}
                  >
                    <Form.Item
                      label={<span className="login-field-label">登录账号</span>}
                      name="username"
                      rules={[{ required: true, message: '请输入账号' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="请输入教师或学生账号" className="login-input" />
                    </Form.Item>

                    <Form.Item
                      label={<span className="login-field-label">登录密码</span>}
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入登录密码" className="login-input" />
                    </Form.Item>

                    <div className="login-account-hint">
                      <Text type="secondary">教师账号通常以 `tch` 开头，学生账号通常以 `stu` 开头。</Text>
                    </div>

                    <Form.Item className="login-submit-wrap">
                      <Button type="primary" htmlType="submit" loading={loading} block className="login-submit-button">
                        登录系统
                      </Button>
                    </Form.Item>
                  </Form>

                  <div className="login-footer">
                    <Text type="secondary">需要进入教务后台？</Text>
                    <Link to="/admin-login" className="login-admin-link">
                      前往管理员登录
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
