import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
    BookOutlined,
    VideoCameraOutlined,
    FileTextOutlined,
    CalendarOutlined,
    TeamOutlined,
    BarChartOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import type { UserRole } from '@/types';
import './Sidebar.css';

const { Sider } = Layout;

interface MenuItem {
    key: string;
    icon: React.ReactNode;
    label: string;
    roles?: UserRole[];
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        key: '/courses',
        icon: <BookOutlined />,
        label: '课程管理',
        roles: ['teacher', 'student'],
    },
    {
        key: '/classroom',
        icon: <VideoCameraOutlined />,
        label: '授课管理',
        roles: ['teacher', 'student'],
    },
    {
        key: '/tests',
        icon: <FileTextOutlined />,
        label: '测试管理',
        roles: ['teacher', 'student'],
    },
    {
        key: '/schedule',
        icon: <CalendarOutlined />,
        label: '课程表',
        roles: ['admin'],
    },
    {
        key: '/attendance',
        icon: <TeamOutlined />,
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
        key: '/students',
        icon: <TeamOutlined />,
        label: '学生管理',
        roles: ['admin'],
    },
    {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '系统设置',
        roles: ['admin'],
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

    const filteredMenuItems = menuItems.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key);
    };

    const getSelectedKeys = () => {
        const path = location.pathname;
        const matchedKey = filteredMenuItems.find((item) => path.startsWith(item.key))?.key;
        return [matchedKey || path];
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            className="sidebar"
            width={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'))}
            collapsedWidth={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-collapsed-width'))}
        >
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {collapsed ? (
                        <span className="logo-icon">智</span>
                    ) : (
                        <span className="logo-text">智慧教学平台</span>
                    )}
                </div>
            </div>
            <Menu
                mode="inline"
                selectedKeys={getSelectedKeys()}
                items={filteredMenuItems.map((item) => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                }))}
                onClick={handleMenuClick}
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
