// ISC 2026 — reviewer console pages (My dashboard + Fast review mode).
// Wired to the real backend via RTK Query. The logged-in reviewer's own
// queue drives both screens; the "Reviewing as" selector in the shell is an
// admin impersonation affordance for the displayed label only (we prefer
// correctness over impersonation, per the rewire brief).
import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import s from './isc.module.scss';
import {
  useGetIscReviewerQueueQuery,
  useGetIscAdminReviewerQueueQuery,
  useGetIscReviewApplicationQuery,
  useReviewAsIscQuery,
  useSubmitIscReviewMutation,
  useSubmitReviewAsIscMutation,
  IscApplicationRow,
  IscAiEvaluation,
  IscScoreBreakdown,
} from '../../app/services/iscAdmissionsApi';
import {
  IscRecommendation,
  IscScores,
  RECOMMENDATION_LABEL,
  SCORE_DIMENSIONS,
  scoreTotal,
} from './types';
import { ScoreSliders, AiAssessmentDetails } from './components';

/* ── Small helpers over the real application shape ─────────────── */
type Draft = {
  personal?: { grade?: string | number; passportPath?: string };
  academics?: { englishTest?: string; englishScore?: string | number };
  activities?: { extracurriculars?: string };
  essays?: { whyCamp?: string; whySelect?: string };
};

function draftOf(app?: IscApplicationRow): Draft {
  return (app?.draft as Draft) ?? {};
}
function gradeOf(app?: IscApplicationRow): string {
  const g = draftOf(app).personal?.grade;
  return g == null || g === '' ? '—' : String(g);
}
function initialsOf(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ── My dashboard ───────────────────────────────────────────── */
export function ReviewerDashboard({
  reviewerId,
  onStart,
}: {
  reviewerId: string;
  onStart: () => void;
}) {
  // When a reviewer is selected (superadmin "review as"), load that reviewer's
  // queue via the admin endpoint; otherwise the logged-in reviewer's own queue.
  const impersonate = !!reviewerId;
  const own = useGetIscReviewerQueueQuery(undefined, { skip: impersonate });
  const asReviewer = useGetIscAdminReviewerQueueQuery(reviewerId, { skip: !impersonate });
  const data = impersonate ? asReviewer.data : own.data;
  const isLoading = impersonate ? asReviewer.isLoading : own.isLoading;
  const queue = data ?? [];
  const total = queue.length;
  const reviewed = queue.filter((q) => q.reviewed).length;
  const remaining = total - reviewed;
  const pct = total ? Math.round((reviewed / total) * 100) : 0;

  const tiles = [
    { label: 'Applications remaining', n: String(remaining) },
    { label: 'Applications reviewed', n: String(reviewed) },
    { label: 'Total assigned', n: String(total) },
  ];

  if (isLoading) {
    return <div className={s.emptyPanel}>Loading your queue…</div>;
  }

  return (
    <>
      <div className={s.tileRow}>
        {tiles.map((t) => (
          <div key={t.label} className={s.tile}>
            <div className={s.tileLabel}>{t.label}</div>
            <div className={s.tileNum}>{t.n}</div>
          </div>
        ))}
      </div>

      <div className={s.progressCard} style={{ marginBottom: 18 }}>
        <h3 className={s.cardTitle}>Your progress</h3>
        <div className={s.bigProgressTrack}>
          <div className={`${s.barFill} ${s.fillGreen}`} style={{ width: `${pct}%`, height: '100%' }} />
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          {reviewed} of {total} applications reviewed ({pct}%)
        </div>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={onStart} disabled={!total}>
          {remaining > 0 ? 'Continue reviewing' : 'Review queue'} <ArrowRight size={16} />
        </button>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Applicant</th><th>Grade</th><th>AI score</th><th>Your status</th></tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>
                  No applications assigned to you yet.
                </td>
              </tr>
            ) : (
              queue.map((row) => {
                const a = row.application;
                const aiScore = Number(a.aiScore);
                return (
                  <tr key={a.id} onClick={onStart}>
                    <td>
                      <div className={s.applicantCell}>
                        <span className={s.avatar}>{initialsOf(a.fullName)}</span>
                        <span className={s.applicantName}>{a.fullName || '—'}</span>
                      </div>
                    </td>
                    <td>{gradeOf(a)}</td>
                    <td>{Number.isFinite(aiScore) ? aiScore : '—'} / 50</td>
                    <td>
                      <span className={`${s.badge} ${row.reviewed ? s.bAccepted : s.bUnder}`}>
                        {row.reviewed ? 'Reviewed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Fast review mode ───────────────────────────────────────── */
const REC_OPTIONS: IscRecommendation[] = ['strong_recommend', 'recommend', 'neutral', 'not_recommend'];

function zeroScores(): IscScores {
  return { academicPotential: 0, leadership: 0, extracurricular: 0, motivation: 0, communication: 0 };
}

/** Inline AI pre-evaluation block (renders the real IscAiEvaluation shape). */
function AiBlock({ ai }: { ai: IscAiEvaluation | null }) {
  if (!ai || ai.status !== 'completed' || !ai.scores) {
    return (
      <div className={s.aiPanel}>
        <div className={s.aiHead}>
          <span aria-hidden>✦</span> AI pre-evaluation
        </div>
        <div className={s.aiSummary}>
          {ai?.status === 'pending'
            ? 'AI evaluation is still in progress.'
            : 'No AI pre-evaluation is available for this application.'}
        </div>
      </div>
    );
  }
  return (
    <div className={s.aiPanel}>
      <div className={s.aiHead}>
        <span aria-hidden>✦</span> AI pre-evaluation
        <span className={s.aiTotalPill}>{ai.scores.total} / 50</span>
      </div>
      <div className={s.aiScores}>
        {SCORE_DIMENSIONS.map(({ key, label }) => (
          <span key={key} className={s.aiScoreItem}>
            {label.split(' ')[0]}: <b>{ai.scores?.[key as keyof IscScoreBreakdown]}</b>
          </span>
        ))}
      </div>
      {ai.summary && <div className={s.aiSummary}>{ai.summary}</div>}
      <AiAssessmentDetails assessment={ai.assessment} />
      {(ai.flags ?? []).map((f, i) => (
        <div key={i} className={`${s.aiFlag} ${f.severity === 'high' ? s.aiFlagHigh : ''}`}>
          ⚑ {f.detail}
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
        Advisory only{ai.model ? ` · generated by ${ai.model}` : ''} · never auto-decides
      </div>
    </div>
  );
}

export function FastReviewMode({
  reviewerId,
}: {
  reviewerId: string;
}) {
  const impersonate = !!reviewerId;
  const own = useGetIscReviewerQueueQuery(undefined, { skip: impersonate });
  const asReviewer = useGetIscAdminReviewerQueueQuery(reviewerId, { skip: !impersonate });
  const queueData = impersonate ? asReviewer.data : own.data;
  const queueLoading = impersonate ? asReviewer.isLoading : own.isLoading;
  const queue = useMemo(() => queueData ?? [], [queueData]);

  const [idx, setIdx] = useState(0);
  const currentRow = queue[idx];
  const currentAppId = currentRow?.application.id;

  // Own detail vs. impersonated (review-as) detail.
  const ownDetail = useGetIscReviewApplicationQuery(currentAppId as string, {
    skip: impersonate || !currentAppId,
  });
  const asDetail = useReviewAsIscQuery(
    { applicationId: currentAppId ?? '', reviewerUserId: reviewerId },
    { skip: !impersonate || !currentAppId },
  );
  const detail = impersonate ? asDetail.data : ownDetail.data;
  const detailLoading = impersonate ? asDetail.isFetching : ownDetail.isFetching;

  const [scores, setScores] = useState<IscScores>(zeroScores());
  const [rec, setRec] = useState<IscRecommendation>('recommend');
  const [notes, setNotes] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  const [submitOwn, { isLoading: subOwn }] = useSubmitIscReviewMutation();
  const [submitAs, { isLoading: subAs }] = useSubmitReviewAsIscMutation();
  const submitting = impersonate ? subAs : subOwn;

  // Seed scoring/notes when a new application's detail arrives.
  React.useEffect(() => {
    if (!detail || detail.application.id === seededFor) return;
    const { ai, myReview } = detail;
    if (myReview) {
      setScores({
        academicPotential: myReview.academicPotential,
        leadership: myReview.leadership,
        extracurricular: myReview.extracurricular,
        motivation: myReview.motivation,
        communication: myReview.communication,
      });
      setRec(myReview.recommendation);
      setNotes(myReview.notes ?? '');
    } else if (ai?.scores) {
      setScores({
        academicPotential: ai.scores.academicPotential,
        leadership: ai.scores.leadership,
        extracurricular: ai.scores.extracurricular,
        motivation: ai.scores.motivation,
        communication: ai.scores.communication,
      });
      setRec('recommend');
      setNotes('');
    } else {
      setScores(zeroScores());
      setRec('recommend');
      setNotes('');
    }
    setSeededFor(detail.application.id);
  }, [detail, seededFor]);

  if (queueLoading) {
    return <div className={s.emptyPanel}>Loading your queue…</div>;
  }
  if (queue.length === 0) {
    return <div className={s.emptyPanel}>No applications assigned to you yet.</div>;
  }
  if (!currentRow) {
    return <div className={s.emptyPanel}>You have reached the end of your queue.</div>;
  }

  const advance = () => {
    if (idx < queue.length - 1) setIdx(idx + 1);
  };

  const app = detail?.application ?? currentRow.application;
  const draft = draftOf(app);
  const englishTest = draft.academics?.englishTest;
  const englishScore = draft.academics?.englishScore;
  const englishCert = englishTest ? `${englishTest}${englishScore ? ` ${englishScore}` : ''}` : '—';

  const saveNext = async () => {
    const body = {
      academicPotential: scores.academicPotential,
      leadership: scores.leadership,
      extracurricular: scores.extracurricular,
      motivation: scores.motivation,
      communication: scores.communication,
      recommendation: rec,
      notes: notes || undefined,
    };
    try {
      if (impersonate) {
        await submitAs({ applicationId: app.id, reviewerUserId: reviewerId, body }).unwrap();
      } else {
        await submitOwn({ applicationId: app.id, body }).unwrap();
      }
      flash(`Saved review for ${app.fullName ?? 'applicant'} (${scoreTotal(scores)}/50 · ${RECOMMENDATION_LABEL[rec]}).`);
      advance();
    } catch {
      flash('Could not save the review. Please try again.');
    }
  };

  return (
    <>
      <div className={s.progressStrip}>
        <div>
          <div>Reviewing application {idx + 1} of {queue.length}</div>
          <div className={s.progressTrack}>
            <div className={`${s.barFill} ${s.fillGreen}`} style={{ width: `${((idx + 1) / queue.length) * 100}%`, height: '100%' }} />
          </div>
        </div>
        <div>{queue.length - 1 - idx} applications remaining in your queue</div>
      </div>

      <div className={s.reviewLayout}>
        <div>
          <div className={s.applicantHeader}>
            <div className={s.applicantHeaderTop}>
              <div className={s.bigAvatar}>{initialsOf(app.fullName)}</div>
              <div>
                <div className={s.applicantBigName}>{app.fullName || '—'}</div>
                <div className={s.applicantMeta}>
                  Grade {gradeOf(app)} · {app.program} · {app.applicantType}
                </div>
              </div>
            </div>
            <div className={s.kvRow}>
              <div>
                <div className={s.kvLabel}>GPA</div>
                <div className={s.kvVal}>—</div>
              </div>
              <div>
                <div className={s.kvLabel}>English certificate</div>
                <div className={s.kvVal}>{englishCert}</div>
              </div>
            </div>
          </div>

          <AiBlock ai={detail?.ai ?? null} />

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Extracurricular activities & achievements</div>
            <div className={s.infoText}>{draft.activities?.extracurriculars || '—'}</div>
          </div>

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Essay 1 — why this camp</div>
            <div className={s.infoText}>{draft.essays?.whyCamp || '—'}</div>
          </div>

          <div className={s.infoBlock}>
            <div className={s.infoLabel}>Essay 2 — why we should select you</div>
            <div className={s.infoText}>{draft.essays?.whySelect || '—'}</div>
          </div>

          {detailLoading && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading application…</div>
          )}
        </div>

        <div className={s.scoreCard}>
          <h3 className={s.cardTitle}>
            Scoring
            {detail?.myReview && <span className={s.editingChip}>Editing your review</span>}
          </h3>
          <ScoreSliders scores={scores} onChange={setScores} />

          <div style={{ marginTop: 18 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 8 }}>Recommendation</h3>
            <div className={s.recGroup}>
              {REC_OPTIONS.map((r) => (
                <button key={r} className={`${s.recBtn} ${rec === r ? s.recActive : ''}`} onClick={() => setRec(r)}>
                  {RECOMMENDATION_LABEL[r]}
                </button>
              ))}
            </div>
            <p className={s.recHelper}>
              You score and recommend — the admissions team makes the final accept/reject call.
            </p>
            <div className={s.infoLabel}>Reviewer notes</div>
            <textarea className={s.notesArea} placeholder="Optional notes for the admissions team…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className={s.reviewFooter}>
            <button
              className={s.btn}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0 || submitting}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button className={s.btn} onClick={advance} disabled={submitting}>Skip for now</button>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveNext} disabled={submitting}>
              {submitting ? 'Saving…' : detail?.myReview ? 'Update & next' : 'Save & next'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function flash(msg: string) {
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
