import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetApplicantOverviewQuery } from 'src/app/services/student-hub/applicantOverviewApi';
import { ApplicantOverviewContext } from './ApplicantOverviewContext';
import { isOverviewLocation } from 'src/lib/applicantWorkspace';
import { ApplicantTopBarContext } from './ApplicantTopBarContext';
import {
  ApplicantPanel,
  ApplicantRail,
  ApplicantSectionTabs,
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
  const [trailTarget, setTrailTarget] = useState<HTMLElement | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(readPanelCollapsed);
  const togglePanel = () =>
    setPanelCollapsed((value) => {
      writePanelCollapsed(!value);
      return !value;
    });
  const previousLocation = useRef({ pathname: '', search: '' });
  useEffect(() => {
    const stable = (search: string) => { const params = new URLSearchParams(search); ['compare', 'action', 'milestone', ...(pathname === '/student-hub/applications' ? ['collection', 'q', 'status', 'sort'] : [])].forEach(key => params.delete(key)); params.sort(); return params.toString(); };
    if (pathname !== previousLocation.current.pathname || stable(search) !== stable(previousLocation.current.search)) window.scrollTo({ top: 0, behavior: 'auto' });
    previousLocation.current = { pathname, search };
  }, [pathname, search]);

  return (
    <ApplicantOverviewContext.Provider value={query}>
      <ApplicantTopBarContext.Provider value={trailTarget}>
      <div className={`applicant-shell${isOverviewLocation(pathname, search) ? ' applicant-shell--overview' : ''}${pathname === '/student-hub/applications' && !search.includes('tab=') && !search.includes('view=') ? ' applicant-shell--application-dashboard' : ''}`}>
        <a href="#applicant-content" className="applicant-skip">
          {t('applicant.skip')}
        </a>
        <div className="applicant-shell__grid">
          <ApplicantRail />
          <ApplicantPanel collapsed={panelCollapsed} onToggle={togglePanel} />
          <main
            id="applicant-content"
            tabIndex={-1}
            className="applicant-content"
          >
            <div className="applicant-mobile-bar">
              <div className="applicant-mobile-bar__trail" ref={setTrailTarget} />
            </div>
            <ApplicantSectionTabs />
            <div className="applicant-content__inner">{children}</div>
          </main>
        </div>
      </div>
      </ApplicantTopBarContext.Provider>
    </ApplicantOverviewContext.Provider>
  );
}
