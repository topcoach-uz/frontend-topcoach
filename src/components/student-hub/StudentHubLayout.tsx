import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Button, Drawer, Spin } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import FontAwesomeIcon from '../common/icons/FontAwesomeIcon';
import UnifiedIcon from '../common/icons/UnifiedIcon';
import LoginPrompt from 'src/components/student-hub/LoginPrompt';
import { useStudentHub } from 'src/hooks/useStudentHub';
import CommunityHubMobileDrawerNav from 'src/pages/student-hub/community/CommunityHubMobileDrawerNav';
import StudyGoalsStickyBanner from 'src/components/student-hub/StudyGoalsStickyBanner';
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

  // Fallback Ant sidebar (rarely visible — unified hub hides it on /student-hub).
  const menuItems = useMemo(
    () => [
      { key: '/student-hub', icon: <UnifiedIcon name="dashboard" size="md" color="primary" />, label: t('studentHub.nav.dashboard', 'Dashboard') },
      { key: '/student-hub/full-support', icon: <UnifiedIcon name="full-support" size="md" color="primary" />, label: t('fullSupport.navLabel', 'Full Support') },
      { key: '/student-hub/applications', icon: <UnifiedIcon name="applications" size="md" color="primary" />, label: t('studentHub.nav.collegeLists', 'College Lists') },
      { key: '/student-hub/psychometric-assessment', icon: <UnifiedIcon name="activity" size="md" color="primary" />, label: t('studentHub.psychometric.majorMatch', 'Major Match') },
      { key: '/student-hub/opportunities', icon: <UnifiedIcon name="opportunities" size="md" color="primary" />, label: t('studentHub.nav.opportunities', 'Opportunities') },
      { key: '/student-hub/essays', icon: <UnifiedIcon name="essays" size="md" color="primary" />, label: t('Essays') },
      { key: '/student-hub/documents', icon: <UnifiedIcon name="documents" size="md" color="primary" />, label: t('Documents') },
      { key: '/student-hub/profile', icon: <UnifiedIcon name="profile" size="md" color="primary" />, label: t('My Profile') },
      { key: '/student-hub/settings', icon: <UnifiedIcon name="settings" size="md" color="primary" />, label: t('studentHub.nav.settings', 'Settings') },
    ],
    [t],
  );


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
  }, [menuItems]);


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
              <h1 className="mobile-title">{t('studentHub.nav.myJourney', 'My Journey')}</h1>
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
                <span className="logo-text">{t('studentHub.nav.myJourney', 'My Journey')}</span>
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
              {formattedMenuItems.map((item) => {
                const isSelected = getSelectedKeys().includes(item.key);
                const icon = isSelected && React.isValidElement(item.icon)
                  ? React.cloneElement(item.icon as React.ReactElement<{ color?: string }>, { color: 'white' })
                  : item.icon;
                return (
                  <div
                    key={item.key}
                    className={`collapsed-menu-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMenuClick({ key: item.key })}
                    title={item.label}
                  >
                    {icon}
                  </div>
                );
              })}
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
            <span className="mobile-drawer-title">{t('studentHub.nav.myJourney', 'My Journey')}</span>
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
            <div className="main-content-padded">
              <LoginPrompt />
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  // Unified hub: hide Ant sidebar on all student-hub routes so the in-app hub chrome is used.
  const hubSurfacePaths = [
    '/student-hub',
    '/student-hub/',
    '/student-hub/community',
    '/student-hub/rewards',
    '/student-hub/dashboard',
    '/student-hub/full-support',
    '/student-hub/applications',
    '/student-hub/psychometric-assessment',
    '/student-hub/opportunities',
    '/student-hub/essays',
    '/student-hub/documents',
    '/student-hub/profile',
  ];
  const isCommunityLanding =
    hubSurfacePaths.includes(location.pathname) && location.pathname !== '/student-hub/settings';

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
            <h1 className="mobile-title">{t('studentHub.nav.myJourney', 'My Journey')}</h1>
          </div>
        </Header>
      )}

      {/* Community hub: Ant sidebar hidden; mobile header still needs a drawer with profile + hub nav */}
      {isCommunityLanding && shouldShowMobileHeader && (
        <Drawer
          title={t('studentHub.nav.myJourney', 'My Journey')}
          placement="left"
          closable
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          className="hub-mobile-drawer"
          width={300}
          zIndex={1050}
          styles={{ body: { padding: 0 } }}
        >
          <CommunityHubMobileDrawerNav onNavigate={() => setMobileDrawerVisible(false)} />
        </Drawer>
      )}

      {!isCommunityLanding && (
        <>
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
                  <span className="logo-text">{t('studentHub.nav.myJourney', 'My Journey')}</span>
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
                {formattedMenuItems.map((item) => {
                  const isSelected = getSelectedKeys().includes(item.key);
                  const icon = isSelected && React.isValidElement(item.icon)
                    ? React.cloneElement(item.icon as React.ReactElement<{ color?: string }>, { color: 'white' })
                    : item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`collapsed-menu-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleMenuClick({ key: item.key })}
                      title={item.label}
                    >
                      {icon}
                    </div>
                  );
                })}
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
              <span className="mobile-drawer-title">{t('studentHub.nav.myJourney', 'My Journey')}</span>
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
        </>
      )}

      <Layout className="main-layout">
        <Content className="main-content">
          <StudyGoalsStickyBanner />
          <div className="main-content-padded">
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
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentHubLayout;