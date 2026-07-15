// ISC 2026 — superadmin console pages.
//
// Pipeline: Applications → review → Final decisions (interviews removed).
// Applications is the hub: a list of every submission that opens a full
// applicant file (what they submitted + AI pre-eval + reviewer scores +
// the admin actions that move them through the pipeline).
//
// Wired to the real backend through RTK Query (iscAdmissionsApi). The real
// form collects less than the original mock: no region / school / GPA — we
// surface program + applicantType + grade instead.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Inbox, ArrowLeft, UserPlus, ArrowRight, Trash2, X, MoreVertical, Download, FileText, Sparkles } from 'lucide-react';
import s from './isc.module.scss';
import { hostName } from '../../app/services/api/const';
import { api } from '../../app/api';
import {
  SCORE_DIMENSIONS,
  STATUS_LABEL,
} from './types';
import { Avatar, BarRow, RecBadge, StatusBadge, AiAssessmentDetails } from './components';
import {
  useGetIscAdminStatsQuery,
  useGetIscAdminApplicationsQuery,
  useGetIscAdminApplicationQuery,
  useGetIscReviewersQuery,
  useAssignIscReviewersMutation,
  useDecideIscApplicationMutation,
  useRerunIscAiEvalMutation,
  useRerunAllIscAiMutation,
  useGetIscAiProgressQuery,
  useGrantIscReviewerByEmailMutation,
  useRevokeIscReviewerMutation,
  IscApplicationRow,
  IscApplicationStatus,
  IscProgram,
  IscApplicantType,
} from '../../app/services/iscAdmissionsApi';

const ALL_STATUSES: IscApplicationStatus[] = [
  'submitted', 'under_review', 'reviewed', 'accepted', 'waitlisted', 'rejected',
];

const PROGRAM_LABEL = (p?: IscProgram | null) => (p === 'master' ? "Master's" : "Bachelor's");
const TYPE_LABEL = (t?: IscApplicantType | null) => (t === 'international' ? 'International' : 'Local');

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: '#7B1F2F', color: '#fff', padding: '10px 18px', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600', zIndex: '9999', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

function avatarInitials(name?: string): string {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const draftVal = (app: IscApplicationRow | undefined, section: string, key: string): string => {
  const d = (app?.draft as any)?.[section]?.[key];
  return d == null || d === '' ? '—' : String(d);
};

/** Raw draft string (null when missing) — for file paths / export. */
const draftRaw = (app: IscApplicationRow | undefined, section: string, key: string): string | null => {
  const d = (app?.draft as any)?.[section]?.[key];
  return typeof d === 'string' && d ? d : null;
};

/** Authenticated document download URL (served via the API, cookie-gated). */
const docDownloadUrl = (appId: string, kind: string): string =>
  `${hostName}/api/isc-admissions/documents/${appId}/${kind}`;

/**
 * Download a ranked, fully-detailed CSV from the server. The params decide the
 * scope, so the three export modes share one code path:
 *   - {}                    → every application ("all")
 *   - { ...filters, sort }  → the current filtered view ("filtered")
 *   - { ids: 'a,b,c' }      → an explicit checkbox selection ("selected")
 */
async function downloadIscExport(
  params: Record<string, string | number | undefined>,
  label: string,
): Promise<void> {
  try {
    const res = await api.instance.get(
      '/isc-admissions/admin/applications/export',
      { params, responseType: 'blob' },
    );
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `isc-applications-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Export ready — check your downloads.');
  } catch {
    toast('Could not export. Please try again.');
  }
}

const num = (v?: string | null): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ── Dashboard ──────────────────────────────────────────────── */
const PIPELINE: { key: IscApplicationStatus; label: string; variant?: 'green' | 'amber' | 'red' }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under review', variant: 'amber' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'accepted', label: 'Accepted', variant: 'green' },
  { key: 'rejected', label: 'Rejected', variant: 'red' },
];

export function DashboardPage({ onNav }: { onNav: (n: string) => void }) {
  const { data: stats } = useGetIscAdminStatsQuery();
  const { data: reviewers } = useGetIscReviewersQuery();

  if (!stats) return <div className={s.emptyText}>Loading…</div>;

  const byStatus = stats.byStatus;
  const total = stats.total;
  const maxProgram = Math.max(stats.byProgram.bachelor, stats.byProgram.master, 1);
  const maxType = Math.max(stats.byApplicantType.local, stats.byApplicantType.international, 1);

  // admin to-dos — each jumps to the page where the work happens
  const attention = [
    { label: 'Awaiting reviewer assignment', n: byStatus.submitted ?? 0, hint: 'Assign reviewers to start review', nav: 'applications', tone: 'crimson' as const },
    { label: 'In review', n: byStatus.under_review ?? 0, hint: 'Reviewers are scoring these', nav: 'applications', tone: 'amber' as const },
    { label: 'Awaiting a final decision', n: byStatus.reviewed ?? 0, hint: 'Review complete · needs accept / reject', nav: 'decisions', tone: 'green' as const },
  ];

  return (
    <>
      {/* KPI strip */}
      <div className={s.kpiRow}>
        <Kpi label="Total applications" value={total} sub="this cohort" />
        <Kpi label="Awaiting review" value={stats.awaitingReview} sub="submitted + in review" tone="amber" />
        <Kpi label="Accepted" value={stats.accepted} sub="this cohort" tone="green" />
        <Kpi label="Avg AI score" value={`${stats.avgAiScore} / 50`} sub="pre-evaluation" />
      </div>

      {/* needs attention + pipeline */}
      <div className={s.cardGrid}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Needs your attention</h3>
          {attention.map((a) => (
            <button key={a.label} className={s.attnRow} onClick={() => onNav(a.nav)}>
              <span className={`${s.attnCount} ${a.tone === 'amber' ? s.attnAmber : a.tone === 'green' ? s.attnGreen : ''}`}>{a.n}</span>
              <span className={s.attnBody}>
                <span className={s.attnLabel}>{a.label}</span>
                <span className={s.attnHint}>{a.hint}</span>
              </span>
              <ArrowRight size={16} className={s.rowArrow} />
            </button>
          ))}
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Admissions pipeline</h3>
          {PIPELINE.map((stage) => (
            <BarRow key={stage.key} label={stage.label} value={byStatus[stage.key] ?? 0} max={total} variant={stage.variant} />
          ))}
        </div>
      </div>

      {/* cohort breakdowns */}
      <div className={s.cardGrid} style={{ marginTop: 18 }}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Cohort by program</h3>
          <BarRow label="Bachelor's" value={stats.byProgram.bachelor} max={maxProgram} />
          <BarRow label="Master's" value={stats.byProgram.master} max={maxProgram} />
        </div>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Cohort by applicant type</h3>
          <BarRow label="Local" value={stats.byApplicantType.local} max={maxType} />
          <BarRow label="International" value={stats.byApplicantType.international} max={maxType} />
        </div>
      </div>

      {/* reviewer workload */}
      <div className={s.cardGrid} style={{ marginTop: 18 }}>
        <div className={s.card}>
          <h3 className={s.cardTitle}>Reviewer workload</h3>
          {(reviewers ?? []).length === 0 && <div className={s.emptyText}>No reviewers on the team yet.</div>}
          {(reviewers ?? []).map((r) => {
            const pct = r.assigned ? Math.round((r.reviewed / r.assigned) * 100) : 0;
            return (
              <div key={r.id} className={s.workRow}>
                <span className={s.workName}>{r.name}</span>
                <div className={s.barTrack}><div className={`${s.barFill} ${s.fillGreen}`} style={{ width: `${pct}%` }} /></div>
                <span className={s.workMeta}>{r.reviewed}/{r.assigned}</span>
              </div>
            );
          })}
        </div>
        <div className={s.card} />
      </div>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub: string; tone?: 'amber' | 'green' }) {
  return (
    <div className={s.tile}>
      <div className={s.tileLabel}>{label}</div>
      <div className={`${s.tileNum} ${tone === 'amber' ? s.amber : tone === 'green' ? s.green : s.navyText}`}>{value}</div>
      <div className={s.tileSub}>{sub}</div>
    </div>
  );
}

/* ── Applications (list ↔ detail) ───────────────────────────── */
// Bulk "Score all with AI" / "Re-run AI". Hidden now that the cohort is fully
// scored. Flip to `true` to expose them again for a new intake — the run only
// targets applications still missing a score (`onlyPending`), so it's safe to
// re-enable without re-charging for work already done.
const SHOW_AI_SCORING = false;

// Final decisions are frozen while the cohort is still being triaged — the
// Accept / Waitlist / Reject buttons render but don't fire. Flip to `true` to
// hand decision-making back to the admissions team.
const DECISIONS_ENABLED = false;

/**
 * Bulk AI scoring trigger + live progress. Kicks off a background pass that
 * (re)scores every application still missing an AI score, and polls progress
 * while it runs. Safe to click again — the backend refuses a second concurrent
 * run and resumes/retries on repeat.
 */
function AiScoringControl() {
  const [rerunAll, { isLoading: starting }] = useRerunAllIscAiMutation();
  const [poll, setPoll] = useState(false);
  const { data: progress } = useGetIscAiProgressQuery(undefined, {
    pollingInterval: poll ? 4000 : 0,
  });

  // Stop polling once every application has been attempted (DB-derived, so this
  // is correct regardless of which replica served the request).
  useEffect(() => {
    if (poll && progress && progress.total > 0 && progress.remaining === 0) {
      setPoll(false);
    }
  }, [poll, progress]);

  const start = async () => {
    try {
      const res = await rerunAll({ onlyPending: true }).unwrap();
      if (res.alreadyRunning) toast('AI scoring is already running.');
      else if (res.total === 0) toast('Every application is already scored.');
      else toast(`Scoring ${res.total} application${res.total === 1 ? '' : 's'} with AI…`);
      setPoll(true);
    } catch {
      toast('Could not start AI scoring.');
    }
  };

  if (poll && progress) {
    const pct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
    return (
      <span
        className={s.aiProgress}
        title={`${progress.failed} failed · ${progress.remaining} remaining`}
      >
        <span className={s.aiSpinner} />
        Scoring {progress.completed}/{progress.total} ({pct}%)
      </span>
    );
  }
  return (
    <button className={s.btn} onClick={start} disabled={starting}>
      <Sparkles size={15} /> Score all with AI
    </button>
  );
}

export function ApplicationsPage() {
  const [openId, setOpenId] = useState<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('app') : null,
  );

  // Keep the list MOUNTED while a detail is open (just hidden) so its
  // filters / search / scroll survive the round-trip — clicking an
  // applicant and hitting "All applications" returns to the same view.
  return (
    <>
      <div style={{ display: openId ? 'none' : 'block' }}>
        <ApplicationsList onOpen={setOpenId} />
      </div>
      {openId && <ApplicationDetail openId={openId} onBack={() => setOpenId(null)} />}
    </>
  );
}

/**
 * Type a page number and jump straight to it — 171 pages is far too many to
 * click through. Commits on Enter or blur, clamps into range, and stays in
 * sync when `page` moves via Previous / Next or a filter reset.
 */
function PageJump({
  page,
  totalPages,
  onJump,
}: {
  page: number;
  totalPages: number;
  onJump: (p: number) => void;
}) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || draft.trim() === '') return setDraft(String(page));
    onJump(Math.min(totalPages, Math.max(1, Math.trunc(n))));
  };

  return (
    <input
      className={s.pageJump}
      type="number"
      min={1}
      max={totalPages}
      value={draft}
      aria-label={`Page number, 1 to ${totalPages}`}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        }
      }}
      onBlur={commit}
      onFocus={(e) => e.currentTarget.select()}
    />
  );
}

function ApplicationsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [program, setProgram] = useState('all');
  const [applicantType, setApplicantType] = useState('all');
  const [status, setStatus] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [minAiScore, setMinAiScore] = useState(0);
  const [excludeAutoRejected, setExcludeAutoRejected] = useState(false);
  const [sort, setSort] = useState<'submittedAt' | 'reviewScoreAvg' | 'aiScore'>('submittedAt');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState('');

  const PAGE_SIZE = 25;

  const { data: reviewers } = useGetIscReviewersQuery();
  const { data, isFetching } = useGetIscAdminApplicationsQuery({
    q: q || undefined,
    program: program !== 'all' ? (program as IscProgram) : undefined,
    applicantType: applicantType !== 'all' ? (applicantType as IscApplicantType) : undefined,
    status: status !== 'all' ? (status as IscApplicationStatus) : undefined,
    minScore: minScore > 0 ? minScore : undefined,
    minAiScore: minAiScore > 0 ? minAiScore : undefined,
    excludeAutoRejected: excludeAutoRejected || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });
  const [assignReviewers] = useAssignIscReviewersMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = (page - 1) * PAGE_SIZE + items.length;

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [q, program, applicantType, status, minScore, minAiScore, excludeAutoRejected, sort]);

  // default the assign-to select to the first reviewer once they load
  const effectiveAssignTo = assignTo || reviewers?.[0]?.id || '';

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const reset = () => { setQ(''); setProgram('all'); setApplicantType('all'); setStatus('all'); setMinScore(0); setMinAiScore(0); setExcludeAutoRejected(false); setSort('submittedAt'); };
  const filtersActive =
    !!q || program !== 'all' || applicantType !== 'all' || status !== 'all' || minScore > 0 || minAiScore > 0 || excludeAutoRejected || sort !== 'submittedAt';
  // Server-side exports (ranked, full detail, across ALL matching rows — not
  // just the current page). Three explicit scopes:
  const exportFilters = (): Record<string, string | number | undefined> => ({
    q: q || undefined,
    program: program !== 'all' ? program : undefined,
    applicantType: applicantType !== 'all' ? applicantType : undefined,
    status: status !== 'all' ? status : undefined,
    minScore: minScore > 0 ? minScore : undefined,
    minAiScore: minAiScore > 0 ? minAiScore : undefined,
    excludeAutoRejected: excludeAutoRejected ? 'true' : undefined,
    sort,
  });
  const exportSelected = () => {
    if (!selected.size) return toast('Select applicants to export first.');
    downloadIscExport({ ids: Array.from(selected).join(',') }, 'selected');
  };
  const exportFiltered = () => downloadIscExport(exportFilters(), 'filtered');
  const exportAll = () => downloadIscExport({}, 'all');
  const assign = async () => {
    if (!selected.size) return toast('Select applicants to assign first.');
    if (!effectiveAssignTo) return toast('No reviewer available to assign.');
    const reviewerName = reviewers?.find((r) => r.id === effectiveAssignTo)?.name ?? 'reviewer';
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          assignReviewers({ applicationId: id, reviewerUserIds: [effectiveAssignTo] }).unwrap(),
        ),
      );
      toast(`Assigned ${selected.size} application${selected.size > 1 ? 's' : ''} to ${reviewerName}.`);
      setSelected(new Set());
    } catch {
      toast('Could not assign reviewer. Please try again.');
    }
  };

  return (
    <>
      <div className={s.filters}>
        <input className={`${s.textInput} ${s.searchInput}`} placeholder="Search name or email…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <Sel value={program} onChange={setProgram} options={[['all', 'All programs'], ['bachelor', "Bachelor's"], ['master', "Master's"]]} />
        <Sel value={applicantType} onChange={setApplicantType} options={[['all', 'All types'], ['local', 'Local'], ['international', 'International']]} />
        <Sel value={status} onChange={setStatus} options={[['all', 'All statuses'], ...ALL_STATUSES.map((st) => [st, STATUS_LABEL[st] ?? st] as [string, string])]} />
        <label className={s.checkFilter} title="Hide applicants flagged as previous-season camp participants">
          <input
            type="checkbox"
            checked={excludeAutoRejected}
            onChange={(e) => setExcludeAutoRejected(e.target.checked)}
          />
          Hide auto-rejected
        </label>
        {filtersActive && (
          <button className={s.btn} onClick={reset} title="Clear all filters">
            <X size={15} /> Clear filters
          </button>
        )}
      </div>
      <div className={s.filters}>
        <label className={s.minScore}>
          Min review
          <input type="range" min={0} max={50} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
          <b>{minScore}</b>
        </label>
        <label className={s.minScore}>
          Min AI
          <input type="range" min={0} max={50} value={minAiScore} onChange={(e) => setMinAiScore(Number(e.target.value))} />
          <b>{minAiScore}</b>
        </label>
        <div className={s.sortWrap}>
          <span className={s.toolbarLabel}>Sort</span>
          <Sel
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={[['submittedAt', 'Most recent'], ['reviewScoreAvg', 'Reviewer score'], ['aiScore', 'AI score']]}
          />
        </div>
        {selected.size > 0 && (
          <button className={s.btn} onClick={exportSelected}>
            <Download size={15} /> Export selected ({selected.size})
          </button>
        )}
        {filtersActive && (
          <button className={s.btn} onClick={exportFiltered}>
            <Download size={15} /> Export filtered
          </button>
        )}
        <button className={s.btn} onClick={exportAll}>
          <Download size={15} /> Export all
        </button>
        {SHOW_AI_SCORING && <AiScoringControl />}
        <div className={s.assignCluster}>
          <span className={s.assignHint}>{selected.size} selected</span>
          <Sel value={effectiveAssignTo} onChange={setAssignTo} options={(reviewers ?? []).map((r) => [r.id, r.name] as [string, string])} />
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={assign}><UserPlus size={15} /> Assign</button>
        </div>
      </div>

      <div className={s.resultMeta}>
        {isFetching
          ? 'Loading…'
          : total === 0
            ? 'No applications'
            : `Showing ${rangeStart}–${rangeEnd} of ${total} applications`}
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Applicant</th><th>Program</th><th>Type</th><th>Grade</th><th>Submitted</th>
              <th>Status</th><th>AI</th><th>Avg</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const ai = num(a.aiScore);
              const avg = num(a.reviewScoreAvg);
              return (
                <tr key={a.id} onClick={() => onOpen(a.id)}>
                  <td onClick={(e) => { e.stopPropagation(); toggle(a.id); }}>
                    <input type="checkbox" checked={selected.has(a.id)} readOnly />
                  </td>
                  <td>
                    <div className={s.applicantCell}>
                      <Avatar initials={avatarInitials(a.fullName ?? undefined)} />
                      <div>
                        <div className={s.applicantName}>{a.fullName ?? '—'}</div>
                        <div className={s.applicantSchool}>{a.email ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={s.miniChip}>{PROGRAM_LABEL(a.program)}</span></td>
                  <td><span className={s.miniChip}>{TYPE_LABEL(a.applicantType)}</span></td>
                  <td>{draftVal(a, 'personal', 'grade')}</td>
                  <td>{a.submittedAt ? a.submittedAt.slice(0, 10) : '—'}</td>
                  <td>
                    {STATUS_LABEL[a.status] ? <StatusBadge status={a.status as any} /> : <span className={s.dim}>{a.status}</span>}
                    {a.autoRejectedAt && (
                      <span className={s.autoRejectBadge} title={a.autoRejectedReason ?? 'Auto-rejected'}>
                        Auto-rejected
                      </span>
                    )}
                  </td>
                  <td>{ai != null ? <b>{ai}</b> : <span className={s.dim}>—</span>}</td>
                  <td>{avg != null ? <b>{avg}</b> : <span className={s.dim}>—</span>}</td>
                  <td><ArrowRight size={15} className={s.rowArrow} /></td>
                </tr>
              );
            })}
            {!isFetching && items.length === 0 && (
              <tr><td colSpan={10}><div className={s.emptyText}>No applications match these filters.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button
            className={s.btn}
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ArrowLeft size={15} /> Previous
          </button>
          <span className={s.paginationInfo}>
            Page
            <PageJump page={page} totalPages={totalPages} onJump={setPage} />
            of {totalPages}
          </span>
          <button
            className={s.btn}
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ArrowRight size={15} />
          </button>
        </div>
      )}
    </>
  );
}

/* ── Application detail (the full file) ──────────────────────── */
function ApplicationDetail({ openId, onBack }: { openId: string; onBack: () => void }) {
  const { data: detail, isFetching } = useGetIscAdminApplicationQuery(openId);
  const { data: reviewers } = useGetIscReviewersQuery();
  const [assignTo, setAssignTo] = useState('');
  const [assignReviewers] = useAssignIscReviewersMutation();
  const [decide] = useDecideIscApplicationMutation();
  const [rerunAi] = useRerunIscAiEvalMutation();

  if (isFetching && !detail) return <div className={s.emptyText}>Loading…</div>;
  if (!detail) return <div className={s.emptyText}>Application not found.</div>;

  const { application, ai, reviews, assignments, decision } = detail;
  const fullName = application.fullName ?? '—';
  const grade = draftVal(application, 'personal', 'grade');
  const avg = num(application.reviewScoreAvg);
  const effectiveAssignTo = assignTo || reviewers?.[0]?.id || '';

  const reviewerName = (id: string) =>
    reviewers?.find((r) => r.id === id)?.name ?? `${id.slice(0, 8)}…`;

  const doAssign = async () => {
    if (!effectiveAssignTo) return toast('No reviewer available to assign.');
    try {
      await assignReviewers({ applicationId: application.id, reviewerUserIds: [effectiveAssignTo] }).unwrap();
      toast(`Assigned ${fullName} to ${reviewerName(effectiveAssignTo)}.`);
    } catch {
      toast('Could not assign reviewer.');
    }
  };
  const doDecide = async (d: 'accepted' | 'waitlisted' | 'rejected') => {
    try {
      await decide({ applicationId: application.id, decision: d }).unwrap();
      toast(`${d[0].toUpperCase() + d.slice(1)} ${fullName}.`);
    } catch {
      toast('Could not record decision.');
    }
  };
  const doRerun = async () => {
    try {
      await rerunAi(application.id).unwrap();
      toast('AI re-evaluation queued.');
    } catch {
      toast('Could not re-run AI evaluation.');
    }
  };

  return (
    <div className={s.detailWrap}>
      <button className={s.backBtn} onClick={onBack}><ArrowLeft size={16} /> All applications</button>

      <div className={s.detailHead}>
        <Avatar initials={avatarInitials(fullName)} big />
        <div className={s.detailHeadMeta}>
          <div className={s.detailName}>{fullName}</div>
          <div className={s.detailSub}>{application.email ?? '—'}</div>
          <div className={s.chipsRow}>
            <span className={s.miniChip}>{PROGRAM_LABEL(application.program)}</span>
            <span className={s.miniChip}>{TYPE_LABEL(application.applicantType)}</span>
            <span className={s.miniChip}>Grade {grade}</span>
            {application.submittedAt && <span className={s.miniChip}>Submitted {application.submittedAt.slice(0, 10)}</span>}
          </div>
        </div>
        {STATUS_LABEL[application.status] ? <StatusBadge status={application.status as any} /> : <span className={`${s.badge} ${s.bUnder}`}>{application.status}</span>}
      </div>

      {/* contextual actions for where this applicant sits in the pipeline */}
      <div className={s.detailActions}>
        <div className={s.actionGroup}>
          <span className={s.actionLabel}>Reviewers</span>
          <Sel value={effectiveAssignTo} onChange={setAssignTo} options={(reviewers ?? []).map((r) => [r.id, r.name] as [string, string])} />
          <button className={s.btn} onClick={doAssign}>
            <UserPlus size={15} /> Assign
          </button>
          {assignments.length > 0 && (
            <span className={s.assignedNote}>
              Currently: {assignments.map((as) => as.reviewer?.profile?.name ?? as.reviewer?.email ?? as.reviewerUserId).join(', ')}
            </span>
          )}
        </div>
        <div className={s.actionGroupRight}>
          <button className={s.btn} onClick={doRerun}>Re-run AI</button>
          {application.status === 'reviewed' && !decision && (
            <>
              <button
                className={`${s.btn} ${s.btnPrimary}`}
                disabled={!DECISIONS_ENABLED}
                title={!DECISIONS_ENABLED ? 'Decisions are on hold' : undefined}
                onClick={() => doDecide('accepted')}
              >
                Accept
              </button>
              <button
                className={`${s.btn} ${s.btnDanger}`}
                disabled={!DECISIONS_ENABLED}
                title={!DECISIONS_ENABLED ? 'Decisions are on hold' : undefined}
                onClick={() => doDecide('rejected')}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className={s.detailGrid}>
        {/* left — what the applicant submitted */}
        <div>
          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Personal & contact</div>
            <div className={s.kvGrid}>
              <KV k="Email" v={draftVal(application, 'personal', 'email')} />
              <KV k="Phone" v={draftVal(application, 'personal', 'phone')} />
              <KV k="Telegram" v={draftVal(application, 'personal', 'telegram')} />
              <KV k="Passport" v={draftVal(application, 'personal', 'passportNumber')} />
              <KV k="Age" v={draftVal(application, 'personal', 'age')} />
              {application.program === 'master'
                ? <KV k="Country of residence" v={draftVal(application, 'personal', 'countryOfResidence')} />
                : <KV k="Grade" v={draftVal(application, 'personal', 'grade')} />}
              {application.program !== 'master' && application.applicantType === 'international' && (
                <KV k="Country of residence" v={draftVal(application, 'personal', 'countryOfResidence')} />
              )}
            </div>
          </div>

          {application.program === 'master' ? (
            <div className={s.infoBlock}>
              <div className={s.infoLabel}>Current education</div>
              <div className={s.kvGrid}>
                <KV k="University" v={draftVal(application, 'academics', 'university')} />
                <KV k="Degree / field" v={draftVal(application, 'academics', 'degree')} />
                <KV k="Expected graduation" v={draftVal(application, 'academics', 'gradYear')} />
                <KV k="GPA / standing" v={draftVal(application, 'academics', 'gpa')} />
                <KV k="GRE" v={draftVal(application, 'academics', 'gre')} />
                <KV k="GMAT" v={draftVal(application, 'academics', 'gmat')} />
                <KV k="English test" v={draftVal(application, 'academics', 'englishTest')} />
                <KV k="English score" v={draftVal(application, 'academics', 'englishScore')} />
              </div>
            </div>
          ) : (
            <div className={s.infoBlock}>
              <div className={s.infoLabel}>Academics</div>
              <div className={s.kvGrid}>
                <KV k="English test" v={draftVal(application, 'academics', 'englishTest')} />
                <KV k="English score" v={draftVal(application, 'academics', 'englishScore')} />
                <KV k="SAT score" v={draftVal(application, 'academics', 'satScore')} />
              </div>
            </div>
          )}

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Extracurricular activities & achievements</div>
            <div className={s.infoText}>{draftVal(application, 'activities', 'extracurriculars')}</div>
            <div className={s.infoText} style={{ marginTop: 8 }}>{draftVal(application, 'activities', 'awards')}</div>
          </div>

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Essay 1 — why this camp</div>
            <div className={s.infoText}>{draftVal(application, 'essays', 'whyCamp')}</div>
          </div>
          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Essay 2 — why select you</div>
            <div className={s.infoText}>{draftVal(application, 'essays', 'whySelect')}</div>
          </div>

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Uploaded documents</div>
            <div className={s.docList}>
              <DocLink label="Passport (photo page)" present={!!draftRaw(application, 'personal', 'passportPath')} href={docDownloadUrl(application.id, 'passport')} />
              {application.program === 'master' ? (
                <>
                  <DocLink label="CV / résumé" present={!!draftRaw(application, 'academics', 'cvPath')} href={docDownloadUrl(application.id, 'cv')} />
                  <DocLink label="English proficiency certificate" present={!!draftRaw(application, 'academics', 'certificatePath')} href={docDownloadUrl(application.id, 'english')} />
                </>
              ) : (
                <>
                  <DocLink label="English proficiency certificate" present={!!draftRaw(application, 'academics', 'certificatePath')} href={docDownloadUrl(application.id, 'english')} />
                  <DocLink label="SAT / standardized report" present={!!draftRaw(application, 'academics', 'satReportPath')} href={docDownloadUrl(application.id, 'sat')} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* right — AI pre-eval + human reviews */}
        <div>
          {ai && ai.status === 'completed' ? (
            <div className={s.aiPanel}>
              <div className={s.aiHead}>
                <span aria-hidden>✦</span> AI pre-evaluation
                <span className={s.aiTotalPill}>{ai.scores?.total ?? 0} / 50</span>
              </div>
              <div className={s.aiScores}>
                {SCORE_DIMENSIONS.map(({ key, label }) => (
                  <span key={key} className={s.aiScoreItem}>
                    {label.split(' ')[0]}: <b>{(ai.scores as any)?.[key] ?? '—'}</b>
                  </span>
                ))}
              </div>
              {ai.summary && <div className={s.aiSummary}>{ai.summary}</div>}
              <AiAssessmentDetails assessment={ai.assessment} />
              {(ai.flags ?? []).map((f, i) => (
                <div key={i} className={`${s.aiFlag} ${f.severity === 'high' ? s.aiFlagHigh : ''}`}>
                  ⚑ <b>{(f.type || 'note').replace(/-/g, ' ').toUpperCase()}</b>
                  {f.severity ? ` · ${f.severity}` : ''} — {f.detail}
                </div>
              ))}
              {ai.model && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
                  Advisory only · generated by {ai.model} · never auto-decides
                </div>
              )}
            </div>
          ) : (
            <div className={s.aiPanel}>
              <div className={s.aiHead}>
                <span aria-hidden>✦</span> AI pre-evaluation
              </div>
              <div className={s.aiSummary}>
                AI evaluation {ai?.status ?? 'pending'}
                {ai?.status === 'failed' && ai?.error ? ` — ${ai.error}` : ''}
                {ai?.status === 'failed' ? ' · use “Re-run AI” to retry.' : ''}
              </div>
            </div>
          )}

          <div className={s.reviewsHead}>
            <span>Reviewer scores</span>
            {avg != null && <span className={s.reviewsAvg}>Avg {avg} / 50</span>}
          </div>
          {reviews.length === 0 ? (
            <div className={s.notReviewed}>Not yet reviewed. Assign a reviewer to begin.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className={s.reviewCard}>
                <div className={s.reviewCardHead}>
                  <span className={s.reviewerLabel}>{reviewerName(r.reviewerUserId)}</span>
                  <RecBadge rec={r.recommendation} />
                  <span className={s.reviewTotal}>{r.total} / 50</span>
                </div>
                {SCORE_DIMENSIONS.map(({ key, label }) => (
                  <BarRow key={key} label={label.split(' ')[0]} value={(r as any)[key] ?? 0} max={10} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.kvItem}>
      <div className={s.kvK}>{k}</div>
      <div className={s.kvV}>{v}</div>
    </div>
  );
}

function DocLink({ label, present, href }: { label: string; present: boolean; href: string }) {
  if (!present) {
    return <div className={s.docMissing}>{label} — not uploaded</div>;
  }
  return (
    <a className={s.docLink} href={href} target="_blank" rel="noreferrer">
      <FileText size={15} /> {label}
      <ArrowRight size={13} className={s.docArrow} />
    </a>
  );
}


/* ── Final decisions ────────────────────────────────────────── */
const DECISION_STATUS_OPTS: string[][] = [
  ['reviewed', 'Awaiting decision'],
  ['accepted', 'Accepted'],
  ['waitlisted', 'Waitlisted'],
  ['rejected', 'Not selected'],
  ['all', 'All (decision stage)'],
];
const DECISION_SORT_OPTS: string[][] = [
  ['reviewScoreAvg', 'Reviewer score'],
  ['aiScore', 'AI score'],
  ['submittedAt', 'Most recent'],
];

export function FinalDecisionsPage() {
  const [status, setStatus] = useState('reviewed');
  const [sort, setSort] = useState<'reviewScoreAvg' | 'aiScore' | 'submittedAt'>('reviewScoreAvg');
  const [minScore, setMinScore] = useState('');
  const [minAiScore, setMinAiScore] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = {
    ...(status !== 'all' ? { status: status as IscApplicationStatus } : {}),
    ...(minScore ? { minScore: Number(minScore) } : {}),
    ...(minAiScore ? { minAiScore: Number(minAiScore) } : {}),
  };
  // 100 rows is the backend cap — plenty to rank a decision cohort on one page.
  const { data, isFetching } = useGetIscAdminApplicationsQuery({ ...filters, sort, page: 1, limit: 100 });
  const items = data?.items ?? [];
  const effectiveSelId = selId && items.some((i) => i.id === selId) ? selId : items[0]?.id ?? null;

  // Server-side CSV so the export is the FULL ranked set (all filtered rows +
  // rank + decision), not just what's on screen. `filtered=false` exports every
  // application (the "default" export).
  const download = async (filtered: boolean) => {
    setExporting(true);
    await downloadIscExport(
      filtered ? { ...filters, sort } : {},
      filtered ? 'filtered' : 'all',
    );
    setExporting(false);
  };

  return (
    <div>
      <div className={s.decisionToolbar}>
        <Sel value={status} onChange={setStatus} options={DECISION_STATUS_OPTS} />
        <div className={s.sortWrap}>
          <span className={s.toolbarLabel}>Rank by</span>
          <Sel value={sort} onChange={(v) => setSort(v as typeof sort)} options={DECISION_SORT_OPTS} />
        </div>
        <input
          className={s.miniInput}
          type="number"
          min={0}
          max={50}
          placeholder="Min review"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
        <input
          className={s.miniInput}
          type="number"
          min={0}
          max={50}
          placeholder="Min AI"
          value={minAiScore}
          onChange={(e) => setMinAiScore(e.target.value)}
        />
        <div className={s.toolbarSpacer} />
        <button className={s.btn} disabled={exporting} onClick={() => download(true)}>
          <Download size={15} /> Export filtered
        </button>
        <button className={s.btn} disabled={exporting} onClick={() => download(false)}>
          <Download size={15} /> Export all
        </button>
      </div>

      <div className={s.splitLayout}>
        <div className={`${s.listCard} ${s.decisionCol}`}>
          <h3 className={s.cardTitle}>
            Ranked applicants <span className={s.countPill}>{items.length}</span>
          </h3>
          {isFetching && items.length === 0 ? (
            <div className={s.emptyText}>Loading…</div>
          ) : items.length === 0 ? (
            <Empty text="No applicants match these filters." />
          ) : (
            <div className={s.decisionRows}>
              {items.map((a, i) => {
                const avg = num(a.reviewScoreAvg);
                return (
                  <div
                    key={a.id}
                    className={`${s.decisionRow} ${effectiveSelId === a.id ? s.selected : ''}`}
                    onClick={() => setSelId(a.id)}
                  >
                    <span className={s.rankNum}>{i + 1}</span>
                    <Avatar initials={avatarInitials(a.fullName ?? undefined)} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className={s.applicantName}>{a.fullName ?? '—'}</div>
                      <div className={s.rowMeta}>
                        {PROGRAM_LABEL(a.program)} · Review {avg ?? '—'} · AI {num(a.aiScore) ?? '—'}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {effectiveSelId ? (
          <DecisionDetail selectedId={effectiveSelId} />
        ) : (
          <div className={`${s.listCard} ${s.decisionCol}`}>
            <h3 className={s.cardTitle}>Decision</h3>
            <Empty text="Select an applicant to review the combined scores and make a decision." />
          </div>
        )}
      </div>
    </div>
  );
}

const DECIDE_LABEL: Record<'accepted' | 'waitlisted' | 'rejected', string> = {
  accepted: 'Accepted',
  waitlisted: 'Waitlisted',
  rejected: 'Not selected',
};

function DecisionDetail({ selectedId }: { selectedId: string }) {
  const { data: detail, isFetching } = useGetIscAdminApplicationQuery(selectedId);
  const { data: reviewers } = useGetIscReviewersQuery();
  const [decide, { isLoading: deciding }] = useDecideIscApplicationMutation();
  const [rationale, setRationale] = useState('');
  // Prefill the rationale from the existing decision once per applicant, and
  // never clobber what the admin is typing on a background refetch.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (detail && loadedFor.current !== selectedId) {
      loadedFor.current = selectedId;
      setRationale(detail.decision?.rationale ?? '');
    }
  }, [detail, selectedId]);

  if (isFetching && !detail) return <div className={s.listCard}><div className={s.emptyText}>Loading…</div></div>;
  if (!detail) return <div className={s.listCard}><div className={s.emptyText}>Not found.</div></div>;

  const { application, reviews, decision } = detail;
  const fullName = application.fullName ?? '—';
  const reviewAvg = num(application.reviewScoreAvg);
  const reviewerName = (id: string) => reviewers?.find((r) => r.id === id)?.name ?? `${id.slice(0, 8)}…`;
  const current = decision?.decision ?? null;

  const doDecide = async (d: 'accepted' | 'waitlisted' | 'rejected') => {
    try {
      await decide({ applicationId: application.id, decision: d, rationale: rationale.trim() || undefined }).unwrap();
      toast(`${DECIDE_LABEL[d]} — ${fullName}.`);
    } catch {
      toast('Could not record decision.');
    }
  };

  return (
    <div className={s.listCard}>
      <div className={s.detailHead} style={{ marginBottom: 16 }}>
        <Avatar initials={avatarInitials(fullName)} big />
        <div className={s.detailHeadMeta}>
          <div className={s.detailName} style={{ fontSize: '1.15rem' }}>{fullName}</div>
          <div className={s.detailSub}>{PROGRAM_LABEL(application.program)} · {TYPE_LABEL(application.applicantType)} · Grade {draftVal(application, 'personal', 'grade')}</div>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className={s.scoreStatRow}>
        <ScoreStat label="Review avg" value={`${reviewAvg ?? '—'} / 50`} />
        <ScoreStat label="AI score" value={`${num(application.aiScore) ?? '—'} / 50`} />
      </div>

      {current && (
        <div className={s.currentDecision}>
          Current decision: <strong>{DECIDE_LABEL[current]}</strong>. You can change it below —
          decisions stay editable for corrections.
        </div>
      )}

      <div className={s.infoBlock}>
        <div className={s.infoLabel}>Reviewer recommendations</div>
        {reviews.map((r) => (
          <div key={r.id} className={s.recLine}>
            <span className={s.recWho}>{reviewerName(r.reviewerUserId)}</span>
            <RecBadge rec={r.recommendation} />
            <span className={s.recScore}>{r.total} / 50</span>
          </div>
        ))}
        {reviews.length === 0 && <div className={s.dim}>No reviewer recommendations yet.</div>}
      </div>

      <div className={s.infoBlock}>
        <div className={s.infoLabel}>Essay — why this camp</div>
        <div className={s.infoText}>{draftVal(application, 'essays', 'whyCamp')}</div>
      </div>

      <textarea
        className={s.notesArea}
        placeholder="Decision rationale (internal)…"
        style={{ marginBottom: 10 }}
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
      />
      <p className={s.decisionNote}>
        {DECISIONS_ENABLED
          ? "Reviewers score and recommend — the final decision is the admissions team's call, and can be changed later."
          : 'Final decisions are on hold while the cohort is being triaged. Reviewer scores and recommendations keep coming in.'}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className={`${s.btn} ${s.btnPrimary} ${current === 'accepted' ? s.decisionActive : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={deciding || !DECISIONS_ENABLED}
          title={!DECISIONS_ENABLED ? 'Decisions are on hold' : undefined}
          onClick={() => doDecide('accepted')}
        >
          {current === 'accepted' ? '✓ Accepted' : 'Accept'}
        </button>
        <button
          className={`${s.btn} ${current === 'waitlisted' ? s.decisionActive : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={deciding || !DECISIONS_ENABLED}
          title={!DECISIONS_ENABLED ? 'Decisions are on hold' : undefined}
          onClick={() => doDecide('waitlisted')}
        >
          {current === 'waitlisted' ? '✓ Waitlisted' : 'Waitlist'}
        </button>
        <button
          className={`${s.btn} ${s.btnDanger} ${current === 'rejected' ? s.decisionActive : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={deciding || !DECISIONS_ENABLED}
          title={!DECISIONS_ENABLED ? 'Decisions are on hold' : undefined}
          onClick={() => doDecide('rejected')}
        >
          {current === 'rejected' ? '✓ Not selected' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

function ScoreStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={s.kvK}>{label}</div>
      <div className={s.kvV} style={{ fontSize: '1.2rem' }}>{value}</div>
    </div>
  );
}

/* ── Reviewers (manage team · list ↔ detail) ────────────────── */
export function ReviewersPage() {
  const { data: reviewers } = useGetIscReviewersQuery();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string; remaining: number } | null>(null);
  const [revokeReviewer] = useRevokeIscReviewerMutation();

  if (openId) {
    const r = reviewers?.find((x) => x.id === openId);
    if (r) return <ReviewerDetail reviewerId={r.id} name={r.name} onBack={() => setOpenId(null)} />;
  }

  const rows = reviewers ?? [];

  const removeReviewer = async (id: string, name: string) => {
    try {
      await revokeReviewer(id).unwrap();
      toast(`Removed ${name} from the review team.`);
    } catch {
      toast('Could not remove reviewer.');
    }
  };

  return (
    <>
      <div className={s.toolbarRow}>
        <span className={s.resultMeta} style={{ margin: 0 }}>{rows.length} reviewers on the team</span>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setAdding(true)}><UserPlus size={15} /> Add reviewer</button>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Reviewer</th><th>Assigned</th><th>Reviewed</th><th>Remaining</th><th>Avg. score given</th><th>Progress</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = r.assigned ? Math.round((r.reviewed / r.assigned) * 100) : 0;
              return (
                <tr key={r.id} onClick={() => setOpenId(r.id)}>
                  <td><span className={s.applicantName}>{r.name}</span></td>
                  <td>{r.assigned}</td>
                  <td>{r.reviewed}</td>
                  <td>{r.remaining}</td>
                  <td>{r.avgScoreGiven || '—'}</td>
                  <td style={{ minWidth: 160 }}>
                    <div className={s.barTrack}><div className={`${s.barFill} ${s.fillGreen}`} style={{ width: `${pct}%` }} /></div>
                    <div className={s.rowMeta} style={{ marginTop: 4 }}>{pct}%</div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ width: 56, textAlign: 'right' }}>
                    <RowMenu
                      onOpen={() => setOpenId(r.id)}
                      onRemove={() => setPendingRemove({ id: r.id, name: r.name, remaining: r.remaining })}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7}><div className={s.emptyText}>No reviewers on the team yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddReviewerDialog onClose={() => setAdding(false)} />
      )}
      {pendingRemove && (
        <ConfirmDialog
          title={`Remove ${pendingRemove.name} as a reviewer?`}
          body={
            pendingRemove.remaining > 0
              ? `They have ${pendingRemove.remaining} application(s) still pending review. Those will be unassigned and need reassigning to another reviewer. The Reviewer role will be revoked.`
              : `Their Reviewer role will be revoked. They'll lose access to the review queue. Completed reviews are kept.`
          }
          confirmLabel="Remove reviewer"
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => { removeReviewer(pendingRemove.id, pendingRemove.name); setPendingRemove(null); }}
        />
      )}
    </>
  );
}

function RowMenu({ onOpen, onRemove }: { onOpen: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    }
    setOpen((o) => !o);
  };

  return (
    <div className={s.menuWrap}>
      <button ref={btnRef} className={s.kebabBtn} title="Actions" onClick={toggle}>
        <MoreVertical size={17} />
      </button>
      {open &&
        createPortal(
          <>
            <div className={s.menuBackdrop} onClick={() => setOpen(false)} />
            <div className={s.menu} style={{ position: 'fixed', top: pos.top, right: pos.right }}>
              <button className={s.menuItem} onClick={() => { setOpen(false); onOpen(); }}>
                <ArrowRight size={14} /> Open reviewer
              </button>
              <button className={`${s.menuItem} ${s.menuItemDanger}`} onClick={() => { setOpen(false); onRemove(); }}>
                <Trash2 size={14} /> Remove from team
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function AddReviewerDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [grantByEmail, { isLoading }] = useGrantIscReviewerByEmailMutation();

  const grant = async () => {
    const e = email.trim();
    if (!e) return toast('Enter the reviewer’s email first.');
    try {
      const res = await grantByEmail(e).unwrap();
      if (res?.ok === false) {
        toast(res.message ?? 'Could not grant the Reviewer role.');
        return;
      }
      toast(`Granted the Reviewer role to ${res?.reviewer?.name ?? e}.`);
      onClose();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      toast(status === 404 ? 'No TopCoach account found with that email.' : 'Could not grant the Reviewer role.');
    }
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={s.modalTitle}>Add a reviewer</h3>
        <p className={s.modalBody} style={{ marginBottom: 14 }}>
          Grant the Reviewer role to an existing TopCoach account by email. They'll get access to
          the review queue for applications you assign them.
        </p>
        <input className={s.textInput} type="email" style={{ width: '100%', marginBottom: 8 }}
          placeholder="reviewer@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') grant(); }} autoFocus />
        <p className={s.modalBody} style={{ marginBottom: 14, fontSize: 12.5 }}>
          The person must already have a TopCoach account with this email.
        </p>
        <div className={s.modalActions}>
          <button className={s.btn} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={grant} disabled={isLoading}>
            <UserPlus size={14} /> {isLoading ? 'Granting…' : 'Grant'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewerDetail({ reviewerId, name, onBack }: { reviewerId: string; name: string; onBack: () => void }) {
  const { data: reviewers } = useGetIscReviewersQuery();
  const { data, isFetching } = useGetIscAdminApplicationsQuery({ reviewerUserId: reviewerId, page: 1 });
  const st = reviewers?.find((r) => r.id === reviewerId);
  const assigned = data?.items ?? [];

  return (
    <div className={s.detailWrap}>
      <button className={s.backBtn} onClick={onBack}><ArrowLeft size={16} /> All reviewers</button>
      <div className={s.detailHead}>
        <Avatar initials={avatarInitials(name)} big />
        <div className={s.detailHeadMeta}>
          <div className={s.detailName}>{name}</div>
          <div className={s.detailSub}>
            {st ? `${st.assigned} assigned · ${st.reviewed} reviewed · ${st.remaining} remaining · avg ${st.avgScoreGiven || '—'}` : '—'}
          </div>
        </div>
      </div>
      <div className={s.infoLabel} style={{ marginBottom: 10 }}>Assigned applications</div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Applicant</th><th>Program</th><th>Grade</th><th>Status</th><th>AI</th><th>Avg</th></tr>
          </thead>
          <tbody>
            {assigned.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className={s.applicantCell}>
                    <Avatar initials={avatarInitials(a.fullName ?? undefined)} />
                    <span className={s.applicantName}>{a.fullName ?? '—'}</span>
                  </div>
                </td>
                <td>{PROGRAM_LABEL(a.program)}</td>
                <td>{draftVal(a, 'personal', 'grade')}</td>
                <td>{STATUS_LABEL[a.status] ? <StatusBadge status={a.status as any} /> : <span className={s.dim}>{a.status}</span>}</td>
                <td>{num(a.aiScore) != null ? <b>{num(a.aiScore)}</b> : <span className={s.dim}>—</span>}</td>
                <td>{num(a.reviewScoreAvg) != null ? <b>{num(a.reviewScoreAvg)}</b> : <span className={s.dim}>—</span>}</td>
              </tr>
            ))}
            {!isFetching && assigned.length === 0 && (
              <tr><td colSpan={6}><div className={s.emptyText}>No applications assigned to this reviewer.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── shared ─────────────────────────────────────────────────── */
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <select className={s.selectInput} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className={s.emptyState}>
      <Inbox size={36} />
      <div className={s.emptyStateText}>{text}</div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className={s.modalOverlay} onClick={onCancel}>
      <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={s.modalTitle}>{title}</h3>
        <p className={s.modalBody}>{body}</p>
        <div className={s.modalActions}>
          <button className={s.btn} onClick={onCancel}>{cancelLabel}</button>
          <button className={`${s.btn} ${s.btnDanger}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
