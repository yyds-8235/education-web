import React, { useState } from 'react';
import { Form, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { Button, Input } from '@/components/Atoms';
import './Login.css';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            await dispatch(login(values)).unwrap();
            message.success('登录成功');
            navigate('/');
        } catch {
            message.error('登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1 className="login-title">智慧教学平台</h1>
                    <p className="login-subtitle">Smart Teaching Platform</p>
                </div>

                <Form
                    className="login-form"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="用户名"
                            fullWidth
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="密码"
                            fullWidth
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            fullWidth
                            size="large"
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>

                <div className="login-footer">
                    <p>© 2024 智慧教学平台 All Rights Reserved</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
