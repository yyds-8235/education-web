import { useNavigate } from 'react-router-dom';
import { Dropdown, Avatar, Space } from 'antd';
import {
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import type { MenuProps } from 'antd';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人中心',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '账号设置',
            onClick: () => navigate('/settings'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
            danger: true,
        },
    ];

    const getRoleName = () => {
        switch (user?.role) {
            case 'teacher':
                return '教师';
            case 'student':
                return '学生';
            case 'admin':
                return '管理员';
            default:
                return '';
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="breadcrumb">
                    <span>首页</span>
                </div>
            </div>
            <div className="header-right">
                <Space size="middle">
                    <button className="header-icon-btn" aria-label="帮助">
                        <QuestionCircleOutlined />
                    </button>
                    <button className="header-icon-btn" aria-label="通知">
                        <BellOutlined />
                        <span className="notification-badge" />
                    </button>
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                        <div className="header-user">
                            <Avatar
                                size={36}
                                src={user?.avatar}
                                icon={!user?.avatar && <UserOutlined />}
                                className="user-avatar"
                            />
                            <div className="user-info">
                                <span className="user-name">{user?.realName || user?.username}</span>
                                <span className="user-role">{getRoleName()}</span>
                            </div>
                        </div>
                    </Dropdown>
                </Space>
            </div>
        </header>
    );
};

export default Header;
