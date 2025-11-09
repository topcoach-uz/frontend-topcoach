import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './B2BLayout.scss';

const { Sider, Content } = Layout;

interface B2BLayoutProps {
  children: React.ReactNode;
}

const B2BLayout: React.FC<B2BLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        // In mobile mode, always keep sidebar closed
        setCollapsed(true);
        setMobileSidebarOpen(false);
      } else {
        // When switching to desktop, reset mobile states
        setMobileSidebarOpen(false);
      }
    };

    // Set initial mobile state
    const initialMobile = window.innerWidth <= 768;
    setIsMobile(initialMobile);
    if (initialMobile) {
      setCollapsed(true);
      setMobileSidebarOpen(false);
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    // Close mobile sidebar after navigation
    if (isMobile) {
      setMobileSidebarOpen(false);
      setCollapsed(true);
    }
  };

  const handleToggle = () => {
    if (isMobile) {
      // In mobile, toggle the mobile sidebar state
      setMobileSidebarOpen(!mobileSidebarOpen);
      setCollapsed(!mobileSidebarOpen);
    } else {
      // In desktop, toggle normally
      setCollapsed(!collapsed);
    }
  };

  return (
    <Layout className="b2b-layout">
      {/* Mobile menu button - only show when sidebar is closed */}
      {isMobile && !mobileSidebarOpen && (
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={handleToggle}
          className="mobile-menu-button"
        />
      )}

      {/* Mobile overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => {
            setMobileSidebarOpen(false);
            setCollapsed(true);
          }}
        />
      )}

      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className={`b2b-sider ${collapsed ? 'ant-layout-sider-collapsed' : ''} ${isMobile && mobileSidebarOpen ? 'mobile-open' : ''}`}
        width={260}
      >
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-title">Tracking Portal</div>
          )}
          {!isMobile && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={handleToggle}
            >
              <MenuOutlined />
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => {
                setMobileSidebarOpen(false);
                setCollapsed(true);
              }}
            >
              <CloseOutlined />
            </button>
          )}
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

