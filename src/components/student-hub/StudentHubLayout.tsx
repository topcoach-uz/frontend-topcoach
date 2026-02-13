import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Spin } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import FontAwesomeIcon from '../common/icons/FontAwesomeIcon';
import UnifiedIcon from '../common/icons/UnifiedIcon';
import LoginPrompt from 'src/components/student-hub/LoginPrompt';
import { useStudentHub } from 'src/hooks/useStudentHub';
import './StudentHubLayout.scss';

const { Header, Sider, Content } = Layout;

interface StudentHubLayoutProps {
  children: React.ReactNode;
}

const StudentHubLayout: React.FC<StudentHubLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  
  // Get loading state from useStudentHub hook
  const { isLoading } = useStudentHub();

  // Track window width changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show mobile header on smaller screens (mobile/tablet) where sidebar is hidden
  const shouldShowMobileHeader = windowWidth < 1200;

  // Menu icon for toggle
  const MenuIcon = () => <FontAwesomeIcon icon="bars" className="menu-icon" />;

  // Compact Navigation Structure (Phase 2 - SaaS Optimized)
  // Reduced from 11 items to 6 core items
  const menuItems = [
    { key: '/student-hub', icon: <UnifiedIcon name="dashboard" size="md" color="primary" />, label: t('Dashboard') },
    { key: '/student-hub/applications', icon: <UnifiedIcon name="applications" size="md" color="primary" />, label: t('studentHub.nav.collegeLists') },
    { key: '/student-hub/psychometric-assessment', icon: <UnifiedIcon name="activity" size="md" color="primary" />, label: 'Major Match' },
    { key: '/student-hub/opportunities', icon: <UnifiedIcon name="opportunities" size="md" color="primary" />, label: 'Opportunities' },
    { key: '/student-hub/essays', icon: <UnifiedIcon name="essays" size="md" color="primary" />, label: t('Essays') },
    { key: '/student-hub/documents', icon: <UnifiedIcon name="documents" size="md" color="primary" />, label: t('Documents') },
    { key: '/student-hub/profile', icon: <UnifiedIcon name="profile" size="md" color="primary" />, label: t('My Profile') },
  ];


  const handleMenuClick = ({ key }: { key: string }) => {
    // Handle both regular items and submenu items
    if (key && !key.startsWith('sub-')) {
      navigate(key);
      setMobileDrawerVisible(false);
    }
  };

  // Format menu items for Ant Design Menu (simple flat structure)
  const formattedMenuItems = React.useMemo(() => {
    return menuItems.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));
  }, []);


  const getSelectedKeys = () => {
    const path = location.pathname;
    return [path];
  };

  // If user is not authenticated, show login prompt with sidebar
  if (!isAuthenticated) {
    return (
      <Layout className="student-hub-layout">
        {/* Mobile Header - Only show on very large screens */}
        {shouldShowMobileHeader && (
          <Header className="mobile-header">
            <div className="mobile-header-content">
              <Button
                type="text"
                icon={<MenuIcon />}
                onClick={() => setMobileDrawerVisible(true)}
                className="mobile-menu-trigger"
              />
              <h1 className="mobile-title">My Journey</h1>
            </div>
          </Header>
        )}

        {/* Desktop Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="desktop-sidebar"
          width={240}
          collapsedWidth={80}
          trigger={null}
        >
          <div className="sidebar-header">
            {!collapsed && (
              <div className="logo">
                <span className="logo-text">My Journey</span>
              </div>
            )}
            <Button
              type="text"
              icon={<MenuIcon />}
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-toggle"
            />
          </div>

          {collapsed ? (
            <div className="collapsed-menu">
              {formattedMenuItems.map((item) => (
                <div
                  key={item.key}
                  className={`collapsed-menu-item ${getSelectedKeys().includes(item.key) ? 'selected' : ''}`}
                  onClick={() => handleMenuClick({ key: item.key })}
                  title={item.label}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={getSelectedKeys()}
              items={formattedMenuItems}
              onClick={handleMenuClick}
              className="sidebar-menu"
            />
          )}
        </Sider>

        {/* Mobile Drawer */}
        <Drawer
          title={null}
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          className="mobile-drawer"
          width={240}
          closable={false}
        >
          <div className="mobile-drawer-header">
            <span className="mobile-drawer-title">My Journey</span>
            <Button
              type="text"
              icon={<FontAwesomeIcon icon="times" />}
              onClick={() => setMobileDrawerVisible(false)}
              className="mobile-drawer-close"
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={formattedMenuItems}
            onClick={handleMenuClick}
            className="mobile-menu"
          />
        </Drawer>

        <Layout className="main-layout">
          <Content className="main-content">
            <LoginPrompt />
          </Content>
        </Layout>
      </Layout>
    );
  }

  // If user is authenticated, show normal student hub content
  return (
    <Layout className="student-hub-layout">
      {/* Mobile Header - Only show on very large screens */}
      {shouldShowMobileHeader && (
        <Header className="mobile-header">
          <div className="mobile-header-content">
            <Button
              type="text"
              icon={<MenuIcon />}
              onClick={() => setMobileDrawerVisible(true)}
              className="mobile-menu-trigger"
            />
            <h1 className="mobile-title">My Journey</h1>
          </div>
        </Header>
      )}

      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="desktop-sidebar"
        width={240}
        collapsedWidth={64}
        trigger={null}
      >
        <div className="sidebar-header">
          {!collapsed && (
            <div className="logo">
              <span className="logo-text">My Journey</span>
            </div>
          )}
          <Button
            type="text"
            icon={<MenuIcon />}
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-toggle"
          />
        </div>

        {collapsed ? (
          <div className="collapsed-menu">
            {formattedMenuItems.map((item) => (
              <div
                key={item.key}
                className={`collapsed-menu-item ${getSelectedKeys().includes(item.key) ? 'selected' : ''}`}
                onClick={() => handleMenuClick({ key: item.key })}
                title={item.label}
              >
                {item.icon}
              </div>
            ))}
          </div>
        ) : (
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={formattedMenuItems}
            onClick={handleMenuClick}
            className="sidebar-menu"
          />
        )}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title={null}
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        className="mobile-drawer"
          width={240}
        closable={false}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-title">My Journay</span>
          <Button
            type="text"
            icon={<FontAwesomeIcon icon="times" />}
            onClick={() => setMobileDrawerVisible(false)}
            className="mobile-drawer-close"
          />
        </div>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={formattedMenuItems}
            onClick={handleMenuClick}
            className="mobile-menu"
          />
      </Drawer>

      <Layout className="main-layout">
        <Content className="main-content">
          {isLoading && location.pathname === '/student-hub' ? (
            <div className="student-hub-loading-content">
              <div className="loading-spinner-container">
                <Spin size="large" />
                <p>Loading your dashboard...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentHubLayout;