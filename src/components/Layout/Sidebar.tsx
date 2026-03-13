﻿﻿﻿import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import type { UserRole } from '@/types';
import './Sidebar.css';

const { Sider } = Layout;

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '首页',
    roles: ['teacher', 'student', 'admin'],
  },
  {
    key: '/courses',
    icon: <BookOutlined />,
    label: '课程系统',
    roles: ['teacher', 'student'],
  },
  {
    key: '/students',
    icon: <TeamOutlined />,
    label: '学生管理',
    roles: ['teacher', 'admin'],
  },
  {
    key: '/schedule',
    icon: <CalendarOutlined />,
    label: '课程表管理',
    roles: ['admin'],
  },
  {
    key: '/attendance',
    icon: <AuditOutlined />,
    label: '考勤管理',
    roles: ['admin'],
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: '数据分析',
    roles: ['admin'],
  },
  {
    key: '/classroom',
    icon: <VideoCameraOutlined />,
    label: '授课系统',
    roles: ['teacher', 'student'],
  },
  {
    key: '/tests',
    icon: <ExperimentOutlined />,
    label: '测试系统',
    roles: ['teacher', 'student'],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const visibleMenus = menuItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  const selected =
    visibleMenus.find((item) => {
      if (item.key === '/') {
        return location.pathname === '/';
      }

      return location.pathname.startsWith(item.key);
    })?.key ?? '/';

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="sidebar"
      width={240}
      collapsedWidth={80}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {collapsed ? <span className="logo-icon">教</span> : <span className="logo-text">教学平台</span>}
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selected]}
        items={visibleMenus.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
        }))}
        onClick={({ key }) => navigate(key)}
        className="sidebar-menu"
      />

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
    </Sider>
  );
};

export default Sidebar;
