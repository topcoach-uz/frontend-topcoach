// ISC 2026 — Admissions console shell (superadmin + reviewer views).
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Star,
  Users,
  Zap,
  LogOut,
} from 'lucide-react';
import s from './isc.module.scss';
import {
  useGetIscAdminStatsQuery,
  useGetIscReviewerQueueQuery,
  useGetIscReviewersQuery,
} from '../../app/services/iscAdmissionsApi';
import {
  DashboardPage,
  ApplicationsPage,
  FinalDecisionsPage,
  ReviewersPage,
} from './AdminPages';
import { ReviewerDashboard, FastReviewMode } from './ReviewerPages';

type Role = 'admin' | 'reviewer';
type AdminNav = 'dashboard' | 'applications' | 'decisions' | 'reviewers';
type ReviewerNav = 'my-dashboard' | 'fast-review';

function param(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function Console({
  variant = 'admin',
}: {
  variant?: 'admin' | 'reviewer' | 'preview';
}) {
  const navigate = useNavigate();
  // admin   → real /new-admin superadmin console (admin-only)
  // reviewer → real reviewer console (own queue, reviewer nav only)
  // preview  → dev harness with the role/"reviewing as" switcher
  const preview = variant === 'preview';
  const [role, setRole] = useState<Role>(
    variant === 'reviewer'
      ? 'reviewer'
      : preview && param('role') === 'reviewer'
        ? 'reviewer'
        : 'admin',
  );
  // "Reviewing as" is a superadmin impersonation affordance; populated from the
  // real reviewer list. Empty string = operate on the logged-in reviewer's queue.
  const [reviewingAs, setReviewingAs] = useState<string>('');
  const [adminNav, setAdminNav] = useState<AdminNav>((param('nav') as AdminNav) || 'dashboard');
  const [reviewerNav, setReviewerNav] = useState<ReviewerNav>(
    (param('rnav') as ReviewerNav) || 'my-dashboard',
  );

  // The reviewer list is an admin-only endpoint — only fetch it for the
  // preview switcher (a plain reviewer would get 403).
  const { data: reviewers } = useGetIscReviewersQuery(undefined, { skip: !preview });
  const { data: adminStats } = useGetIscAdminStatsQuery(undefined, { skip: role !== 'admin' });
  // Logged-in reviewer's own queue powers the reviewer header counts.
  const { data: reviewerQueue } = useGetIscReviewerQueueQuery(undefined, {
    skip: role !== 'reviewer' || !!reviewingAs,
  });

  // Default the impersonation selector to the first reviewer once loaded (preview only).
  useEffect(() => {
    if (preview && !reviewingAs && reviewers && reviewers.length) setReviewingAs(reviewers[0].id);
  }, [preview, reviewers, reviewingAs]);

  const total = adminStats?.total ?? 0;

  const queue = reviewerQueue ?? [];
  const reviewerAssigned = queue.length;
  const reviewerReviewed = queue.filter((q) => q.reviewed).length;

  return (
    <div className={s.shell}>
      <aside className={s.sider}>
        <div className={s.siderBrand}>
          <div className={s.siderLogo}>IS</div>
          <div>
            <div className={s.siderTitle}>ISC 2026</div>
            <div className={s.siderSub}>Admissions console</div>
          </div>
        </div>

        {role === 'admin' ? (
          <>
            <div className={s.navGroupLabel}>Overview</div>
            <NavBtn icon={<LayoutDashboard size={18} />} label="Dashboard"
              active={adminNav === 'dashboard'} onClick={() => setAdminNav('dashboard')} />

            <div className={s.navGroupLabel}>Admissions pipeline</div>
            <NavBtn icon={<ClipboardList size={18} />} label="Applications" badge={total}
              active={adminNav === 'applications'} onClick={() => setAdminNav('applications')} />
            <NavBtn icon={<Star size={18} />} label="Final decisions"
              active={adminNav === 'decisions'} onClick={() => setAdminNav('decisions')} />

            <div className={s.navGroupLabel}>People</div>
            <NavBtn icon={<Users size={18} />} label="Reviewers"
              active={adminNav === 'reviewers'} onClick={() => setAdminNav('reviewers')} />
          </>
        ) : (
          <>
            <div className={s.navGroupLabel}>Your queue</div>
            <NavBtn icon={<LayoutDashboard size={18} />} label="My dashboard"
              active={reviewerNav === 'my-dashboard'} onClick={() => setReviewerNav('my-dashboard')} />
            <NavBtn icon={<Zap size={18} />} label="Review"
              active={reviewerNav === 'fast-review'} onClick={() => setReviewerNav('fast-review')} />
          </>
        )}

        <div className={s.siderFooter}>
          <button
            className={s.siderExit}
            onClick={() => navigate(variant === 'reviewer' ? '/student-hub' : '/new-admin/events')}
          >
            <LogOut size={16} /> {variant === 'reviewer' ? 'Exit' : 'Exit to admin'}
          </button>
          {preview && (
            <div style={{ marginTop: 12 }}>
              <div className={s.viewAsLabel}>View as</div>
              <div className={s.viewAsToggle}>
                <button className={`${s.viewAsBtn} ${role === 'admin' ? s.active : ''}`}
                  onClick={() => setRole('admin')}>Admin</button>
                <button className={`${s.viewAsBtn} ${role === 'reviewer' ? s.active : ''}`}
                  onClick={() => setRole('reviewer')}>Reviewer</button>
              </div>
              {role === 'reviewer' && (
                <div style={{ marginTop: 10 }}>
                  <div className={s.viewAsLabel}>Reviewing as</div>
                  <select className={s.selectInput} style={{ width: '100%' }}
                    value={reviewingAs} onChange={(e) => setReviewingAs(e.target.value)}>
                    {(reviewers ?? []).map((r) => (
                      <option key={r.id} value={r.id}>{r.name || r.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className={s.main}>
        {role === 'admin' ? (
          <AdminHeader nav={adminNav} />
        ) : (
          <ReviewerHeader assigned={reviewerAssigned} reviewed={reviewerReviewed}
            remaining={reviewerAssigned - reviewerReviewed} />
        )}

        <div className={s.body}>
          {role === 'admin' && adminNav === 'dashboard' && <DashboardPage onNav={(n) => setAdminNav(n as AdminNav)} />}
          {role === 'admin' && adminNav === 'applications' && <ApplicationsPage />}
          {role === 'admin' && adminNav === 'decisions' && <FinalDecisionsPage />}
          {role === 'admin' && adminNav === 'reviewers' && <ReviewersPage />}
          {role === 'reviewer' && reviewerNav === 'my-dashboard' && (
            <ReviewerDashboard reviewerId={reviewingAs} onStart={() => setReviewerNav('fast-review')} />
          )}
          {role === 'reviewer' && reviewerNav === 'fast-review' && (
            <FastReviewMode reviewerId={reviewingAs} />
          )}
        </div>
      </main>
    </div>
  );
}

function NavBtn({ icon, label, active, badge, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button className={`${s.navItem} ${active ? s.active : ''}`} onClick={onClick}>
      <span style={{ display: 'flex' }}>{icon}</span>
      {label}
      {badge != null && <span className={s.navBadge}>{badge}</span>}
    </button>
  );
}

const ADMIN_HEAD: Record<AdminNav, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Cohort overview · 2026 international summer camp' },
  applications: { title: 'Applications', sub: 'Every submission · open any applicant to review the full file' },
  decisions: { title: 'Final decisions', sub: 'Review the combined scores and make a call' },
  reviewers: { title: 'Reviewers', sub: 'Workload and progress across the review team' },
};

function AdminHeader({ nav }: { nav: AdminNav }) {
  const h = ADMIN_HEAD[nav];
  return (
    <div className={s.pageHead}>
      <div>
        <h1 className={s.pageTitle}>{h.title}</h1>
        <p className={s.pageSub}>{h.sub}</p>
      </div>
    </div>
  );
}

function ReviewerHeader({ assigned, reviewed, remaining }: { assigned: number; reviewed: number; remaining: number }) {
  return (
    <div className={s.pageHead}>
      <div>
        <h1 className={s.pageTitle}>My review queue</h1>
        <p className={s.pageSub}>Applications assigned to you</p>
      </div>
      <div className={s.headStats}>
        <Stat num={assigned} label="Assigned to you" cls={s.navyText} />
        <Stat num={reviewed} label="Reviewed" cls={s.green} />
        <Stat num={remaining} label="Remaining" cls={s.amber} />
      </div>
    </div>
  );
}

function Stat({ num, label, cls }: { num: number; label: string; cls: string }) {
  return (
    <div className={s.headStat}>
      <div className={`${s.headStatNum} ${cls}`}>{num}</div>
      <div className={s.headStatLabel}>{label}</div>
    </div>
  );
}
