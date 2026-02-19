import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useOrganization } from '../context/OrganizationContext';
import './SchoolCounselorLayout.scss';

const { Sider, Content } = Layout;

interface SchoolCounselorLayoutProps {
  children: React.ReactNode;
}

const SchoolCounselorLayout: React.FC<SchoolCounselorLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedOrganizationId, 
    setSelectedOrganizationId, 
    organizations, 
    counselorOrganizations,
    loading: orgsLoading,
    isSuperAdmin,
    isCounselor,
    counselorOrganizationId 
  } = useOrganization();

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
      key: '/school-counselor',
      icon: <DashboardOutlined />,
      label: t('schoolCounselor.menu.dashboard', 'Dashboard'),
    },
    {
      key: '/school-counselor/students',
      icon: <TeamOutlined />,
      label: t('schoolCounselor.menu.students', 'Students'),
    },
    // Courses - hidden for now
    // {
    //   key: '/school-counselor/courses',
    //   icon: <BookOutlined />,
    //   label: 'Courses',
    // },
    {
      key: '/school-counselor/analytics',
      icon: <BarChartOutlined />,
      label: t('schoolCounselor.menu.analytics', 'Analytics'),
    },
    {
      key: '/school-counselor/settings',
      icon: <SettingOutlined />,
      label: t('schoolCounselor.menu.settings', 'Settings'),
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
    <Layout className="school-counselor-layout">
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
        className={`school-counselor-sider ${collapsed ? 'ant-layout-sider-collapsed' : ''} ${isMobile && mobileSidebarOpen ? 'mobile-open' : ''}`}
        width={260}
      >
        <div className="sidebar-header">
          {!collapsed && (
            <>
              {isSuperAdmin && selectedOrganizationId && (
                <div className="organization-name">
                  {organizations.find((org) => org.id === selectedOrganizationId)?.name || ''}
                </div>
              )}
              {isCounselor && counselorOrganizationId && (
                <div className="organization-name">
                  {counselorOrganizations.find((org) => org.id === counselorOrganizationId)?.name || ''}
                </div>
              )}
            </>
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
            className="school-counselor-menu"
          />
        </div>
      </Sider>
      <Layout className={`main-layout ${collapsed ? 'collapsed' : ''}`}>
        <Content className="school-counselor-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SchoolCounselorLayout;

