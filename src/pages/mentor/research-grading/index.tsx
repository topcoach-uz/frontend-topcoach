/**
 * Research grading inbox — mentor / teacher view.
 *
 * Lists Research Prep assignment submissions routed to this mentor (their
 * Full Support roster). Two tabs: Pending (submitted + under_review) and
 * All. Click a row to open the side drawer with feedback editor.
 */

import React, { useMemo, useState } from 'react';
import { Button, Result, Spin, Tabs } from 'antd';
import {
  Calendar,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Inbox,
  RotateCcw,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetGraderInboxQuery,
  type ResearchSubmission,
} from 'src/app/services/research-prep';
import { canUseResearchPrepLive } from 'src/lib/researchPrepAccess';
import { useMentorConsole } from '../console/MentorConsoleContext';
import { McStat } from '../console/components/McStat';
import SubmissionDrawer from './SubmissionDrawer';
import './research-grading.scss';

const STATUS_PILL: Record<ResearchSubmission['status'], { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'rg-status-pill--submitted' },
  under_review: { label: 'Under review', cls: 'rg-status-pill--review' },
  graded: { label: 'Graded', cls: 'rg-status-pill--graded' },
  returned_for_revision: { label: 'Revision requested', cls: 'rg-status-pill--returned' },
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const ResearchGradingPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { email, managementRole } = useMentorConsole();
  const researchLive = canUseResearchPrepLive(email, managementRole);
  const { data: inbox, isLoading } = useGetGraderInboxQuery(undefined, { skip: !researchLive });
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [openSub, setOpenSub] = useState<ResearchSubmission | null>(null);

  const pending = useMemo(
    () =>
      (inbox ?? []).filter(
        (s) => s.status === 'submitted' || s.status === 'under_review',
      ),
    [inbox],
  );
  const all = inbox ?? [];

  const stats = useMemo(() => {
    return {
      pending: pending.length,
      claimed: all.filter((s) => s.gradedByUserId === 'me' && s.status === 'under_review').length,
      gradedThisWeek: all.filter((s) => {
        if (s.status !== 'graded' || !s.gradedAt) return false;
        const t = new Date(s.gradedAt).getTime();
        return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
      }).length,
      returned: all.filter((s) => s.status === 'returned_for_revision').length,
    };
  }, [all, pending]);

  const visible = tab === 'pending' ? pending : all;

  if (!researchLive) {
    return (
      <Result
        status="info"
        title="Research grading — coming soon"
        subTitle="The grading inbox will open when Research Prep launches for all mentors."
        extra={
          <Button type="primary" onClick={() => navigate('/mentor/dashboard')}>
            Back to dashboard
          </Button>
        }
      />
    );
  }

  const renderRow = (s: ResearchSubmission) => (
    <div
      key={s.id}
      className="rg-item"
      role="button"
      tabIndex={0}
      onClick={() => setOpenSub(s)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpenSub(s);
        }
      }}
    >
      <div className="avatar">{initials(s.studentName)}</div>
      <div className="meta">
        <div className="name">{s.studentName}</div>
        <div className="sub">
          <span>
            <Sparkles size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            Week {s.weekNumber} — {s.weekTitle}
          </span>
          <span>
            <Calendar size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            {fmtDate(s.submittedAt)}
          </span>
          <span>Attempt #{s.attemptNumber}</span>
          {s.fileName && <span>{s.fileName}</span>}
        </div>
      </div>
      <div className="right">
        {s.status === 'graded' && s.score != null && (
          <span style={{ fontSize: 12, color: '#1c1a17', fontWeight: 700 }}>
            {s.score}/100
          </span>
        )}
        <span className={`rg-status-pill ${STATUS_PILL[s.status].cls}`}>
          {STATUS_PILL[s.status].label}
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`research-grading${embedded ? ' research-grading--embedded' : ''}`}>
      {!embedded && (
        <div className="rg-head">
          <div className="eyebrow">
            <GraduationCap size={11} style={{ verticalAlign: -1, marginRight: 6 }} />
            Research Prep · grading inbox
          </div>
          <h1>Grade your students' research assignments</h1>
          <p>
            Submissions from your Full Support students route here. Claim a submission to start
            grading; write feedback, score 0–100, and either mark graded or return for revision.
          </p>
        </div>
      )}

      <div className="mc-stat-grid">
        <McStat
          icon={<Inbox size={16} />}
          label="Pending"
          value={stats.pending}
          meta="Submitted — your turn"
          tone={stats.pending > 0 ? 'warn' : 'good'}
        />
        <McStat
          icon={<UserCheck size={16} />}
          label="Claimed by you"
          value={stats.claimed}
          meta="In progress"
          tone="neutral"
        />
        <McStat
          icon={<CheckCircle2 size={16} />}
          label="Graded · 7 days"
          value={stats.gradedThisWeek}
          meta="Closed out recently"
          tone="good"
        />
        <McStat
          icon={<RotateCcw size={16} />}
          label="In revision"
          value={stats.returned}
          meta="Returned to student"
          tone={stats.returned > 0 ? 'warn' : 'good'}
        />
      </div>

      <div className="rg-toolbar">
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as 'pending' | 'all')}
          items={[
            { key: 'pending', label: `Pending (${pending.length})` },
            { key: 'all', label: `All (${all.length})` },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <div className="rg-empty">
          <FileCheck2
            size={36}
            color="#94a3b8"
            style={{ marginBottom: 12, display: 'inline-block' }}
          />
          <h3>{tab === 'pending' ? 'No pending submissions' : 'No submissions yet'}</h3>
          <p>
            {tab === 'pending'
              ? 'Once a student submits a Research Prep assignment, it will appear here for grading.'
              : 'Submissions show up after they are routed to you.'}
          </p>
        </div>
      ) : (
        <div className="rg-list">{visible.map(renderRow)}</div>
      )}

      <SubmissionDrawer
        open={!!openSub}
        submission={openSub}
        onClose={() => setOpenSub(null)}
      />
    </div>
  );
};

export default ResearchGradingPage;
