import { Navigate, Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';
import './MainLayout.css';

const { Content } = Layout;

const MainLayout = () => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout className="main-layout">
            <Layout className="main-layout-content-wrapper">
                <Header />
                <Content className="main-layout-content">
                    <div className="main-layout-inner">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
