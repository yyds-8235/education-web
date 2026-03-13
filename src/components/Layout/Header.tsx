﻿﻿﻿import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Menu, Space, Tag } from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  IdcardOutlined,
  LogoutOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import type { UserRole } from '@/types';
import './Header.css';

interface TopMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
  children?: Array<{
    key: string;
    label: string;
    icon?: ReactNode;
  }>;
}

const topMenus: TopMenuItem[] = [
  {
    key: '/',
    label: '首页',
    icon: <DashboardOutlined />,
    roles: ['teacher', 'student', 'admin'],
  },
  {
    key: '/personnel/teachers',
    label: '教师管理',
    icon: <IdcardOutlined />,
    roles: ['admin'],
  },
  {
    key: '/courses',
    label: '课程系统',
    icon: <BookOutlined />,
    roles: ['teacher', 'student'],
  },
  {
    key: '/students',
    label: '学生管理',
    icon: <UserOutlined />,
    roles: ['admin'],
  },
  {
    key: '/schedule',
    label: '课程表管理',
    icon: <CalendarOutlined />,
    roles: ['admin'],
  },
  {
    key: '/attendance',
    label: '考勤管理',
    icon: <AuditOutlined />,
    roles: ['admin'],
  },
  {
    key: '/analytics',
    label: '数据分析',
    icon: <BarChartOutlined />,
    roles: ['admin'],
  },
  {
    key: '/classroom',
    label: '授课系统',
    icon: <VideoCameraOutlined />,
    roles: ['teacher', 'student'],
  },
  {
    key: '/tests',
    label: '测试系统',
    icon: <ExperimentOutlined />,
    roles: ['teacher', 'student'],
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const roleLabel =
    user?.role === 'teacher'
      ? '教师端'
      : user?.role === 'student'
        ? '学生端'
        : user?.role === 'admin'
          ? '教务处'
          : '未登录';

  const roleTagColor =
    user?.role === 'teacher' ? 'blue' : user?.role === 'student' ? 'green' : 'gold';

  const visibleMenus = topMenus.filter((menu) => (user ? menu.roles.includes(user.role) : false));

  const selectedMenu =
    visibleMenus.find((menu) => {
      if (menu.key === '/') {
        return location.pathname === '/';
      }

      if (menu.children?.some((child) => location.pathname.startsWith(child.key))) {
        return true;
      }

      return location.pathname.startsWith(menu.key);
    })?.children?.find((child) => location.pathname.startsWith(child.key))?.key
      ?? visibleMenus.find((menu) => {
        if (menu.key === '/') {
          return location.pathname === '/';
        }

        return location.pathname.startsWith(menu.key);
      })?.key
      ?? '/';

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        dispatch(logout());
        navigate('/login');
      },
      danger: true,
    },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="platform-title">智能教学平台</div>
        </div>

        <div className="header-nav">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedMenu]}
            items={visibleMenus.map((menu) => ({
              key: menu.key,
              icon: menu.icon,
              label: menu.label,
              children: menu.children,
            }))}
            onClick={({ key }) => navigate(key)}
            className="top-nav-menu"
          />
        </div>

        <div className="header-account">
          <Space size="middle">
            <Tag color={roleTagColor}>{roleLabel}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="header-user">
                <Avatar
                  size={36}
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  className="user-avatar"
                />
                <div className="user-info">
                  <span className="user-name">{user?.realName ?? user?.username}</span>
                  <span className="user-role">{user?.username}</span>
                </div>
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>
    </header>
  );
};

export default Header;
