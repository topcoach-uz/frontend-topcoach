/**
 * ResearchPrepPage
 *
 * Full-bleed Research Prep experience inside the Community Hub. Two modes:
 *   - 'overview' — Major Milestones strip + 4×2 week grid
 *   - 'module'   — single-week deep-dive (Materials | Quiz | Assignment)
 *
 * The parent (CommunityHubMockPage) collapses its sidebars when this page
 * mounts, so the visual is edge-to-edge.
 *
 * Data: research-prep RTK slice (mock-mode today; swaps to real backend
 * later without component changes).
 */

import React, { useMemo, useState } from 'react';
import { Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  useGetMyAssignmentSubmissionsQuery,
  useGetResearchLockStateQuery,
  useGetResearchProgressSummaryQuery,
  useGetResearchStructureQuery,
} from 'src/app/services/research-prep';
import ResearchTopBar from './components/ResearchTopBar';
import ResearchOverview from './components/ResearchOverview';
import ResearchModuleView from './components/ResearchModuleView';
import { computeResearchProgress } from './researchProgress';
import { applicantLinks } from 'src/lib/applicantWorkspace';
import '../applicant/applicantPages.scss';
import './research-prep.scss';

interface ResearchPrepPageProps {
  /** From the parent CommunityHub — drives the FS-vs-non-FS submission flow. */
  isFullSupport?: boolean;
  /** Optional: caller can supply a way to leave the page entirely (e.g. back
   *  to the Community feed/dashboard). Defaults to navigating to /student-hub. */
  onExit?: () => void;
}

const ResearchPrepPage: React.FC<ResearchPrepPageProps> = ({ isFullSupport = false, onExit }) => {
  const navigate = useNavigate();
  const { data: weeks, isLoading: weeksLoading } = useGetResearchStructureQuery();
  const { data: lockState, isLoading: lockLoading } = useGetResearchLockStateQuery();
  const { data: summary } = useGetResearchProgressSummaryQuery();
  const { data: mySubmissions } = useGetMyAssignmentSubmissionsQuery();
  const [view, setView] = useState<'overview' | 'module'>('overview');
  const [openWeekNumber, setOpenWeekNumber] = useState<number | null>(null);

  const handleOpenWeek = (weekNumber: number) => {
    setOpenWeekNumber(weekNumber);
    setView('module');
    // Scroll to top so the user lands on the module header.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchView = (next: 'overview' | 'module') => {
    if (next === 'module' && !openWeekNumber) {
      message.info('Pick a week from the dashboard first.');
      return;
    }
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMain = () => {
    if (view === 'module') {
      setView('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (onExit) {
      onExit();
      return;
    }
    // Return to My learning, where research prep is opened from.
    navigate(applicantLinks.learning);
  };

  const handleBookMentorReview = (submissionId: string) => {
    message.info(
      `Booking flow coming soon — the existing Sessions modal will pre-fill type=research_assignment_review for submission ${submissionId.slice(0, 8)}…`,
      4,
    );
  };

  const openWeek = useMemo(() => {
    if (!weeks || !openWeekNumber) return undefined;
    return weeks.find((w) => w.weekNumber === openWeekNumber);
  }, [weeks, openWeekNumber]);

  const openLock = useMemo(() => {
    if (!lockState || !openWeekNumber) return undefined;
    return lockState.find((l) => l.weekNumber === openWeekNumber);
  }, [lockState, openWeekNumber]);

  // Progress comes from the same per-week lock state the module view uses, so
  // the chip can never disagree with "Week N complete".
  const progress = useMemo(() => computeResearchProgress(lockState), [lockState]);

  const nextWeek = useMemo(() => {
    if (!weeks || !openWeekNumber) return undefined;
    return weeks.find((w) => w.weekNumber === openWeekNumber + 1);
  }, [weeks, openWeekNumber]);

  if (weeksLoading || lockLoading || !weeks || !lockState) {
    return (
      <div className="applicant-page applicant-specialist-page rp">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const { weeksCompleted, overallPercent } = progress;
  const currentWeekNumber = progress.currentWeekNumber || summary?.currentWeekNumber || 1;

  return (
    <div className="applicant-page applicant-specialist-page rp">
      <ResearchTopBar
        view={view}
        selectedWeekNumber={openWeekNumber ?? undefined}
        selectedWeekTitle={openWeek?.title}
        weeksCompleted={weeksCompleted}
        totalWeeks={weeks.length}
        overallPercent={overallPercent}
        weeks={weeks}
        lockState={lockState}
        onOpenWeek={handleOpenWeek}
        onSwitchView={handleSwitchView}
        onBackToMain={handleBackToMain}
      />

      <div className="rp-body">
        {view === 'overview' && (
          <ResearchOverview
            weeks={weeks}
            lockState={lockState}
            currentWeekNumber={currentWeekNumber}
            onOpenWeek={handleOpenWeek}
          />
        )}
        {view === 'module' && openWeek && openLock && (
          <ResearchModuleView
            week={openWeek}
            lock={openLock}
            nextWeek={nextWeek}
            mySubmissions={mySubmissions ?? []}
            isFullSupport={isFullSupport}
            onBookMentorReview={handleBookMentorReview}
            onOpenWeek={handleOpenWeek}
          />
        )}
      </div>
    </div>
  );
};

export default ResearchPrepPage;
