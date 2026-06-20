// ISC 2026 — superadmin console pages.
//
// Pipeline (Shortlist removed): Applications → Interviews → Final decisions.
// Applications is the hub: a list of every submission that opens a full
// applicant file (what they submitted + AI pre-eval + reviewer scores +
// the admin actions that move them through the pipeline).
//
// Wired to the real backend through RTK Query (iscAdmissionsApi). The real
// form collects less than the original mock: no region / school / GPA — we
// surface program + applicantType + grade instead.
import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Video, Inbox, ArrowLeft, UserPlus, ArrowRight, Pencil, Trash2, X, MoreVertical } from 'lucide-react';
import s from './isc.module.scss';
import {
  SCORE_DIMENSIONS,
  STATUS_LABEL,
} from './types';
import { Avatar, BarRow, RecBadge, StatusBadge } from './components';
import {
  useGetIscAdminStatsQuery,
  useGetIscAdminApplicationsQuery,
  useGetIscAdminApplicationQuery,
  useGetIscAdminInterviewsQuery,
  useGetIscReviewersQuery,
  useAssignIscReviewersMutation,
  useScheduleIscInterviewMutation,
  useUpdateIscInterviewMutation,
  useCancelIscInterviewMutation,
  useRecordIscInterviewEvalMutation,
  useDecideIscApplicationMutation,
  useRerunIscAiEvalMutation,
  useGrantIscReviewerByEmailMutation,
  useRevokeIscReviewerMutation,
  IscApplicationRow,
  IscApplicationStatus,
  IscProgram,
  IscApplicantType,
  IscReviewerRow,
  IscAdminApplicationDetail,
  IscInterviewRow,
} from '../../app/services/iscAdmissionsApi';

const ALL_STATUSES: IscApplicationStatus[] = [
  'submitted', 'under_review', 'reviewed',
  'interview_scheduled', 'interview_completed', 'accepted', 'waitlisted', 'rejected',
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
  { key: 'interview_scheduled', label: 'Interview scheduled' },
  { key: 'interview_completed', label: 'Interview completed' },
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
    { label: 'Ready to schedule an interview', n: byStatus.reviewed ?? 0, hint: 'Reviewed · no interview booked yet', nav: 'interviews', tone: 'amber' as const },
    { label: 'Awaiting a final decision', n: byStatus.interview_completed ?? 0, hint: 'Interview done · needs accept / waitlist / reject', nav: 'decisions', tone: 'green' as const },
  ];

  return (
    <>
      {/* KPI strip */}
      <div className={s.kpiRow}>
        <Kpi label="Total applications" value={total} sub="this cohort" />
        <Kpi label="Awaiting review" value={stats.awaitingReview} sub="submitted + in review" tone="amber" />
        <Kpi label="In interview" value={stats.inInterview} sub="scheduled + completed" />
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
export function ApplicationsPage() {
  const [openId, setOpenId] = useState<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('app') : null,
  );

  if (openId) return <ApplicationDetail openId={openId} onBack={() => setOpenId(null)} />;
  return <ApplicationsList onOpen={setOpenId} />;
}

function ApplicationsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [program, setProgram] = useState('all');
  const [applicantType, setApplicantType] = useState('all');
  const [status, setStatus] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState('');

  const { data: reviewers } = useGetIscReviewersQuery();
  const { data, isFetching } = useGetIscAdminApplicationsQuery({
    q: q || undefined,
    program: program !== 'all' ? (program as IscProgram) : undefined,
    applicantType: applicantType !== 'all' ? (applicantType as IscApplicantType) : undefined,
    status: status !== 'all' ? (status as IscApplicationStatus) : undefined,
    minScore: minScore > 0 ? minScore : undefined,
    sort: 'submittedAt',
    page: 1,
  });
  const [assignReviewers] = useAssignIscReviewersMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // default the assign-to select to the first reviewer once they load
  const effectiveAssignTo = assignTo || reviewers?.[0]?.id || '';

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const reset = () => { setQ(''); setProgram('all'); setApplicantType('all'); setStatus('all'); setMinScore(0); };
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
      </div>
      <div className={s.filters}>
        <label className={s.minScore}>
          Min score
          <input type="range" min={0} max={50} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
          <b>{minScore}</b>
        </label>
        <button className={s.btn} onClick={reset}>Reset</button>
        <div className={s.assignCluster}>
          <span className={s.assignHint}>{selected.size} selected</span>
          <Sel value={effectiveAssignTo} onChange={setAssignTo} options={(reviewers ?? []).map((r) => [r.id, r.name] as [string, string])} />
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={assign}><UserPlus size={15} /> Assign</button>
        </div>
      </div>

      <div className={s.resultMeta}>{isFetching ? 'Loading…' : `Showing ${items.length} of ${total} applications`}</div>

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
                  <td>{STATUS_LABEL[a.status] ? <StatusBadge status={a.status as any} /> : <span className={s.dim}>{a.status}</span>}</td>
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
          {application.status === 'interview_completed' && !decision && (
            <>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => doDecide('accepted')}>Accept</button>
              <button className={`${s.btn} ${s.btnDanger}`} onClick={() => doDecide('rejected')}>Reject</button>
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
              <KV k="Grade" v={draftVal(application, 'personal', 'grade')} />
            </div>
          </div>

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Academics</div>
            <div className={s.kvGrid}>
              <KV k="English test" v={draftVal(application, 'academics', 'englishTest')} />
              <KV k="English score" v={draftVal(application, 'academics', 'englishScore')} />
              <KV k="SAT score" v={draftVal(application, 'academics', 'satScore')} />
            </div>
          </div>

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
              {(ai.flags ?? []).map((f, i) => (
                <div key={i} className={`${s.aiFlag} ${f.severity === 'high' ? s.aiFlagHigh : ''}`}>
                  ⚑ {f.detail}
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
              <div className={s.aiSummary}>AI evaluation {ai?.status ?? 'pending'}</div>
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

/* ── Interviews ─────────────────────────────────────────────── */
const BLANK_FORM = { applicationId: '', date: '2026-06-20', time: '09:00', interviewerName: 'Dr. Sato', link: 'https://zoom.us/j/8842910334' };

export function InterviewsPage() {
  const { data: interviewsData } = useGetIscAdminInterviewsQuery();
  const { data: readyData } = useGetIscAdminApplicationsQuery({ status: 'reviewed', page: 1 });

  const [scheduleInterview] = useScheduleIscInterviewMutation();
  const [updateInterview] = useUpdateIscInterviewMutation();
  const [cancelInterview] = useCancelIscInterviewMutation();

  const rows = interviewsData?.interviews ?? [];
  const scheduled = rows.filter((r) => r.interview.status === 'scheduled');
  const pending = rows.filter((r) => r.interview.status === 'completed');
  const readyForInterview = readyData?.items ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; date: string; time: string } | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const setF = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const resetForm = () => { setEditingId(null); setForm({ ...BLANK_FORM }); };

  // default applicant select to the first ready applicant
  const effectiveAppId = form.applicationId || readyForInterview[0]?.id || '';

  const save = async () => {
    if (editingId) {
      try {
        await updateInterview({
          id: editingId,
          body: {
            scheduledAt: `${form.date}T${form.time}:00`,
            interviewerName: form.interviewerName,
            meetingLink: form.link,
          },
        }).unwrap();
        toast('Interview updated.');
        resetForm();
      } catch {
        toast('Could not update interview.');
      }
      return;
    }
    if (!effectiveAppId) return toast('No applicant ready to schedule.');
    try {
      await scheduleInterview({
        applicationId: effectiveAppId,
        scheduledAt: `${form.date}T${form.time}:00`,
        interviewerName: form.interviewerName,
        meetingLink: form.link,
      }).unwrap();
      toast('Interview slot created · applicant notified.');
      resetForm();
    } catch {
      toast('Could not schedule interview.');
    }
  };

  const edit = (iv: IscInterviewRow, name: string) => {
    setEditingId(iv.id);
    setForm({
      applicationId: iv.applicationId,
      date: iv.scheduledAt ? iv.scheduledAt.slice(0, 10) : BLANK_FORM.date,
      time: iv.scheduledAt ? iv.scheduledAt.slice(11, 16) : BLANK_FORM.time,
      interviewerName: iv.interviewerName ?? '',
      link: iv.meetingLink ?? '',
    });
    void name;
  };

  const del = async (id: string) => {
    try {
      await cancelInterview(id).unwrap();
      if (editingId === id) resetForm();
      toast('Interview cancelled · applicant notified.');
    } catch {
      toast('Could not cancel interview.');
    }
  };

  const editingName = editingId
    ? rows.find((r) => r.interview.id === editingId)?.applicant?.fullName ?? ''
    : '';

  return (
    <div className={s.splitLayout}>
      <div>
        <div className={s.listCard} style={{ marginBottom: 18 }}>
          <div className={s.formCardHead}>
            <h3 className={s.cardTitle} style={{ margin: 0 }}>{editingId ? 'Edit interview' : 'Schedule an interview'}</h3>
            {editingId && <button className={s.btnGhost} onClick={resetForm}><X size={14} /> Cancel edit</button>}
          </div>
          <Lbl t="Applicant">
            {editingId ? (
              <input className={s.textInput} style={{ width: '100%' }} value={editingName} readOnly />
            ) : (
              <select className={s.selectInput} style={{ width: '100%' }} value={effectiveAppId} onChange={(e) => setF({ applicationId: e.target.value })}>
                {readyForInterview.length === 0 && <option value="">No applicants ready</option>}
                {readyForInterview.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName ?? '—'} — {PROGRAM_LABEL(a.program)} (avg {num(a.reviewScoreAvg) ?? '—'})
                  </option>
                ))}
              </select>
            )}
          </Lbl>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Lbl t="Date"><input className={s.textInput} style={{ width: '100%' }} value={form.date} onChange={(e) => setF({ date: e.target.value })} /></Lbl>
            <Lbl t="Time"><input className={s.textInput} style={{ width: '100%' }} value={form.time} onChange={(e) => setF({ time: e.target.value })} /></Lbl>
          </div>
          <Lbl t="Interviewer"><input className={s.textInput} style={{ width: '100%' }} value={form.interviewerName} onChange={(e) => setF({ interviewerName: e.target.value })} /></Lbl>
          <Lbl t="Meeting link"><input className={s.textInput} style={{ width: '100%' }} value={form.link} onChange={(e) => setF({ link: e.target.value })} /></Lbl>
          <button className={`${s.btn} ${s.btnPrimary}`} style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
            {editingId ? 'Update interview' : 'Create slot & notify applicant'}
          </button>
        </div>

        <div className={s.listCard}>
          <h3 className={s.cardTitle}>Scheduled interviews</h3>
          {scheduled.length === 0 && <Empty text="No interviews scheduled yet." />}
          {scheduled.map(({ interview: iv, applicant }) => {
            const name = applicant?.fullName ?? '—';
            const date = iv.scheduledAt ? iv.scheduledAt.slice(0, 10) : '—';
            const time = iv.scheduledAt ? iv.scheduledAt.slice(11, 16) : '—';
            return (
              <div key={iv.id} className={`${s.scheduleRow} ${editingId === iv.id ? s.selected : ''}`}>
                <Calendar size={18} color="#6b7280" />
                <div className={s.scheduleBody}>
                  <div className={s.applicantName}>{name}</div>
                  <div className={s.rowMeta}>{date} · {time}{iv.interviewerName ? ` · ${iv.interviewerName}` : ''}</div>
                </div>
                <span className={`${s.badge} ${s.bInterview}`}><Video size={12} style={{ marginRight: 4 }} /> Zoom</span>
                <button className={s.iconBtn} title="Edit" onClick={() => edit(iv, name)}><Pencil size={15} /></button>
                <button className={`${s.iconBtn} ${s.iconBtnDanger}`} title="Cancel interview" onClick={() => setPendingDelete({ id: iv.id, name, date, time })}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Cancel this interview?"
          body={`The interview with ${pendingDelete.name} on ${pendingDelete.date} at ${pendingDelete.time} will be removed and the applicant will be notified. This can't be undone.`}
          confirmLabel="Cancel interview"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { del(pendingDelete.id); setPendingDelete(null); }}
        />
      )}

      <div className={s.listCard}>
        <h3 className={s.cardTitle}>Pending evaluation</h3>
        {pending.length === 0 && <Empty text="No interviews awaiting evaluation." />}
        {pending.map(({ interview: iv, applicant }) => (
          <PendingEvalBlock key={iv.id} interview={iv} name={applicant?.fullName ?? '—'} />
        ))}
      </div>
    </div>
  );
}

function PendingEvalBlock({ interview, name }: { interview: IscInterviewRow; name: string }) {
  const [recordEval] = useRecordIscInterviewEvalMutation();
  const dims: { key: 'communication' | 'leadership' | 'criticalThinking' | 'motivation' | 'campFit'; label: string }[] = [
    { key: 'communication', label: 'Communication' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'criticalThinking', label: 'Critical thinking' },
    { key: 'motivation', label: 'Motivation' },
    { key: 'campFit', label: 'Camp fit' },
  ];
  const [vals, setVals] = useState({ communication: 7, leadership: 7, criticalThinking: 8, motivation: 9, campFit: 8 });
  const [notes, setNotes] = useState('');

  const save = async () => {
    try {
      await recordEval({ id: interview.id, body: { ...vals, notes } }).unwrap();
      toast('Interview evaluation saved.');
    } catch {
      toast('Could not save evaluation.');
    }
  };

  return (
    <div className={s.pendingBlock}>
      <div className={s.pendingHead}>
        <Avatar initials={avatarInitials(name)} />
        <div>
          <div className={s.applicantName}>{name}</div>
          <div className={s.rowMeta}>{interview.scheduledAt ? fmtDate(interview.scheduledAt) : '—'}{interview.interviewerName ? ` with ${interview.interviewerName}` : ''}</div>
        </div>
        <span className={`${s.badge} ${s.bInterview}`} style={{ marginLeft: 'auto' }}>Completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {dims.map((d) => (
          <div key={d.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: '#4b5563', fontWeight: 600 }}>{d.label}</span>
              <span style={{ color: '#6b7280', fontWeight: 700 }}>{vals[d.key]} / 10</span>
            </div>
            <input className={s.slider} type="range" min={0} max={10} value={vals[d.key]}
              onChange={(e) => setVals((v) => ({ ...v, [d.key]: Number(e.target.value) }))} />
          </div>
        ))}
      </div>
      <textarea className={s.notesArea} placeholder="Notes on this candidate's interview…" style={{ marginTop: 10 }}
        value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className={`${s.btn} ${s.btnPrimary}`} style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
        onClick={save}>Save evaluation</button>
    </div>
  );
}

function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>{t}</div>
      {children}
    </div>
  );
}

/* ── Final decisions ────────────────────────────────────────── */
export function FinalDecisionsPage() {
  const { data: awaitingData } = useGetIscAdminApplicationsQuery({ status: 'interview_completed', page: 1 });
  const awaiting = awaitingData?.items ?? [];
  const [selId, setSelId] = useState<string | null>(null);

  const effectiveSelId = selId ?? awaiting[0]?.id ?? null;

  return (
    <div className={s.splitLayout}>
      <div className={s.listCard}>
        <h3 className={s.cardTitle}>Awaiting a final decision</h3>
        {awaiting.map((a) => {
          const avg = num(a.reviewScoreAvg);
          return (
            <div key={a.id} className={`${s.decisionRow} ${effectiveSelId === a.id ? s.selected : ''}`} onClick={() => setSelId(a.id)}>
              <Avatar initials={avatarInitials(a.fullName ?? undefined)} />
              <div>
                <div className={s.applicantName}>{a.fullName ?? '—'}</div>
                <div className={s.rowMeta}>{PROGRAM_LABEL(a.program)} · Grade {draftVal(a, 'personal', 'grade')} · Review {avg ?? '—'}</div>
              </div>
            </div>
          );
        })}
        {awaiting.length === 0 && <Empty text="No applicants awaiting a final decision." />}
      </div>

      {effectiveSelId ? (
        <DecisionDetail selectedId={effectiveSelId} />
      ) : (
        <div className={s.emptyPanel}>
          <Inbox size={40} />
          <div>Select an applicant to review combined scores and make a decision.</div>
        </div>
      )}
    </div>
  );
}

function DecisionDetail({ selectedId }: { selectedId: string }) {
  const { data: detail, isFetching } = useGetIscAdminApplicationQuery(selectedId);
  const { data: reviewers } = useGetIscReviewersQuery();
  const [decide] = useDecideIscApplicationMutation();

  if (isFetching && !detail) return <div className={s.listCard}><div className={s.emptyText}>Loading…</div></div>;
  if (!detail) return <div className={s.listCard}><div className={s.emptyText}>Not found.</div></div>;

  const { application, reviews, interviews } = detail;
  const fullName = application.fullName ?? '—';
  const reviewAvg = num(application.reviewScoreAvg);
  const interviewTotal = interviews[0]?.interviewTotal ?? null;
  const combined = (reviewAvg ?? 0) + (interviewTotal ?? 0);
  const reviewerName = (id: string) => reviewers?.find((r) => r.id === id)?.name ?? `${id.slice(0, 8)}…`;

  const doDecide = async (d: 'accepted' | 'waitlisted' | 'rejected') => {
    try {
      await decide({ applicationId: application.id, decision: d }).unwrap();
      toast(`${d[0].toUpperCase() + d.slice(1)} ${fullName}.`);
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
      </div>
      <div className={s.scoreStatRow}>
        <ScoreStat label="Review avg" value={`${reviewAvg ?? '—'} / 50`} />
        <ScoreStat label="Interview" value={`${interviewTotal ?? '—'} / 50`} />
        <ScoreStat label="Combined" value={`${combined} / 100`} />
      </div>

      <div className={s.infoBlock}>
        <div className={s.infoLabel}>Reviewer recommendations</div>
        {reviews.map((r) => (
          <div key={r.id} className={s.recLine}>
            <span className={s.recWho}>{reviewerName(r.reviewerUserId)}</span>
            <RecBadge rec={r.recommendation} />
            <span className={s.recScore}>{r.total} / 50</span>
          </div>
        ))}
        {interviews[0]?.interviewerName && (
          <div className={s.recLine}>
            <span className={s.recWho}>Interview · {interviews[0].interviewerName}</span>
            <span className={`${s.badge} ${s.bInterview}`}>Interviewed</span>
            <span className={s.recScore}>{interviewTotal ?? '—'} / 50</span>
          </div>
        )}
        {reviews.length === 0 && <div className={s.dim}>No reviewer recommendations yet.</div>}
      </div>

      <div className={s.infoBlock}>
        <div className={s.infoLabel}>Essay — why this camp</div>
        <div className={s.infoText}>{draftVal(application, 'essays', 'whyCamp')}</div>
      </div>

      <textarea className={s.notesArea} placeholder="Decision rationale (internal)…" style={{ marginBottom: 10 }} />
      <p className={s.decisionNote}>
        Reviewers score and recommend — the final decision is the admissions team's call.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => doDecide('accepted')}>Accept</button>
        <button className={`${s.btn} ${s.btnDanger}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => doDecide('rejected')}>Reject</button>
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
  return <div className={s.emptyText}>{text}</div>;
}

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className={s.modalOverlay} onClick={onCancel}>
      <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={s.modalTitle}>{title}</h3>
        <p className={s.modalBody}>{body}</p>
        <div className={s.modalActions}>
          <button className={s.btn} onClick={onCancel}>Keep interview</button>
          <button className={`${s.btn} ${s.btnDanger}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} · ${d.toISOString().slice(11, 16)}`;
}
