import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme, type MenuProps } from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  AuditOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { UserRole } from '@easyhotel/shared';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './index.module.css';

const { Header, Sider, Content } = Layout;

const merchantMenuItems: MenuProps['items'] = [
  {
    key: '/merchant/hotels',
    icon: <HomeOutlined />,
    label: '我的酒店',
  },
  {
    key: '/merchant/hotels/create',
    icon: <PlusOutlined />,
    label: '新增酒店',
  },
];

const adminMenuItems: MenuProps['items'] = [
  {
    key: '/admin/reviews',
    icon: <AuditOutlined />,
    label: '审核管理',
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = user?.role === UserRole.ADMIN ? adminMenuItems : merchantMenuItems;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 计算当前选中的菜单项
  const selectedKeys = [location.pathname];

  return (
    <Layout className={styles.layout}>
      <Sider trigger={null} collapsible collapsed={collapsed} className={styles.sider}>
        <div className={styles.logo}>
          {collapsed ? 'EH' : 'EasyHotel'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header className={styles.header} style={{ background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.trigger}
          />
          <div className={styles.headerRight}>
            <span className={styles.username}>{user?.username}</span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </div>
        </Header>
        <Content
          className={styles.content}
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
