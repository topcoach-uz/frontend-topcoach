import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import FontAwesomeIcon from '../common/icons/FontAwesomeIcon';
import LoginPrompt from 'src/components/student-hub/LoginPrompt';
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

  // FontAwesome icon components - color controlled by CSS
  const DashboardIcon = () => <FontAwesomeIcon icon="tachometer-alt" className="menu-icon" />;
  const UserIcon = () => <FontAwesomeIcon icon="user" className="menu-icon" />;
  const BuildingIcon = () => <FontAwesomeIcon icon="building" className="menu-icon" />;
  const EditIcon = () => <FontAwesomeIcon icon="pen" className="menu-icon" />;
  const FileIcon = () => <FontAwesomeIcon icon="file" className="menu-icon" />;
  const BellIcon = () => <FontAwesomeIcon icon="bell" className="menu-icon" />;
  const MenuIcon = () => <FontAwesomeIcon icon="bars" className="menu-icon" />;
  const BookIcon = () => <FontAwesomeIcon icon="book" className="menu-icon" />;

  // Navigation items
  const menuItems = [
    {
      key: '/student-hub',
      icon: <DashboardIcon />,
      label: t('Dashboard'),
    },
    {
      key: '/student-hub/profile',
      icon: <UserIcon />,
      label: t('My Profile'),
    },
    {
      key: '/student-hub/applications',
      icon: <BuildingIcon />,
      label: t('Applications'),
    },
    {
      key: '/student-hub/essays',
      icon: <EditIcon />,
      label: t('Essays'),
    },
    {
      key: '/student-hub/documents',
      icon: <FileIcon />,
      label: t('Documents'),
    },
    // TODO: Implement notifications page later
    // {
    //   key: '/student-hub/notifications',
    //   icon: <BellIcon />,
    //   label: t('Notifications'),
    // },
  ];


  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileDrawerVisible(false);
  };


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
              <h1 className="mobile-title">Student Hub</h1>
            </div>
          </Header>
        )}

        {/* Desktop Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="desktop-sidebar"
          width={300}
          collapsedWidth={80}
          trigger={null}
        >
          <div className="sidebar-header">
            {!collapsed && (
              <div className="logo">
                <span className="logo-text">Student Hub</span>
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
              {menuItems.map((item) => (
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
              items={menuItems}
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
          width={300}
          closable={false}
        >
          <div className="mobile-drawer-header">
            <span className="mobile-drawer-title">Student Hub</span>
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
            items={menuItems}
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
            <h1 className="mobile-title">Student Hub</h1>
          </div>
        </Header>
      )}

      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="desktop-sidebar"
        width={300}
        collapsedWidth={80}
        trigger={null}
      >
        <div className="sidebar-header">
          {!collapsed && (
            <div className="logo">
              <span className="logo-text">Student Hub</span>
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
            {menuItems.map((item) => (
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
            items={menuItems}
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
        width={300}
        closable={false}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-title">Student Hub</span>
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
          items={menuItems}
          onClick={handleMenuClick}
          className="mobile-menu"
        />
      </Drawer>

      <Layout className="main-layout">
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentHubLayout;