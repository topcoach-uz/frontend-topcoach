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
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkCheck,
  GraduationCap,
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
          <div className="sat-shell__crumb">
            <span className="sat-shell__brand-badge">
              <GraduationCap size={13} />
              SAT Test Prep
            </span>
            <span className="sat-shell__crumb-sep">›</span>
            <span className="sat-shell__crumb-current">{activeTab?.label ?? 'Overview'}</span>
          </div>
          <button className="sat-shell__back-btn" onClick={() => navigate(myLearningPath)}>
            <ArrowLeft size={13} />
            My learning
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
