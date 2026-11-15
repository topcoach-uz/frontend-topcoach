import { useEffect, useState, type ReactNode } from 'react';
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
import OrgMembershipSidebar from '../components/OrgMembershipSidebar';
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
  useEffect(() => {
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
            <div className="applicant-org-mobile">
              <OrgMembershipSidebar />
            </div>
          </main>
        </div>
      </div>
      </ApplicantTopBarContext.Provider>
    </ApplicantOverviewContext.Provider>
  );
}
