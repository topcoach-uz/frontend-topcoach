import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { ArrowRight, CheckCircle2, ChevronRight, Lock, RotateCcw } from 'lucide-react';

import {
  useAnalysePublicMm3Mutation,
  Mm3PublicReport,
  Mm3FitBreakdown,
  Mm3Major,
} from '../../app/services/student-hub/majorMatchApi';
import {
  MM3_QUESTION_ORDER,
  MM3_QUESTIONS_BY_ID,
} from '../student-hub/major-match-v2/mm3-content';
import { buildMm3Payload, isKnownMm3Slug } from '../student-hub/major-match-v2/mm3-payload';
import { isMM3Answered, MM3Answer } from '../student-hub/major-match-v2/components/MM3Inputs';
import { MM3Intro } from '../student-hub/major-match-v2/components/MM3Intro';
import { MM3Runner } from '../student-hub/major-match-v2/components/MM3Runner';
import { MM3Analyzing } from '../student-hub/major-match-v2/components/MM3Analyzing';
import { renderEmphasis } from '../student-hub/major-match-v2/renderEmphasis';
// Reused unmodified for the mm2__* / mm2-runner__* base classes those three
// components render into — see the module docblock below for why.
import '../student-hub/major-match-v2/MajorMatchV2Page.scss';
import './MajorMatchPublicPage.scss';

/**
 * Public, unauthenticated Major Match — the lead magnet.
 *
 * Same 30-question flow as the in-app assessment (`MajorMatchV2Page.tsx`),
 * reusing its intro/runner/analyzing components UNCHANGED so the question
 * experience is identical. What differs, entirely in this file:
 *
 *  - No auth, no student profile, no prefill (there's no profile to read),
 *    no paywall gate (`MM3Intro`'s `access` prop is simply omitted).
 *  - A fixed-key localStorage draft (`topcoach_mm3_public_draft`) instead of
 *    one keyed by `studentProfileId` — there is no student profile.
 *  - Submits to the PUBLIC, rate-limited `/public/major-match/analyse`
 *    endpoint, which deliberately returns a stage-1-only report: majors and
 *    fit reasoning, no grounded universities and no roadmap. Those two are
 *    exactly what the "unlock" card at the bottom of the report offers —
 *    the endpoint shape *is* the product pitch.
 *  - The report itself is rendered by this file (`PublicReport` below), not
 *    by the in-app `MM3Results` — that component is tab-based and threads
 *    university/roadmap sections this endpoint doesn't return. Reusing it
 *    here would mean forking it down to nothing; a simple stacked list is
 *    both simpler and honest about what's actually present.
 */

type Step = 'intro' | 'questions' | 'analyzing' | 'rateLimited' | 'report';

const DRAFT_KEY = 'topcoach_mm3_public_draft';

interface Draft {
  answers: Record<string, MM3Answer>;
  currentIndex: number;
}

const loadDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.answers !== 'object') return null;
    // Drop anything whose question no longer exists so a stale draft from an
    // older question set can't wedge the runner.
    const answers: Record<string, MM3Answer> = {};
    for (const [slug, value] of Object.entries(parsed.answers || {})) {
      if (isKnownMm3Slug(slug)) answers[slug] = value as MM3Answer;
    }
    return {
      answers,
      currentIndex:
        typeof parsed.currentIndex === 'number'
          ? Math.min(Math.max(parsed.currentIndex, 0), MM3_QUESTION_ORDER.length - 1)
          : 0,
    };
  } catch {
    return null;
  }
};

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Best-effort only — localStorage fails in private mode / at quota.
    // Nothing is persisted server-side either way, so this only costs the
    // visitor re-answering, never data integrity.
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
};

const MajorMatchPublicPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [analysePublicMm3, { isLoading: analysing }] = useAnalysePublicMm3Mutation();

  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, MM3Answer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [report, setReport] = useState<Mm3PublicReport | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const hydratedRef = useRef(false);

  // Hydrate a resumed draft once, on mount. No prefill — there's no
  // authenticated profile to read from on a public page.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const draft = loadDraft();
    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      setCurrentIndex(draft.currentIndex);
      setHasDraft(true);
    }
  }, []);

  // Persist while actively answering.
  useEffect(() => {
    if (step !== 'questions') return;
    saveDraft({ answers, currentIndex });
  }, [step, answers, currentIndex]);

  const goToSignup = () => navigate('/auth/signup');
  const goToSignin = () => navigate('/auth/signin');

  const handleAnswer = (slug: string, value: MM3Answer) => {
    setAnswers((prev) => ({ ...prev, [slug]: value }));
  };

  const handleAnalyse = async () => {
    // Re-check every question rather than trusting the button state — a
    // restored draft can land the visitor mid-set with earlier gaps.
    const missingIndex = MM3_QUESTION_ORDER.findIndex((id) => {
      const question = MM3_QUESTIONS_BY_ID.get(id);
      return question ? !isMM3Answered(question, answers[question.slug]) : false;
    });
    if (missingIndex >= 0) {
      setCurrentIndex(missingIndex);
      message.warning(
        t('majorMatchPublic.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }

    setStep('analyzing');
    try {
      const result = await analysePublicMm3({ answers: buildMm3Payload(answers, t) }).unwrap();
      setReport(result);
      setStep('report');
      clearDraft();
      setHasDraft(false);
    } catch (error: any) {
      console.error('Public Major Match analysis error:', error);
      if (error?.status === 429) {
        setStep('rateLimited');
        return;
      }
      message.error(
        error?.data?.message ||
          t(
            'majorMatchPublic.error.analyseFailed',
            "We couldn't build your report just now. Your answers are saved, so please try again.",
          ),
      );
      // Back to the last question with answers intact, never a dead end.
      setStep('questions');
      setCurrentIndex(MM3_QUESTION_ORDER.length - 1);
    }
  };

  const goNext = () => {
    const question = MM3_QUESTIONS_BY_ID.get(MM3_QUESTION_ORDER[currentIndex]);
    if (question && !isMM3Answered(question, answers[question.slug])) {
      message.warning(
        t('majorMatchPublic.validation.answerAll', 'Please answer this question to continue.'),
      );
      return;
    }
    if (currentIndex === MM3_QUESTION_ORDER.length - 1) {
      void handleAnalyse();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const goBack = () => setCurrentIndex((i) => Math.max(0, i - 1));

  const handleRetake = () => {
    setReport(null);
    setAnswers({});
    setCurrentIndex(0);
    setHasDraft(false);
    clearDraft();
    setStep('questions');
  };

  return (
    <div className="mmp-page">
      <div className="mm2-page mmp-shell">
        {step === 'intro' && (
          <MM3Intro
            variant="public"
            // `hasReport` starts false (no report exists yet) and only
            // becomes true once one does — so a visitor who generates a
            // report, backs out, then reopens the intro sees the correct
            // "view results / retake" state instead of the first-run copy.
            hasReport={!!report}
            hasDraft={hasDraft}
            onStart={() => setStep('questions')}
            onViewResults={() => setStep('report')}
            // No paywall on the public page — `access` is intentionally
            // omitted so MM3Intro's enrollment-gate branch never triggers.
            // The only "unlock" story here is account creation.
            onUnlock={goToSignup}
          />
        )}

        {step === 'questions' && (
          <MM3Runner
            currentIndex={currentIndex}
            answers={answers}
            prefilledSlugs={[]}
            submitting={analysing}
            onAnswer={handleAnswer}
            onNext={goNext}
            onBack={goBack}
            onExit={() => setStep('intro')}
          />
        )}

        {step === 'analyzing' && <MM3Analyzing />}

        {step === 'rateLimited' && (
          <div className="mm2__state">
            <p className="mm2__state-title">
              {t('majorMatchPublic.rateLimit.title', "You've generated a few reports already")}
            </p>
            <p className="mm2__state-text">
              {t('majorMatchPublic.rateLimit.body', 'Please try again a little later.')}
            </p>
            <div className="mm2__cta-row">
              <button type="button" className="mm2__btn mm2__btn--primary" onClick={() => void handleAnalyse()}>
                {t('majorMatchPublic.rateLimit.retryCta', 'Try again')}
              </button>
              <button type="button" className="mm2__btn" onClick={() => setStep('intro')}>
                {t('majorMatchPublic.rateLimit.backCta', 'Back to start')}
              </button>
            </div>
          </div>
        )}

        {step === 'report' && report && (
          <PublicReport report={report} onRetake={handleRetake} onSignup={goToSignup} onSignin={goToSignin} />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// The free report + unlock card
// ─────────────────────────────────────────────────────────────────────────

const BREAKDOWN_ROWS: Array<{ key: keyof Mm3FitBreakdown; labelKey: string; fallback: string }> = [
  { key: 'interests', labelKey: 'majorMatchPublic.majors.breakdownInterests', fallback: 'Interests' },
  { key: 'skills', labelKey: 'majorMatchPublic.majors.breakdownSkills', fallback: 'Skills' },
  { key: 'workStyle', labelKey: 'majorMatchPublic.majors.breakdownWorkStyle', fallback: 'Work style' },
  { key: 'goals', labelKey: 'majorMatchPublic.majors.breakdownGoals', fallback: 'Goals' },
];

const MAJOR_RANK_LABELS: Array<{ key: string; fallback: string }> = [
  { key: 'majorMatchPublic.majors.rankBest', fallback: 'Best match' },
  { key: 'majorMatchPublic.majors.rankStrong', fallback: 'Strong match' },
  { key: 'majorMatchPublic.majors.rankAlsoGreat', fallback: 'Also great' },
  { key: 'majorMatchPublic.majors.rankWorthExploring', fallback: 'Worth exploring' },
];

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const MmpMajorCard: React.FC<{ major: Mm3Major; index: number }> = ({ major, index }) => {
  const { t } = useTranslation();
  const rankItem = MAJOR_RANK_LABELS[Math.min(index, MAJOR_RANK_LABELS.length - 1)];

  return (
    <article className="mmp-major">
      <header className="mmp-major__head">
        <div className="mmp-major__head-text">
          <span className="mmp-major__rank">{t(rankItem.key, rankItem.fallback)}</span>
          <h3 className="mmp-major__name">{major.name}</h3>
        </div>
        <div className="mmp-major__score">
          <span className="mmp-major__score-value">{major.fitScore}</span>
          <span className="mmp-major__score-suffix">{t('majorMatchPublic.majors.fitSuffix', '/100 FIT')}</span>
        </div>
      </header>

      {major.why && <div className="mmp-major__why">{major.why}</div>}

      {major.about && (
        <p className="mmp-major__about">
          <b>{t('majorMatchPublic.majors.aboutTitle', 'What is {{name}}?', { name: major.name })}</b>{' '}
          {major.about}
        </p>
      )}

      {major.breakdown && (
        <div className="mmp-major__breakdown">
          {BREAKDOWN_ROWS.map((row) => (
            <div className="mmp-major__breakdown-row" key={row.key}>
              <span className="mmp-major__breakdown-label">{t(row.labelKey, row.fallback)}</span>
              <div className="mmp-major__breakdown-track">
                <span
                  className="mmp-major__breakdown-fill"
                  style={{ width: `${clampPercent(major.breakdown![row.key])}%` }}
                />
              </div>
              <span className="mmp-major__breakdown-value">{major.breakdown![row.key]}</span>
            </div>
          ))}
          <p className="mmp-major__breakdown-note">
            {t(
              'majorMatchPublic.majors.breakdownNote',
              'How your answers scored across four signals. This shows fit, not ability.',
            )}
          </p>
        </div>
      )}

      {major.careers?.length > 0 && (
        <div className="mmp-major__chips">
          {major.careers.map((c, ci) => (
            <span className="mmp-major__chip" key={ci}>
              {c}
            </span>
          ))}
        </div>
      )}

      {(major.terms?.length ?? 0) > 0 && (
        <details className="mmp-major__glossary">
          <summary>
            <ChevronRight size={13} className="mmp-major__glossary-chevron" aria-hidden="true" />
            {t('majorMatchPublic.majors.glossaryTitle', 'Words on this page, explained')}
          </summary>
          <dl className="mmp-major__glossary-list">
            <div className="mmp-major__glossary-item">
              <dt>{t('majorMatchPublic.majors.glossaryFitScoreTerm', 'Fit score')}</dt>
              <dd>
                {t(
                  'majorMatchPublic.majors.glossaryFitScoreDef',
                  'How closely your answers align with this major, out of 100.',
                )}
              </dd>
            </div>
            {major.terms!.map((term, ti) => (
              <div className="mmp-major__glossary-item" key={ti}>
                <dt>{term.term}</dt>
                <dd>{term.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </article>
  );
};

const PublicReport: React.FC<{
  report: Mm3PublicReport;
  onRetake: () => void;
  onSignup: () => void;
  onSignin: () => void;
}> = ({ report, onRetake, onSignup, onSignin }) => {
  const { t } = useTranslation();
  const majors = report.majors ?? [];

  return (
    <div className="mmp-report">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mmp-report__hero">
        <div className="mmp-report__eyebrow">{t('majorMatchPublic.report.eyebrow', 'Your free TOP300 Majors report')}</div>
        <h1 className="mmp-report__title">
          {report.personaTitle || t('majorMatchPublic.report.title', "Here's where your answers point.")}
        </h1>
        {report.profileSummary && (
          <p className="mmp-report__summary">{renderEmphasis(report.profileSummary)}</p>
        )}
        {report.strengthChips && report.strengthChips.length > 0 && (
          <div className="mmp-report__chips mmp-report__chips--hero">
            {report.strengthChips.map((s, i) => (
              <span className="mmp-report__chip mmp-report__chip--strength" key={i}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Strengths / gaps ─────────────────────────────────────────── */}
      {(report.strengths?.length > 0 || report.gaps?.length > 0) && (
        <div className="mmp-report__grid2">
          {report.strengths?.length > 0 && (
            <div className="mmp-report__panel mmp-report__panel--strengths">
              <h3>{t('majorMatchPublic.report.strengthsLabel', 'Your strengths')}</h3>
              <ul>
                {report.strengths.map((s, i) => (
                  <li key={i}>{renderEmphasis(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {report.gaps?.length > 0 && (
            <div className="mmp-report__panel mmp-report__panel--gaps">
              <h3>{t('majorMatchPublic.report.gapsLabel', 'Gaps to close')}</h3>
              <ul>
                {report.gaps.map((g, i) => (
                  <li key={i}>{renderEmphasis(g)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Majors — a simple stacked list, not the in-app tab widget ──── */}
      {majors.length > 0 && (
        <section className="mmp-report__section">
          <div className="mmp-report__section-head">
            <h2 className="mmp-report__section-title">
              {t('majorMatchPublic.majors.title', 'Your best-fit majors')}
            </h2>
            <p className="mmp-report__section-sub">
              {t('majorMatchPublic.majors.subtitle', 'Four majors, ranked by how closely your answers align.')}
            </p>
          </div>
          <div className="mmp-report__major-list">
            {majors.map((m, i) => (
              <MmpMajorCard major={m} index={i} key={`${m.name}-${i}`} />
            ))}
          </div>
        </section>
      )}

      {/* ── 🔴 The unlock card — honest about what's behind it ─────────── */}
      <section className="mmp-unlock">
        <div className="mmp-unlock__eyebrow">{t('majorMatchPublic.unlock.eyebrow', 'This is a preview')}</div>
        <h2 className="mmp-unlock__title">
          {t('majorMatchPublic.unlock.title', 'A free account unlocks the rest of your match')}
        </h2>
        <ul className="mmp-unlock__list">
          <li>
            <CheckCircle2 size={16} aria-hidden="true" />
            {/* No number here on purpose: the public report is stage-1 only,
                so this page never receives a catalogue count, and hardcoding
                one is what made the figure go stale in the first place. */}
            {t(
              'majorMatchPublic.unlock.itemUniversities',
              'Matched universities from the TopCoach catalogue',
            )}
          </li>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" />
            {t('majorMatchPublic.unlock.itemTuition', 'Real tuition figures and financial-aid policy')}
          </li>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" />
            {t('majorMatchPublic.unlock.itemProfessors', 'Professors and labs for your matched majors')}
          </li>
          <li>
            <CheckCircle2 size={16} aria-hidden="true" />
            {t('majorMatchPublic.unlock.itemEmployers', 'Where graduates from these programs get hired')}
          </li>
        </ul>

        <div className="mmp-unlock__actions">
          <button type="button" className="mmp-unlock__cta" onClick={onSignup}>
            <Lock size={14} aria-hidden="true" />
            {t('majorMatchPublic.unlock.signupCta', 'Create a free account')}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="mmp-unlock__signin" onClick={onSignin}>
            {t('majorMatchPublic.unlock.signinPrompt', 'Already have an account?')}{' '}
            <span>{t('majorMatchPublic.unlock.signinCta', 'Sign in')}</span>
          </button>
        </div>

        <p className="mmp-unlock__note">
          {t(
            'majorMatchPublic.unlock.roadmapNote',
            'A personalized roadmap comes with a TopCoach subscription. It is not part of the free account.',
          )}
        </p>
      </section>

      <div className="mmp-report__actions">
        <button type="button" className="mmp-report__retake" onClick={onRetake}>
          <RotateCcw size={13} aria-hidden="true" />
          {t('majorMatchPublic.report.retakeCta', 'Retake the quiz')}
        </button>
      </div>
    </div>
  );
};

export default MajorMatchPublicPage;
