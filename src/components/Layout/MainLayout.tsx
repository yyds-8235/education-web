import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';
import './MainLayout.css';

const { Content } = Layout;

const MainLayout = () => {
    const { sidebarCollapsed } = useAppSelector((state) => state.ui);

    return (
        <Layout className="main-layout">
            <Sidebar collapsed={sidebarCollapsed} />
            <Layout
                className="main-layout-content-wrapper"
                style={{
                    marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                    transition: 'margin-left var(--transition-base)',
                }}
            >
                <Header />
                <Content className="main-layout-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
