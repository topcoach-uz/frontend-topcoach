/**
 * SAT Prep shell — full-bleed inside the student hub. Compact one-row
 * header with brand badge, breadcrumb, and Back-to-main-menu. Tabs sit
 * directly below.
 *
 * No bank-size numbers exposed to the student — keeps the focus on
 * progress, not inventory.
 */

import React from 'react';
import { useMyLearningPath } from 'src/pages/student-hub/applicant/useMyLearningPath';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from 'src/pages/student-hub/applicant/ApplicantPage';
import {
  ArrowLeft,
  BookmarkCheck,
  Layers,
  LayoutDashboard,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import 'src/pages/student-hub/applicant/applicantPages.scss';
import './sat-prep-shell.scss';
import 'src/pages/student-hub/sat-prep/sat-platform.scss';

interface Tab {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { to: '/student-hub/sat-prep', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { to: '/student-hub/sat-prep/practice', label: 'Practice', icon: <Layers size={15} /> },
  { to: '/student-hub/sat-prep/mock-tests', label: 'Mock Tests', icon: <Sparkles size={15} /> },
  { to: '/student-hub/sat-prep/review', label: 'Review', icon: <ListChecks size={15} /> },
  { to: '/student-hub/sat-prep/library', label: 'Library', icon: <BookmarkCheck size={15} /> },
];

const SatPrepLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const myLearningPath = useMyLearningPath();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.includes('/runner')) return <>{children}</>;

  const activeTab = TABS.find((t) =>
    t.to === '/student-hub/sat-prep'
      ? location.pathname === '/student-hub/sat-prep'
      : location.pathname.startsWith(t.to),
  );

  return (
    <div className="applicant-page applicant-specialist-page sat-shell">
      <header className="sat-shell__header">
        <div className="sat-shell__header-inner">
          <Breadcrumb>
            <Link to={myLearningPath}>My learning</Link>
            <span>/</span>
            <span>SAT Test Prep</span>
            <span>/</span>
            {activeTab?.label ?? 'Overview'}
          </Breadcrumb>
          <button className="sat-shell__back-btn" onClick={() => navigate(myLearningPath)}>
            <ArrowLeft size={13} />
            Back to My learning
          </button>
        </div>
        <nav className="sat-shell__tabs">
          <div className="sat-shell__tabs-inner">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/student-hub/sat-prep'}
                className={({ isActive }) =>
                  `sat-shell__tab ${isActive ? 'sat-shell__tab--active' : ''}`
                }
              >
                {t.icon}
                <span>{t.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="sat-shell__body">{children}</main>
    </div>
  );
};

export default SatPrepLayout;
