import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookmarkCheck, BookmarkPlus, ChevronRight, Lock, RotateCcw, X } from 'lucide-react';
import type {
  MajorMatchAccessStatus,
  Mm3FitBreakdown,
  Mm3Major,
  Mm3Report,
  Mm3University,
} from '../../../../app/services/student-hub/majorMatchApi';
import {
  useCreateCollegeApplicationMutation,
  useGetCollegeApplicationsQuery,
} from '../../../../app/services/student-hub/applicationTrackingApi';
import type { CreateCollegeApplicationRequest } from '../../../../app/services/student-hub/types';
import { MajorMatchUpsell } from '../../psychometric-assessment/components/MajorMatchUpsell';
import { COMMUNITY_FUNNEL_PATHS } from '../../../../lib/communityAccess';
import { useSubmitFormMutation } from '../../../../app/services/contactApi';
import { useTypedSelector } from '../../../../app/store';
import { renderEmphasis } from '../renderEmphasis';
import '../mm3-results.scss';

/** Row order + i18n for the four-signal fit breakdown. Module-scope since it
 * doesn't depend on component state. */
const BREAKDOWN_ROWS: Array<{ key: keyof Mm3FitBreakdown; labelKey: string; fallback: string }> = [
  { key: 'interests', labelKey: 'majorMatch3.results.breakdownInterests', fallback: 'Interests' },
  { key: 'skills', labelKey: 'majorMatch3.results.breakdownSkills', fallback: 'Skills' },
  { key: 'workStyle', labelKey: 'majorMatch3.results.breakdownWorkStyle', fallback: 'Work style' },
  { key: 'goals', labelKey: 'majorMatch3.results.breakdownGoals', fallback: 'Goals' },
];

/** Rank label shown above the fit score on each major tab, by position.
 * Indices past the array length re-use the last (most modest) label rather
 * than throwing or rendering nothing. */
const MAJOR_RANK_LABELS: Array<{ key: string; fallback: string }> = [
  { key: 'majorMatch3.results.rankBest', fallback: 'Best match' },
  { key: 'majorMatch3.results.rankStrong', fallback: 'Strong match' },
  { key: 'majorMatch3.results.rankAlsoGreat', fallback: 'Also great' },
  { key: 'majorMatch3.results.rankWorthExploring', fallback: 'Worth exploring' },
];

/**
 * Section 03's content — TopCoach's static programme catalogue, NOT
 * model-generated. Every student sees the same four programmes and the same
 * six outcomes, so this is authored content with i18n fallbacks, module-scope
 * like the tables above, not something threaded through `Mm3Report`.
 *
 * Section 02 (just above this one, in the JSX below) is the OTHER roadmap —
 * `report.masterRoadmap`, the AI-personalised, subscription-gated master
 * timeline. The two are deliberately adjacent: the personalised plan shows
 * what's ahead specifically for this student and ends in an unlock CTA; the
 * catalogue underneath answers "what does TopCoach itself actually offer".
 */
interface RoadmapProgramBullet {
  key: string;
  fallback: string;
}

interface RoadmapProgramPhase {
  nameKey: string;
  nameFallback: string;
  weeksKey: string;
  weeksFallback: string;
  descKey: string;
  descFallback: string;
}

interface RoadmapProgram {
  icon: string;
  nameKey: string;
  nameFallback: string;
  durationKey: string;
  durationFallback: string;
  /** A programme has EITHER a flat bullet list OR numbered sub-phases,
   *  never both — Research is the only one with phases. */
  bullets?: RoadmapProgramBullet[];
  phases?: RoadmapProgramPhase[];
}

const ROADMAP_PROGRAMS: RoadmapProgram[] = [
  {
    icon: '🎓',
    nameKey: 'majorMatch3.programs.admissions.name',
    nameFallback: 'Admissions Program',
    durationKey: 'majorMatch3.programs.admissions.duration',
    durationFallback: '3 months',
    bullets: [
      {
        key: 'majorMatch3.programs.admissions.bullet1',
        fallback: 'Personal essay and every supplemental, in your words, coached',
      },
      { key: 'majorMatch3.programs.admissions.bullet2', fallback: 'Portfolio built around your story' },
      { key: 'majorMatch3.programs.admissions.bullet3', fallback: 'University list and application strategy' },
      { key: 'majorMatch3.programs.admissions.bullet4', fallback: 'Weekly 1-on-1 sessions with your coach' },
    ],
  },
  {
    icon: '🔬',
    nameKey: 'majorMatch3.programs.research.name',
    nameFallback: 'Research Program',
    durationKey: 'majorMatch3.programs.research.duration',
    durationFallback: '3 months',
    phases: [
      {
        nameKey: 'majorMatch3.programs.research.phase1.name',
        nameFallback: 'Research Foundations',
        weeksKey: 'majorMatch3.programs.research.phase1.weeks',
        weeksFallback: 'Weeks 1–4',
        descKey: 'majorMatch3.programs.research.phase1.desc',
        descFallback: 'Choosing your topic · ethics and integrity · literature review · your research question',
      },
      {
        nameKey: 'majorMatch3.programs.research.phase2.name',
        nameFallback: 'Research Development',
        weeksKey: 'majorMatch3.programs.research.phase2.weeks',
        weeksFallback: 'Weeks 5–8',
        descKey: 'majorMatch3.programs.research.phase2.desc',
        descFallback: 'Methodology · data collection and analysis · academic writing · weekly mentor reviews',
      },
      {
        nameKey: 'majorMatch3.programs.research.phase3.name',
        nameFallback: 'Paper Completion',
        weeksKey: 'majorMatch3.programs.research.phase3.weeks',
        weeksFallback: 'Weeks 9–12',
        descKey: 'majorMatch3.programs.research.phase3.desc',
        descFallback: 'Drafting · editing and revision · citations · final presentation · submission',
      },
    ],
  },
  {
    icon: '📝',
    nameKey: 'majorMatch3.programs.sat.name',
    nameFallback: 'SAT Prep',
    durationKey: 'majorMatch3.programs.sat.duration',
    durationFallback: 'Unlimited',
    bullets: [
      { key: 'majorMatch3.programs.sat.bullet1', fallback: 'Full mock tests, as many as you want' },
      { key: 'majorMatch3.programs.sat.bullet2', fallback: 'Drill any section, any time' },
      { key: 'majorMatch3.programs.sat.bullet3', fallback: 'Score tracking, week by week' },
      { key: 'majorMatch3.programs.sat.bullet4', fallback: 'Everything inside TopCoach' },
    ],
  },
  {
    icon: '🧑‍🏫',
    nameKey: 'majorMatch3.programs.customized.name',
    nameFallback: 'Customized Program',
    durationKey: 'majorMatch3.programs.customized.duration',
    durationFallback: 'Your pace',
    bullets: [
      {
        key: 'majorMatch3.programs.customized.bullet1',
        fallback: 'Get matched with your best-fitting major as you work',
      },
      {
        key: 'majorMatch3.programs.customized.bullet2',
        fallback: 'A mentor who already walked the path you are on now',
      },
      { key: 'majorMatch3.programs.customized.bullet3', fallback: 'A plan built on your level and your timeline' },
      { key: 'majorMatch3.programs.customized.bullet4', fallback: '1-on-1 sessions and Study Buddy groups' },
    ],
  },
];

interface RoadmapOutcome {
  titleKey: string;
  titleFallback: string;
  bodyKey: string;
  bodyFallback: string;
}

const ROADMAP_OUTCOMES: RoadmapOutcome[] = [
  {
    titleKey: 'majorMatch3.programs.outcome1.title',
    titleFallback: 'Early-start advantage',
    bodyKey: 'majorMatch3.programs.outcome1.body',
    bodyFallback: 'Starting now buys you years to build a genuinely strong profile.',
  },
  {
    titleKey: 'majorMatch3.programs.outcome2.title',
    titleFallback: 'Personalized mentorship',
    bodyKey: 'majorMatch3.programs.outcome2.body',
    bodyFallback: '1-on-1 guidance tuned to your goals, strengths and interests.',
  },
  {
    titleKey: 'majorMatch3.programs.outcome3.title',
    titleFallback: 'A published research paper',
    bodyKey: 'majorMatch3.programs.outcome3.body',
    bodyFallback: 'Real, finished, university-ready work with your name on it.',
  },
  {
    titleKey: 'majorMatch3.programs.outcome4.title',
    titleFallback: 'A real admissions plan',
    bodyKey: 'majorMatch3.programs.outcome4.body',
    bodyFallback: 'A personalized roadmap for international university admissions.',
  },
  {
    titleKey: 'majorMatch3.programs.outcome5.title',
    titleFallback: 'A finished portfolio',
    bodyKey: 'majorMatch3.programs.outcome5.body',
    bodyFallback: 'A completed project you can show any admissions officer.',
  },
  {
    titleKey: 'majorMatch3.programs.outcome6.title',
    titleFallback: 'Global exposure',
    bodyKey: 'majorMatch3.programs.outcome6.body',
    bodyFallback: 'Summer programs, academic competitions, international opportunities.',
  },
];

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const tierClass = (tier: Mm3University['tier']): string => {
  switch (tier) {
    case 'Reach':
      return 'mm3-results__tier--reach';
    case 'Safety':
      return 'mm3-results__tier--safety';
    default:
      return 'mm3-results__tier--match';
  }
};

/** The College List's own tier vocabulary ('target', not 'match') — kept as
 *  an explicit map rather than a lowercase() so a future tier added to one
 *  side doesn't silently "work" against the other's different name. */
const CATEGORY_BY_TIER: Record<Mm3University['tier'], CreateCollegeApplicationRequest['category']> = {
  Reach: 'reach',
  Match: 'target',
  Safety: 'safety',
};

/** Parses a formatted tuition string like "61,990 USD" into a number +
 *  currency for the College List's `financialInfo`. Only ever called when
 *  `tuitionUnreliable` is false and `tuition` is non-null — the report
 *  suppresses implausible figures (e.g. Delft's "56") specifically so they
 *  don't get treated as real; writing one into the college list would
 *  undo that and let it outlive the report looking authoritative. Returns
 *  null on anything that doesn't parse cleanly, in which case the caller
 *  omits `financialInfo` entirely rather than saving a bad number. */
const parseTuitionForSave = (tuition: string): { tuition: number; currency: string } | null => {
  const match = tuition.trim().match(/^([\d,]+)(?:\s+([A-Za-z]{2,6}))?$/);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { tuition: amount, currency: match[2] || 'USD' };
};

/** Small numbered section heading — "01  Your best-fit majors" + a one-line
 * subtitle + a hairline rule trailing the title. Shared by all three
 * numbered sections so the numbering/rule treatment can't drift between them. */
const SectionHeading: React.FC<{ number: string; title: string; subtitle?: string }> = ({
  number,
  title,
  subtitle,
}) => (
  <div className="mm3-results__section-head">
    <div className="mm3-results__section-heading-row">
      <span className="mm3-results__section-num" aria-hidden="true">
        {number}
      </span>
      <h2 className="mm3-results__section-title">{title}</h2>
    </div>
    {subtitle && <p className="mm3-results__section-sub">{subtitle}</p>}
  </div>
);

/** The full detail for one university — everything the old per-university
 * card used to render inline, unchanged, now shown in a modal opened from
 * the compact list row. Portaled to document.body so it isn't clipped by
 * any ancestor's overflow/stacking context. */
const Mm3UniversityModal: React.FC<{ university: Mm3University; degreeLevel: 'bachelor' | 'master'; onClose: () => void; readOnly: boolean }> = ({
  university,
  degreeLevel,
  onClose,
  readOnly,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // "Already saved" is detected against the student's real college list
  // rather than tracked in purely local state, because the backend has NO
  // duplicate guard on this endpoint — createCollegeApplication just
  // inserts. A second click with only local state would silently write a
  // second row. Skipped entirely for the counselor read-only embed, which
  // must never write into a student's list.
  const { data: collegeApplications } = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: readOnly },
  );
  const alreadySaved = !readOnly && !!collegeApplications?.data?.some((a) =>
    a.universityId === university.id && (a.degreeLevel ?? 'bachelor') === degreeLevel && a.major === university.matchedMajor,
  );

  const [createCollegeApplication, { isLoading: isSaving }] = useCreateCollegeApplicationMutation();
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSavedNow = alreadySaved || justSaved;

  const handleSave = async () => {
    if (!university.id || isSaving || isSavedNow) return;
    setSaveError(null);
    try {
      const parsedTuition =
        !university.tuitionUnreliable && university.tuition ? parseTuitionForSave(university.tuition) : null;

      const payload: CreateCollegeApplicationRequest = {
        degreeLevel,
        // Only universityId is sent, never universityName alongside it — the
        // college_applications table has a CHECK constraint requiring
        // exactly one of the two, and we always have the real catalogue id.
        universityId: university.id,
        major: university.matchedMajor || undefined,
        category: CATEGORY_BY_TIER[university.tier],
        whyThisSchool: university.whyFit || undefined,
        // 'common-app' matches the backend ApplicationType enum's actual
        // value; the frontend's own CollegeApplication['applicationType']
        // union type is stale here (says 'common_app'), same workaround
        // already used in NewApplicationPage.tsx/EditApplicationPage.tsx.
        applicationType: (degreeLevel === 'master' ? 'direct' : 'common-app') as CreateCollegeApplicationRequest['applicationType'],
        status: 'researching',
        ...(parsedTuition ? { financialInfo: parsedTuition } : {}),
      };

      await createCollegeApplication(payload).unwrap();
      setJustSaved(true);
    } catch (err: any) {
      const backendMessage = err?.data?.message;
      setSaveError(
        typeof backendMessage === 'string' && backendMessage.trim()
          ? backendMessage
          : t('majorMatch3.results.saveToListError', 'Could not save this to your college list. Please try again.'),
      );
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore on close AND on unmount — a lock without this cleanup path
      // leaves the whole page unscrollable if the component ever unmounts
      // while open (e.g. navigating away).
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="mm3-modal__backdrop" onClick={onClose}>
      <div
        className="mm3-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label={university.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="mm3-modal__close"
          onClick={onClose}
          aria-label={t('majorMatch3.results.closeModal', 'Close')}
        >
          <X size={16} />
        </button>

        <div className="mm3-modal__header">
          <h3>{university.name}</h3>
          <div className="mm3-results__uni-meta">
            {[university.country, university.matchedMajor].filter(Boolean).join(' · ')}
          </div>
          <span className={`mm3-results__tier ${tierClass(university.tier)}`}>{university.tier}</span>

          {/* Hidden entirely for the counselor read-only embed — a
              counselor must not write into a student's college list. */}
          {!readOnly && (
            <div className="mm3-modal__save">
              {isSavedNow ? (
                <span className="mm3-modal__save-status">
                  <BookmarkCheck size={14} aria-hidden="true" />
                  {t('majorMatch3.results.savedToListLabel', 'In your college list')}
                  <button
                    type="button"
                    className="mm3-modal__save-link"
                    onClick={() =>
                      navigate('/student-hub?section=others&target=profile&tab=college-lists')
                    }
                  >
                    {t('majorMatch3.results.savedToListViewCta', 'View list')}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="mm2__btn mm2__btn--secondary mm3-modal__save-btn"
                  onClick={handleSave}
                  disabled={!university.id || isSaving}
                >
                  <BookmarkPlus size={14} aria-hidden="true" />
                  {isSaving
                    ? t('majorMatch3.results.savingToListCta', 'Saving…')
                    : t('majorMatch3.results.saveToListCta', 'Save to my college list')}
                </button>
              )}
              {saveError && <p className="mm3-modal__save-error">{saveError}</p>}
            </div>
          )}
        </div>

        <div className="mm3-modal__body">
          {university.requirements?.length > 0 && (
            <>
              <div className="mm3-results__uni-label">
                {t('majorMatch3.results.requirementsLabel', 'Requirements for your intake')}
              </div>
              {university.requirements.map((r, ri) => (
                <div className="mm3-results__uni-row mm3-results__uni-row--req" key={ri}>
                  <span>{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
            </>
          )}

          {/* admissionOdds: currently always null (no acceptance-rate
              source). Rendered only when non-null so it lights up with
              zero code change once that data lands — never a
              placeholder row. */}
          {university.admissionOdds && (
            <div className="mm3-results__uni-row">
              <span>{t('majorMatch3.results.admissionOddsLabel', 'Admission odds')}</span>
              <span>{university.admissionOdds}</span>
            </div>
          )}

          <div className="mm3-results__uni-label">{t('majorMatch3.results.costLabel', 'Cost & financial aid')}</div>
          <div className="mm3-results__uni-row">
            <span>{t('majorMatch3.results.tuitionLabel', 'Tuition (our records)')}</span>
            <span>
              {university.tuitionUnreliable
                ? t('majorMatch3.results.tuitionUnreliable', 'See official page (figure under review)')
                : university.tuition ?? t('majorMatch3.results.tuitionUnknown', 'See official page')}
            </span>
          </div>

          {university.scholarships?.length > 0 &&
            university.scholarships.map((s, si) => (
              <div className="mm3-results__aid" key={si}>
                <b>{t('majorMatch3.results.aidLabel', 'Financial Aid:')}</b> {s.text}
                {/* amount: null until a real figure lands in our
                    records — never a placeholder. */}
                {s.amount && <> — {s.amount}</>}
              </div>
            ))}

          {university.whyFit && (
            <div className="mm3-results__why">
              <b>{t('majorMatch3.results.whyFitLabel', 'Why this fits you:')}</b> {university.whyFit}
            </div>
          )}

          {/* professors: optional — most universities have none seeded
              yet. Render only when non-empty, never an empty heading. */}
          {university.professors && university.professors.length > 0 && (
            <>
              <div className="mm3-results__uni-label">{t('majorMatch3.results.professorsLabel', 'Professors & labs')}</div>
              <div className="mm3-results__professors">
                {university.professors.map((p, pi) => (
                  <div className="mm3-results__professor" key={pi}>
                    <div className="mm3-results__professor-name">
                      {p.profileUrl ? (
                        <a href={p.profileUrl} target="_blank" rel="noopener noreferrer">
                          {p.name}
                        </a>
                      ) : (
                        p.name
                      )}
                    </div>
                    {(p.title || p.researchArea) && (
                      <div className="mm3-results__professor-meta">
                        {[p.title, p.researchArea].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* employers: optional — most universities have none seeded
              yet. Render only when non-empty, never a placeholder. */}
          {university.employers && university.employers.length > 0 && (
            <>
              <div className="mm3-results__uni-label">
                {t('majorMatch3.results.employersLabel', 'Where graduates get hired')}
              </div>
              <div className="mm3-results__chips">
                {university.employers.map((e, ei) => (
                  <span className="mm3-results__chip mm3-results__chip--employer" key={ei}>
                    <span className="mm3-results__chip-name">{e.companyName}</span>
                    {(e.industry || e.note) && (
                      <span className="mm3-results__chip-sub">{[e.industry, e.note].filter(Boolean).join(' · ')}</span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}

          {university.roadmap?.length > 0 && (
            <>
              <div className="mm3-results__uni-label">
                {t('majorMatch3.results.uniRoadmapLabel', 'Your roadmap to {{name}}', { name: university.name })}
              </div>
              {university.roadmap.map((phase, pi) => (
                <div className="mm3-results__uni-roadmap-phase" key={pi}>
                  <b>{phase.when}</b>
                  <ul>
                    {phase.actions.map((a, ai) => (
                      <li key={ai}>{a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface MM3ResultsProps {
  report: Mm3Report;
  readOnly?: boolean;
  access?: MajorMatchAccessStatus;
  onRetake: () => void;
  onUnlock: () => void;
  onBack?: () => void;
}

/**
 * "Learn more" contact capture.
 *
 * A student who has just read their whole report and clicked "Learn more" is
 * the warmest lead this product produces. Previously that click navigated to
 * /programs and the interest was lost; now it leaves a contact a human can
 * follow up on.
 *
 * Posts to the EXISTING `POST /contact/form` (`useSubmitFormMutation`) — not a
 * new endpoint and not a new leads table. That route is deliberately the right
 * one: unlike `contact/mentor-request`, it is NOT Telegram-gated, so a student
 * without Telegram connected can still reach us. It is throttled 5/min.
 *
 * Fields are PREFILLED from the signed-in student. Asking someone to retype a
 * name and email we already hold reads as a form for its own sake and costs
 * completions; the message box is the only thing they actually have to write,
 * and even that is optional.
 */
const LearnMoreContactModal: React.FC<{
  open: boolean;
  onClose: () => void;
  /** Named so the follow-up knows what the student was looking at. */
  topMajor?: string;
}> = ({ open, onClose, topMajor }) => {
  const { t } = useTranslation();
  // The logged-in USER, not the student profile. `useStudentProfile()` was
  // wrong here: it returns the student-profile aggregate, which carries
  // `profile.name` but NO email and NO phone — those live on the user
  // record. Prefilling from it left every field blank, which also left the
  // submit button permanently disabled (it requires a name and a valid
  // email), so the modal opened and could never be sent.
  const { profile: authUser } = useTypedSelector((state) => state.auth);
  const [submitForm, { isLoading }] = useSubmitFormMutation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  // Prefill once the profile arrives, and only into fields the student hasn't
  // already edited — re-running this on every profile refetch would wipe their
  // typing mid-form.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!open || prefilledRef.current || !authUser?.email) return;
    prefilledRef.current = true;
    const u = authUser as any;
    setFullName(u?.profile?.name || '');
    setEmail(u?.email || '');
    setPhoneNumber(u?.phoneNumber || '');
  }, [open, authUser]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = fullName.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && !isLoading;

  const handleSubmit = async () => {
    setError(null);
    try {
      await submitForm({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        // Tells whoever follows up where the lead came from and what the
        // student was actually reading, without asking them to explain it.
        howDidYouHear: topMajor
          ? `TOP300 Majors report (top match: ${topMajor})`
          : 'TOP300 Majors report',
        additionalMessage: message.trim() || undefined,
      }).unwrap();
      setSent(true);
    } catch (e: any) {
      setError(
        e?.status === 429
          ? t(
              'majorMatch3.contact.errorRateLimited',
              'You have sent a few requests already. Please try again in a minute.',
            )
          : e?.data?.message ||
              t('majorMatch3.contact.errorGeneric', "That didn't send. Please try again."),
      );
    }
  };

  return createPortal(
    <div className="mm3-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="mm3-modal__panel mm3-modal__panel--narrow"
        role="dialog"
        aria-modal="true"
        aria-label={t('majorMatch3.contact.title', 'Talk to us about your plan')}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="mm3-modal__close"
          onClick={onClose}
          aria-label={t('majorMatch3.results.close', 'Close')}
        >
          <X size={18} />
        </button>

        {sent ? (
          <div className="mm3-contact__done">
            <div className="mm3-results__eyebrow">
              {t('majorMatch3.contact.sentEyebrow', 'Request received')}
            </div>
            <h3 className="mm3-modal__title">
              {t('majorMatch3.contact.sentTitle', 'We will be in touch')}
            </h3>
            <p className="mm3-contact__note">
              {t(
                'majorMatch3.contact.sentBody',
                'A member of the TopCoach team will contact you about the programs that fit your report.',
              )}
            </p>
            <button type="button" className="mm2__btn mm2__btn--primary" onClick={onClose}>
              {t('majorMatch3.contact.sentClose', 'Back to my report')}
            </button>
          </div>
        ) : (
          <>
            <div className="mm3-results__eyebrow">
              {t('majorMatch3.contact.eyebrow', 'Learn more')}
            </div>
            <h3 className="mm3-modal__title">
              {t('majorMatch3.contact.title', 'Talk to us about your plan')}
            </h3>
            <p className="mm3-contact__note">
              {t(
                'majorMatch3.contact.body',
                'Leave your contact and we will walk you through the programs that fit this report.',
              )}
            </p>

            <label className="mm3-contact__label" htmlFor="mm3-contact-name">
              {t('majorMatch3.contact.name', 'Full name')}
            </label>
            <input
              id="mm3-contact-name"
              className="mm3-contact__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />

            <label className="mm3-contact__label" htmlFor="mm3-contact-email">
              {t('majorMatch3.contact.email', 'Email')}
            </label>
            <input
              id="mm3-contact-email"
              className="mm3-contact__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label className="mm3-contact__label" htmlFor="mm3-contact-phone">
              {t('majorMatch3.contact.phone', 'Phone (optional)')}
            </label>
            <input
              id="mm3-contact-phone"
              className="mm3-contact__input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoComplete="tel"
            />

            <label className="mm3-contact__label" htmlFor="mm3-contact-message">
              {t('majorMatch3.contact.message', 'Anything you want to ask (optional)')}
            </label>
            <textarea
              id="mm3-contact-message"
              className="mm3-contact__input mm3-contact__input--area"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {error && <p className="mm3-contact__error">{error}</p>}

            <div className="mm3-contact__actions">
              <button
                type="button"
                className="mm2__btn mm2__btn--primary"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {isLoading
                  ? t('majorMatch3.contact.sending', 'Sending...')
                  : t('majorMatch3.contact.submit', 'Send my contact')}
              </button>
              <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onClose}>
                {t('majorMatch3.contact.cancel', 'Not now')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export const MM3Results: React.FC<MM3ResultsProps> = ({
  report,
  readOnly = false,
  access,
  onRetake,
  onUnlock,
  onBack,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);
  const [selectedUniversity, setSelectedUniversity] = useState<Mm3University | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const majorTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const requiresEnrollment = !readOnly && !!access && !access.canStart && access.requiresCommunityEnrollment;
  const isPartial = report.meta?.source === 'partial';

  const majors = report.majors ?? [];
  const selectedMajor: Mm3Major | undefined = majors[selectedMajorIndex] ?? majors[0];

  // Universities are grouped per-major by `majorIndex` (the reliable
  // grouping key — `matchedMajor` is free-text and not guaranteed to equal
  // any `majors[i].name`). An older cached report generated before
  // `majorIndex` existed carries it on NO university at all; rather than
  // showing nothing for every tab, treat that as a legacy flat list and
  // show it only under the first major.
  const allUniversities = report.universities ?? [];
  const legacyFlatList =
    allUniversities.length > 0 &&
    allUniversities.every((u) => u.majorIndex === undefined || u.majorIndex === null);
  const universitiesForSelectedMajor = legacyFlatList
    ? selectedMajorIndex === 0
      ? allUniversities
      : []
    : allUniversities.filter((u) => u.majorIndex === selectedMajorIndex);

  const rankLabelFor = (index: number): string => {
    const item = MAJOR_RANK_LABELS[Math.min(index, MAJOR_RANK_LABELS.length - 1)];
    return t(item.key, item.fallback);
  };

  const focusMajorTab = (index: number) => {
    requestAnimationFrame(() => majorTabRefs.current[index]?.focus());
  };

  const handleMajorTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (majors.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % majors.length;
      setSelectedMajorIndex(next);
      focusMajorTab(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + majors.length) % majors.length;
      setSelectedMajorIndex(prev);
      focusMajorTab(prev);
    }
  };

  // Stable identity so the modal's escape/scroll-lock effect only registers
  // once per open, not on every parent re-render.
  const closeUniversityModal = useCallback(() => setSelectedUniversity(null), []);

  return (
    <div className="mm3-results">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mm3-results__hero">
        <div className="mm3-results__eyebrow">{t('majorMatch3.results.eyebrow', 'Your TOP300 Majors report')}</div>
        <h1 className="mm3-results__title">
          {report.personaTitle ||
            t('majorMatch3.results.title', 'Here is where you stand, and where you can go.')}
        </h1>
        {report.profileSummary && (
          <p className="mm3-results__summary">{renderEmphasis(report.profileSummary)}</p>
        )}
        {/* strengthChips: short 2-4 word badges, distinct from the full
            `strengths` sentences below — a chip row of full sentences reads
            as a broken list, not a scannable hero. Render NOTHING here when
            absent (older report / model omitted it) rather than falling
            back to `strengths` — that fallback was the bug being fixed. */}
        {report.strengthChips && report.strengthChips.length > 0 && (
          <div className="mm3-results__chips mm3-results__chips--hero">
            {report.strengthChips.map((s, i) => (
              <span className="mm3-results__chip mm3-results__chip--strength" key={i}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Detailed strengths (full sentences) paired with gaps in a 2-up
          grid — they read as a matched pair, not two unrelated panels. */}
      {(report.strengths?.length > 0 || report.gaps?.length > 0) && (
        <div className="mm3-results__grid2">
          {report.strengths?.length > 0 && (
            <div className="mm3-results__panel mm3-results__panel--strengths">
              <h3>{t('majorMatch3.results.strengthsLabel', 'Your strengths')}</h3>
              <ul>
                {report.strengths.map((s, i) => (
                  <li key={i}>{renderEmphasis(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {report.gaps?.length > 0 && (
            <div className="mm3-results__panel mm3-results__panel--gaps">
              <h3>{t('majorMatch3.results.gapsLabel', 'Gaps to close')}</h3>
              <ul>
                {report.gaps.map((g, i) => (
                  <li key={i}>{renderEmphasis(g)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 01 · Majors as tabs ──────────────────────────────────────── */}
      {majors.length > 0 && (
        <section className="mm3-results__section">
          <SectionHeading
            number="01"
            title={t('majorMatch3.results.majorsTitle', 'Your best-fit majors')}
            subtitle={t('majorMatch3.results.majorsSubtitle', 'Explore each match. Choose a major to see why it fits you.')}
          />

          <div
            className="mm3-results__major-tabs"
            role="tablist"
            aria-label={t('majorMatch3.results.majorsTitle', 'Your best-fit majors')}
          >
            {majors.map((m, i) => {
              const isActive = i === selectedMajorIndex;
              return (
                <button
                  key={`${m.name}-${i}`}
                  ref={(el) => {
                    majorTabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`mm3-major-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls="mm3-major-panel"
                  tabIndex={isActive ? 0 : -1}
                  className={
                    isActive ? 'mm3-results__major-tab mm3-results__major-tab--active' : 'mm3-results__major-tab'
                  }
                  onClick={() => setSelectedMajorIndex(i)}
                  onKeyDown={(e) => handleMajorTabKeyDown(e, i)}
                >
                  <span className="mm3-results__major-tab-rank">{rankLabelFor(i)}</span>
                  <span className="mm3-results__major-tab-fit">
                    {m.fitScore}
                    <small> {t('majorMatch3.results.fitSuffix', '/100 FIT')}</small>
                  </span>
                  <span className="mm3-results__major-tab-name">{m.name}</span>
                </button>
              );
            })}
          </div>

          {selectedMajor && (
            <div
              className="mm3-results__major-panel"
              role="tabpanel"
              id="mm3-major-panel"
              aria-labelledby={`mm3-major-tab-${selectedMajorIndex}`}
            >
              {selectedMajor.why && <div className="mm3-results__major-why-callout">{selectedMajor.why}</div>}

              {/* about: optional plain-language blurb — older/in-flight
                  reports may not carry it yet. */}
              {selectedMajor.about && (
                <p className="mm3-results__major-about">
                  <b>{t('majorMatch3.results.aboutTitle', 'What is {{name}}?', { name: selectedMajor.name })}</b>{' '}
                  {selectedMajor.about}
                </p>
              )}

              {/* breakdown: optional — older/in-flight reports may not carry
                  it yet. Render only when present, never a placeholder. */}
              {selectedMajor.breakdown && (
                <div className="mm3-results__breakdown">
                  {BREAKDOWN_ROWS.map((row) => (
                    <div className="mm3-results__breakdown-row" key={row.key}>
                      <span className="mm3-results__breakdown-label">{t(row.labelKey, row.fallback)}</span>
                      <div className="mm3-results__breakdown-track">
                        <span
                          className="mm3-results__breakdown-fill"
                          style={{ width: `${clampPercent(selectedMajor.breakdown![row.key])}%` }}
                        />
                      </div>
                      <span className="mm3-results__breakdown-value">{selectedMajor.breakdown![row.key]}</span>
                    </div>
                  ))}
                  <p className="mm3-results__breakdown-note">
                    {t(
                      'majorMatch3.results.breakdownNote',
                      'How your answers scored across four signals. This shows fit, not ability.',
                    )}
                  </p>
                </div>
              )}

              {selectedMajor.careers?.length > 0 && (
                <div className="mm3-results__chips">
                  {selectedMajor.careers.map((c, ci) => (
                    <span className="mm3-results__chip" key={ci}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Universities for THIS major only, grouped by majorIndex —
                  previously a single flat list shared across all majors,
                  which mixed unrelated schools into one section. Skip the
                  whole block during a partial report (stage 2 failed, so
                  there is nothing to ground it in) rather than showing an
                  empty heading. */}
              {!isPartial &&
                (universitiesForSelectedMajor.length > 0 ? (
                  <div className="mm3-results__major-universities">
                    <div className="mm3-results__uni-label">
                      {t('majorMatch3.results.universitiesForMajorTitle', 'Universities for this major')}
                    </div>

                    {/* The count comes from `meta.catalogueSize`, computed per
                        report against the live catalogue. It used to be the
                        hardcoded string "205", which turns into a false claim
                        the moment universities are imported — in a sentence
                        whose entire purpose is to be trusted. When the backend
                        can't supply a count we drop the number rather than
                        print a stale one. */}
                    <div className="mm3-results__note">
                      <b>{t('majorMatch3.results.provenanceLabel', 'How these were chosen:')}</b>{' '}
                      {report.meta?.catalogueSize
                        ? t('majorMatch3.results.provenanceBodyCount', {
                            count: report.meta.catalogueSize,
                            defaultValue:
                              'selected from the {{count}} universities in the TopCoach catalogue, not generated from memory.',
                          })
                        : t(
                            'majorMatch3.results.provenanceBody',
                            'selected from the universities in the TopCoach catalogue, not generated from memory.',
                          )}
                    </div>

                    <div className="mm3-results__tier-legend">
                      <div className="mm3-results__tier-legend-item">
                        <span className="mm3-results__tier mm3-results__tier--reach">
                          {t('majorMatch3.results.tierReach', 'Reach')}
                        </span>
                        <span className="mm3-results__tier-legend-def">
                          {t('majorMatch3.results.tierReachDef', 'A stretch for your current profile.')}
                        </span>
                      </div>
                      <div className="mm3-results__tier-legend-item">
                        <span className="mm3-results__tier mm3-results__tier--match">
                          {t('majorMatch3.results.tierMatch', 'Match')}
                        </span>
                        <span className="mm3-results__tier-legend-def">
                          {t('majorMatch3.results.tierMatchDef', 'A realistic, well-aligned fit.')}
                        </span>
                      </div>
                      <div className="mm3-results__tier-legend-item">
                        <span className="mm3-results__tier mm3-results__tier--safety">
                          {t('majorMatch3.results.tierSafety', 'Safety')}
                        </span>
                        <span className="mm3-results__tier-legend-def">
                          {t('majorMatch3.results.tierSafetyDef', 'Likely admission based on your profile.')}
                        </span>
                      </div>
                    </div>

                    <div className="mm3-results__uni-list">
                      {universitiesForSelectedMajor.map((u) => (
                        <button
                          type="button"
                          className="mm3-results__uni-list-row"
                          key={u.id}
                          onClick={() => setSelectedUniversity(u)}
                        >
                          <span className="mm3-results__uni-list-row-main">
                            <span className="mm3-results__uni-list-row-name">{u.name}</span>
                            <span className="mm3-results__uni-list-row-meta">
                              {[u.country, u.matchedMajor].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className={`mm3-results__tier ${tierClass(u.tier)}`}>{u.tier}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mm3-results__uni-empty">
                    {t(
                      'majorMatch3.results.noUniversitiesForMajor',
                      'No matched universities for this major in our catalogue yet.',
                    )}
                  </p>
                ))}

              {/* terms: optional per-major glossary. Only render the
                  accordion when there's actually major-specific content to
                  show — the two fixed entries below live inside it rather
                  than always-on so this panel doesn't carry a glossary
                  button that, for most majors today, opens to nothing but
                  boilerplate. */}
              {(selectedMajor.terms?.length ?? 0) > 0 && (
                <details className="mm3-results__glossary">
                  <summary>
                    <ChevronRight size={14} className="mm3-results__glossary-chevron" aria-hidden="true" />
                    {t('majorMatch3.results.glossaryTitle', 'Words on this page, explained')}
                  </summary>
                  <dl className="mm3-results__glossary-list">
                    <div className="mm3-results__glossary-item">
                      <dt>{t('majorMatch3.results.glossaryFitScoreTerm', 'Fit score')}</dt>
                      <dd>
                        {t(
                          'majorMatch3.results.glossaryFitScoreDef',
                          'How closely your answers align with this major, out of 100.',
                        )}
                      </dd>
                    </div>
                    <div className="mm3-results__glossary-item">
                      <dt>{t('majorMatch3.results.glossaryTierTerm', 'Reach / Match / Safety')}</dt>
                      <dd>
                        {t(
                          'majorMatch3.results.glossaryTierDef',
                          'How competitive admission is likely to be for you. Reach is a stretch, Match is realistic, Safety is likely.',
                        )}
                      </dd>
                    </div>
                    {selectedMajor.terms!.map((term, ti) => (
                      <div className="mm3-results__glossary-item" key={ti}>
                        <dt>{term.term}</dt>
                        <dd>{term.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </div>
          )}
        </section>
      )}

      {isPartial && (
        <div className="mm3-results__note">
          {t(
            'majorMatch3.results.partialNote',
            "University matches couldn't be generated this time. Your major matches are below.",
          )}
        </div>
      )}

      {/* ── 02 · Your personalised roadmap ──────────────────────────────
          `report.masterRoadmap` — Gemini-generated, specific to THIS
          student's answers and stated intake. Truncated server-side (never
          in CSS — see `Mm3AnalysisService.gateMasterRoadmap()`) to the first
          phase when the report owner isn't subscribed, reusing the exact
          same TRIALING/ACTIVE check `RoadmapService` already gates the
          standalone roadmap's action items on. LIGHT card only — every
          accent token this design system owns is tuned for light
          backgrounds; a dark panel here has twice produced contrast
          failures elsewhere in this report (1.86:1, 1.72:1) and is
          deliberately not repeated. Hidden entirely for a legacy/partial
          report with no phases at all rather than rendering an empty
          section. */}
      {report.masterRoadmap && report.masterRoadmap.length > 0 && (
        <section className="mm3-results__section">
          <SectionHeading
            number="02"
            title={t('majorMatch3.results.roadmapTitle', 'Your roadmap')}
            subtitle={t(
              'majorMatch3.results.roadmapSubtitle',
              'A personalised plan built from your answers, phase by phase to your target intake.',
            )}
          />

          <ol className="mm3-results__timeline">
            {report.masterRoadmap.map((phase, pi) => (
              <li className="mm3-results__timeline-phase" key={pi}>
                <span className="mm3-results__timeline-marker" aria-hidden="true">
                  {pi + 1}
                </span>
                <div className="mm3-results__timeline-body">
                  <div className="mm3-results__timeline-when">{phase.when}</div>
                  <ul className="mm3-results__timeline-actions">
                    {(phase.actions ?? []).map((a, ai) => (
                      <li key={ai}>{renderEmphasis(a)}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>

          {report.masterRoadmapLocked && (
            <div className="mm3-results__roadmap-lock">
              <div className="mm3-results__roadmap-lock-eyebrow">
                {t('majorMatch3.results.roadmapLockedEyebrow', 'The plan continues')}
              </div>
              <h3 className="mm3-results__roadmap-lock-title">
                {t(
                  'majorMatch3.results.roadmapLockedTitle',
                  'Your full roadmap runs all the way to your target intake',
                )}
              </h3>
              <p className="mm3-results__roadmap-lock-body">
                {t(
                  'majorMatch3.results.roadmapLockedBody',
                  'Showing {{visible}} of {{total}} phases. Subscribe to unlock every remaining step, dated and specific to you.',
                  {
                    visible: report.masterRoadmap.length,
                    total: report.masterRoadmapTotalPhases ?? report.masterRoadmap.length,
                  },
                )}
              </p>
              {/* Straight to the subscription tab — deliberately NOT the
                  shared `onUnlock`, which resolves to
                  `useCommunityAccessGate().destination` and, for a student who
                  hasn't finished the admissions wizard, lands on
                  `?section=placement-profile&step=basic`.

                  That gate encodes the COMMUNITY funnel (profile, then plan).
                  This lock is a different gate entirely: the roadmap is
                  truncated by `hasActiveSubscription()` alone, so completing
                  the profile wizard unlocks NOTHING here. Sending a student
                  who just read "Subscribe to unlock" into a profile form is
                  the same broken promise as a card offering "View full
                  results" that lands on "Begin the assessment".

                  Subscribing without the profile is genuinely allowed —
                  `subscriptions.service.start()` requires a connected Telegram
                  and a card, not a completed admissions profile; the
                  profile-first ordering is a frontend funnel convention. */}
              {!readOnly && (
                <button
                  type="button"
                  className="mm2__btn mm2__btn--primary"
                  onClick={() => navigate(COMMUNITY_FUNNEL_PATHS.subscriptionTab)}
                >
                  <Lock size={14} />
                  {t('majorMatch3.results.roadmapUnlockCta', 'Unlock my full roadmap')}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── 03 · TopCoach's static programme catalogue ───────────────────
          Not model-generated: every student sees the same four programmes,
          read in full BEFORE the unlock CTA at the end of this section. */}
      <section className="mm3-results__section">
        <SectionHeading
          number="03"
          title={t('majorMatch3.programs.title', 'What TopCoach includes')}
          subtitle={t(
            'majorMatch3.programs.subtitle',
            'Read the whole path first: every program, what it includes, how long it takes. Unlock it at the end.',
          )}
        />

        <div className="mm3-results__programs">
          {ROADMAP_PROGRAMS.map((program, pi) => (
            <div className="mm3-results__program" key={program.nameKey}>
              <div className="mm3-results__program-head">
                <span className="mm3-results__program-marker" aria-hidden="true">
                  {pi + 1}
                </span>
                <span className="mm3-results__program-icon" aria-hidden="true">
                  {program.icon}
                </span>
                <span className="mm3-results__program-name">{t(program.nameKey, program.nameFallback)}</span>
                <span className="mm3-results__program-duration">
                  ⏱ {t(program.durationKey, program.durationFallback)}
                </span>
              </div>

              {program.bullets && (
                <ul className="mm3-results__program-bullets">
                  {program.bullets.map((b) => (
                    <li key={b.key}>{t(b.key, b.fallback)}</li>
                  ))}
                </ul>
              )}

              {program.phases && (
                <div className="mm3-results__program-phases">
                  {program.phases.map((phase, phi) => (
                    <div className="mm3-results__program-phase" key={phase.nameKey}>
                      <span className="mm3-results__program-phase-num" aria-hidden="true">
                        {phi + 1}
                      </span>
                      <div className="mm3-results__program-phase-body">
                        <div className="mm3-results__program-phase-head">
                          <b>{t(phase.nameKey, phase.nameFallback)}</b>
                          <span className="mm3-results__program-phase-weeks">
                            {t(phase.weeksKey, phase.weeksFallback)}
                          </span>
                        </div>
                        <p>{t(phase.descKey, phase.descFallback)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mm3-results__outcomes">
          <h3 className="mm3-results__outcomes-title">
            <span aria-hidden="true">✨</span> {t('majorMatch3.programs.outcomesTitle', 'What it all adds up to')}
          </h3>
          <div className="mm3-results__outcomes-grid">
            {ROADMAP_OUTCOMES.map((o, oi) => (
              <div className="mm3-results__outcome" key={o.titleKey}>
                <span className="mm3-results__outcome-num" aria-hidden="true">
                  {String(oi + 1).padStart(2, '0')}
                </span>
                <div className="mm3-results__outcome-body">
                  <b>{t(o.titleKey, o.titleFallback)}</b>
                  <p>{t(o.bodyKey, o.bodyFallback)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signed-in student report: route through the same funnel every
            other locked surface uses (`onUnlock` in the parent already
            resolves to `navigate(useCommunityAccessGate().destination)`),
            never a hardcoded URL or lead-capture form. Hidden entirely in
            the counselor read-only embed — a counselor shouldn't be
            pitched a subscription for their student. */}
        {!readOnly && (
          <div className="mm3-results__programs-actions">
            <button type="button" className="mm2__btn mm2__btn--primary" onClick={onUnlock}>
              {t('majorMatch3.programs.unlockCta', 'Unlock my roadmap')}
            </button>
            {/* "Learn more" now captures a contact instead of navigating to
                /programs. A student who has just read a full report and wants
                to know more is the warmest lead this product produces, and
                bouncing them to a marketing page lost that entirely. */}
            <button
              type="button"
              className="mm2__btn mm2__btn--secondary"
              onClick={() => setContactOpen(true)}
            >
              {t('majorMatch3.programs.learnMoreCta', 'Learn more')}
            </button>
          </div>
        )}
      </section>

      <div className="mm3-results__actions">
        {onBack && (
          <button type="button" className="mm2__btn" onClick={onBack}>
            <ArrowLeft size={14} />
            {t('majorMatch3.results.backCta', 'Back to overview')}
          </button>
        )}
        {!readOnly &&
          (requiresEnrollment ? (
            <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onUnlock}>
              <Lock size={14} />
              {t('studentHub.psychometric.unlockUnlimited', 'Unlock unlimited matches')}
            </button>
          ) : (
            <button type="button" className="mm2__btn mm2__btn--primary" onClick={onRetake}>
              <RotateCcw size={14} />
              {t('majorMatch3.results.retakeCta', 'Retake the assessment')}
            </button>
          ))}
      </div>

      {requiresEnrollment && <MajorMatchUpsell message={access?.promptMessage} onUnlock={onUnlock} />}

      <LearnMoreContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        topMajor={report.majors?.[0]?.name}
      />

      <p className="mm3-results__disclaimer">
        {t(
          'majorMatch3.results.disclaimer',
          "This report is generated from your answers together with TopCoach's university records. Requirements, deadlines and aid policies change every cycle, so always confirm on the university's official admissions page, and review your final list with a TopCoach mentor.",
        )}
      </p>

      {selectedUniversity && (
        <Mm3UniversityModal university={selectedUniversity} degreeLevel={report.meta.targetDegree ?? 'bachelor'} onClose={closeUniversityModal} readOnly={readOnly} />
      )}
    </div>
  );
};
