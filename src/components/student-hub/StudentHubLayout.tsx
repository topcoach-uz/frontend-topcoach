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
import { isApplicantWorkspacePath } from 'src/lib/applicantWorkspace';
import ApplicantShell from 'src/pages/student-hub/applicant/ApplicantShell';

const { Header, Sider, Content } = Layout;

interface StudentHubLayoutProps {
  children: React.ReactNode;
}

const StudentHubLayout: React.FC<StudentHubLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/student-hub/ielts-prep')) return <>{children}</>;
  // Keep the legacy hooks out of the read-only overview: useStudentHub's
  // dashboard request bootstraps missing student profiles on the server.
  return isApplicantWorkspacePath(pathname)
    ? <ApplicantShell>{children}</ApplicantShell>
    : <LegacyStudentHubLayout>{children}</LegacyStudentHubLayout>;
};

const LegacyStudentHubLayout: React.FC<StudentHubLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  // Get loading state from useStudentHub hook
  const { isLoading } = useStudentHub();
  // Both Major Match nudges are gone from this layout — the auto-opening modal
  // and the sticky banner. Major Match is reachable from the sidebar, the
  // dashboard hero and the profile card, none of which interrupt the page.
  // Removing the nudges also drops useMajorMatchPromptState() from a component
  // that never unmounts, which is what drove the documented refetch storm.

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
      { key: '/student-hub?section=others&target=profile&tab=college-lists', icon: <UnifiedIcon name="applications" size="md" color="primary" />, label: t('studentHub.nav.applications', 'Applications') },
      { key: '/student-hub/psychometric-assessment', icon: <UnifiedIcon name="activity" size="md" color="primary" />, label: t('studentHub.psychometric.majorMatch', 'Major Match') },
      { key: '/student-hub/opportunities', icon: <UnifiedIcon name="opportunities" size="md" color="primary" />, label: t('studentHub.nav.opportunities', 'Opportunities') },
      { key: '/student-hub/essays', icon: <UnifiedIcon name="essays" size="md" color="primary" />, label: t('Essays') },
      { key: '/student-hub?section=others&target=profile&tab=documents', icon: <UnifiedIcon name="documents" size="md" color="primary" />, label: t('Documents') },
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
                aria-label={t('studentHub.nav.openJourneyMenu', 'Open My Journey menu')}
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
              aria-label={collapsed
                ? t('studentHub.nav.expandJourneyMenu', 'Expand My Journey menu')
                : t('studentHub.nav.collapseJourneyMenu', 'Collapse My Journey menu')}
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
              aria-label={t('studentHub.nav.closeJourneyMenu', 'Close My Journey menu')}
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
  // SAT Prep is a self-contained area that owns its full-width chrome
  // (matches the Research Prep treatment). Hide the My Journey sidebar
  // and let the page render edge-to-edge.
  const isSatPrep = location.pathname.startsWith('/student-hub/sat-prep');
  // Research Prep standalone locked surface (non-community users) — same
  // edge-to-edge treatment as SAT Prep so the blurred preview shows the
  // full dashboard silhouette behind the unlock modal.
  const isResearchPrep = location.pathname.startsWith('/student-hub/research-prep');
  const hideSidebar = isCommunityLanding || isSatPrep || isResearchPrep;

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
              aria-label={t('studentHub.nav.openJourneyMenu', 'Open My Journey menu')}
            />
            <h1 className="mobile-title">{t('studentHub.nav.myJourney', 'My Journey')}</h1>
          </div>
        </Header>
      )}

      {/* Community hub: Ant sidebar hidden; mobile header still needs a drawer with profile + hub nav */}
      {hideSidebar && shouldShowMobileHeader && (
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

      {!hideSidebar && (
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
                aria-label={collapsed
                  ? t('studentHub.nav.expandJourneyMenu', 'Expand My Journey menu')
                  : t('studentHub.nav.collapseJourneyMenu', 'Collapse My Journey menu')}
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
                aria-label={t('studentHub.nav.closeJourneyMenu', 'Close My Journey menu')}
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

      <Layout className={`main-layout ${isSatPrep ? 'main-layout--sat-prep' : ''}`}>
        <Content className={`main-content ${isSatPrep ? 'main-content--sat-prep' : ''}`}>
          {/* StudyGoals self-gates internally (community-enrolled, no goals set),
              so it renders unconditionally now. It used to be suppressed
              whenever the Major Match banner won priority; with that banner
              gone it simply applies whenever its own condition holds. */}
          {!isSatPrep && <StudyGoalsStickyBanner />}
          <div className={isSatPrep ? 'main-content-flush' : 'main-content-padded'}>
            {/* Only the dashboard section actually consumes useStudentHub's
                data — every hub section shares the '/student-hub' pathname
                via ?section=…, so gating on pathname alone blocked Feed,
                Messages, etc. behind unrelated dashboard queries AND delayed
                mounting the hub page (serializing its own fetches). */}
            {isLoading &&
            location.pathname === '/student-hub' &&
            new URLSearchParams(location.search).get('section') === 'dashboard' ? (
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
