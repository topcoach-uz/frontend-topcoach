import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './B2BLayout.scss';

const { Sider, Content } = Layout;

interface B2BLayoutProps {
  children: React.ReactNode;
}

const B2BLayout: React.FC<B2BLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    {
      key: '/b2b',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/b2b/students',
      icon: <TeamOutlined />,
      label: 'Students',
    },
    {
      key: '/b2b/courses',
      icon: <BookOutlined />,
      label: 'Courses',
    },
    {
      key: '/b2b/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/b2b/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout className="b2b-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className={`b2b-sider ${collapsed ? 'ant-layout-sider-collapsed' : ''}`}
        width={260}
      >
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-title">Tracking Portal</div>
          )}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            <MenuOutlined />
          </button>
        </div>
        <div className="sidebar-content">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="b2b-menu"
          />
        </div>
      </Sider>
      <Layout className={`main-layout ${collapsed ? 'collapsed' : ''}`}>
        <Content className="b2b-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default B2BLayout;

