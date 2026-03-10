import { useEffect, useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import {
  ArrowLeftOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, logout } from '@/store/slices/authSlice';
import loginBackground from '@/static/login.png';
import './AdminLogin.css';

const { Paragraph, Text, Title } = Typography;

const adminModules = [
  '学籍与人员档案',
  '课程与课表编排',
  '考勤与异常治理',
  '教学质量分析',
];

const securityNotes = [
  '仅允许教务处管理员进入该入口',
  '支持统一账号密码认证接入',
  '后续可扩展验证码与双因子验证',
];


const AdminLogin = () => {
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
      const response = await dispatch(login(values)).unwrap();

      if (response.user.role !== 'admin') {
        dispatch(logout());
        messageApi.error('该入口仅支持教务处管理员登录');
        return;
      }

      messageApi.success('教务处登录成功');
      navigate('/', { replace: true });
    } catch (error) {
      const err = error as Error;
      messageApi.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminAccount = () => {
    form.setFieldsValue({ username: 'admin', password: '123456' });
  };

  return (
    <div className="admin-login-page">
      {contextHolder}

      <div className="admin-login-layout">
        <aside className="admin-login-sidebar">
          <div className="admin-login-brand">
            <div className="admin-login-brand-mark">教务</div>
            <div>
              <Text className="admin-login-brand-kicker">Administration Portal</Text>
              <Title level={2} className="admin-login-brand-title">
                教务处管理员登录
              </Title>
            </div>
          </div>

          <Paragraph className="admin-login-intro">
            面向教务处后台的教育管理系统入口，用于统一处理人员、排课、考勤、教学运行与统计分析。
          </Paragraph>

          <div className="admin-login-security-panel">
            <div className="admin-login-security-head">
              <SafetyCertificateOutlined />
              <span>访问控制说明</span>
            </div>
            <ul className="admin-login-security-list">
              {securityNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <button type="button" className="admin-login-fill" onClick={fillAdminAccount}>
            填入管理员演示账号
          </button>

          <Form
            form={form}
            className="admin-login-form"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            initialValues={{ username: 'admin', password: '123456' }}
          >
            <Form.Item
              label={<span className="admin-login-label">登录账号</span>}
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入管理员账号" className="admin-login-input" />
            </Form.Item>

            <Form.Item
              label={<span className="admin-login-label">登录密码</span>}
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入管理员密码" className="admin-login-input" />
            </Form.Item>

            <Form.Item className="admin-login-submit-wrap">
              <Button type="primary" htmlType="submit" loading={loading} block className="admin-login-submit">
                进入管理控制台
              </Button>
            </Form.Item>
          </Form>

          <Link to="/login" className="admin-login-back-link">
            <ArrowLeftOutlined />
            返回通用登录页
          </Link>
        </aside>

        <section className="admin-login-console">
          <header className="admin-console-header">
            <Text className="admin-console-kicker">Education Governance Console</Text>
            <Title className="admin-console-title">
              教育管理指挥台
              <br />
              专属后台入口
            </Title>
          </header>

          <div className="admin-console-preview" style={{ backgroundImage: `url(${loginBackground})` }}>
            <div className="admin-console-preview-mask" />
            <div className="admin-console-preview-content">
              <span className="admin-console-preview-badge">教务处综合业务视图</span>
              <strong>统一配置学年、学段、学科与组织结构</strong>
              <p>聚合人员、课表、考勤、异常与统计模块，形成教育管理系统的核心后台入口。</p>
            </div>
          </div>

          <div className="admin-console-panels">
            <div className="admin-console-card admin-console-card-wide">
              <span className="admin-console-card-title">核心模块</span>
              <div className="admin-console-module-grid">
                {adminModules.map((moduleName) => (
                  <div key={moduleName} className="admin-console-module-item">
                    {moduleName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLogin;
