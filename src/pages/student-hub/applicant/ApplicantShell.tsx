import { useEffect, useState, type ReactNode } from 'react';
import { Drawer } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetApplicantOverviewQuery } from 'src/app/services/student-hub/applicantOverviewApi';
import { ApplicantOverviewContext } from './ApplicantOverviewContext';
import { isOverviewLocation } from 'src/lib/applicantWorkspace';
import { ApplicantTopBarContext } from './ApplicantTopBarContext';
import {
  ApplicantDrawerNavigation,
  ApplicantPanel,
  ApplicantRail,
} from './ApplicantWorkspaceNav';
import { readPanelCollapsed, writePanelCollapsed } from './applicantNavState';
import './applicantWorkspace.scss';
import './liquidGlassWorkspace.scss';

export default function ApplicantShell({ children }: { children: ReactNode }) {
  const userId = useTypedSelector((state) => state.auth.profile?.id);
  const query = useGetApplicantOverviewQuery(userId ?? '', {
    skip: !userId,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trailTarget, setTrailTarget] = useState<HTMLElement | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(readPanelCollapsed);
  const togglePanel = () =>
    setPanelCollapsed((value) => {
      writePanelCollapsed(!value);
      return !value;
    });
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, search]);

  return (
    <ApplicantOverviewContext.Provider value={query}>
      <ApplicantTopBarContext.Provider value={trailTarget}>
      <div className={`applicant-shell${isOverviewLocation(pathname, search) ? ' applicant-shell--overview' : ''}`}>
        <a href="#applicant-content" className="applicant-skip">
          {t('applicant.skip')}
        </a>
        <div className="applicant-shell__grid">
          <ApplicantRail
            onOpenMenu={() => setDrawerOpen(true)}
            menuOpen={drawerOpen}
          />
          <ApplicantPanel collapsed={panelCollapsed} onToggle={togglePanel} />
          <main
            id="applicant-content"
            tabIndex={-1}
            className="applicant-content"
          >
            <div className="applicant-mobile-bar">
              <div className="applicant-mobile-bar__trail" ref={setTrailTarget} />
            </div>
            <div className="applicant-content__inner">{children}</div>
          </main>
        </div>
        <Drawer
          open={drawerOpen}
          placement="left"
          width={280}
          title={t('applicant.myJourney')}
          onClose={() => setDrawerOpen(false)}
          destroyOnClose
          rootClassName="applicant-drawer"
        >
          <ApplicantDrawerNavigation onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      </div>
      </ApplicantTopBarContext.Provider>
    </ApplicantOverviewContext.Provider>
  );
}
