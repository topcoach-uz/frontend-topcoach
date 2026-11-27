import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookmarkCheck, BookmarkPlus, Building2, ChevronDown, ChevronRight, Clock3, Compass, Flag, Lock, MessageCircle, RotateCcw, Sparkles, Users, X } from 'lucide-react';
import type {
  MajorMatchAccessStatus,
  Mm3Major,
  Mm3Report,
  Mm3University,
} from '../../../../app/services/student-hub/majorMatchApi';
import {
  useCreateCollegeApplicationMutation,
  useGetCollegeApplicationsQuery,
} from '../../../../app/services/student-hub/applicationTrackingApi';
import type { CreateCollegeApplicationRequest } from '../../../../app/services/student-hub/types';
import { useSubmitFormMutation } from '../../../../app/services/contactApi';
import { useTypedSelector } from '../../../../app/store';
import { renderEmphasis } from '../renderEmphasis';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import { suggestMentors } from '../mentorSuggestions';
import { getLatestCreatedImg } from 'src/utils';
import MajorIllustration from './MajorIllustration';
import MajorComparison from './MajorComparison';
import MajorProfileOverview from './MajorProfileOverview';
import UniversityDetailContent from './UniversityDetailContent';
import CampusEditorialIllustration from './CampusEditorialIllustration';
import RoadmapJourneyBoard from './RoadmapJourneyBoard';
import OutcomeWorkPreview from './OutcomeWorkPreview';
import { useGetUniversityFiltersQuery } from '../../../../app/services/universities';
import { buildUniversitySubjectOptions } from '../../applicant/universityFieldOptions';
import { findUniversitiesLink } from '../../applicant/findUniversitiesLink';
import { applicantLinks } from '../../../../lib/applicantWorkspace';
import '../mm3-results.scss';
import '../mm3-results-refresh.scss';
import '../university-detail.scss';
import '../topcoach-programs.scss';

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
 * The personalised `report.masterRoadmap` stays independent and accessible.
 * This optional catalogue explains TopCoach's authored support options.
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

/** Authored programme catalogue; independent of whether an assessment exists. */
export function TopCoachPrograms({ readOnly = false, defaultOpen = false, onLearnMore }: { readOnly?: boolean; defaultOpen?: boolean; onLearnMore?: () => void }) {
  const { t } = useTranslation();
  const visuals = [
    { image: '/img/viola_programs.jpeg', caption: 'Viola Fur · Oxford & Yale graduate', label: 'Your story. Your voice.', workspace: 'Essay & portfolio', steps: ['Find your story', 'Shape your draft', 'Review with your coach'] },
    { image: null, caption: '', label: 'From question to discovery.', workspace: 'Research workspace', steps: ['Research question', 'Evidence & methodology', 'Paper & presentation'] },
    { image: '/img/abdulaziz_sat.jpg', caption: 'TopCoach SAT Prep', label: 'Practice with a purpose.', workspace: 'Practice workspace', steps: ['Full mock tests', 'Focused section drills', 'Review your progress'] },
    { image: '/img/azizbek_programs.jpeg', caption: 'Azizbek Zaylobiddinov · Harvard University', label: 'A path built around you.', workspace: 'Your personal plan', steps: ['Explore your direction', 'Plan with a mentor', 'Build your next step'] },
  ];
  return <details className="mm3-results__section mm3-results__catalogue mm3-program-catalogue" open={defaultOpen || undefined}>
    <summary><span className="mm3-program-catalogue__summary-icon"><Sparkles size={22} aria-hidden="true" /></span><div><strong>{t('majorMatch3.results.supportCatalogue', 'Explore TopCoach programs')}</strong><span>{t('majorMatch3.results.supportCatalogueHint', 'Optional support for your next steps')}</span></div><ChevronDown size={20} aria-hidden="true" /></summary>
    <div className="mm3-program-catalogue__intro"><span className="mm3-results__eyebrow">{t('majorMatch3.programs.supportEyebrow', 'Support for the path ahead')}</span><h2>{t('majorMatch3.programs.title', 'What TopCoach includes')}</h2><p>{t('majorMatch3.programs.subtitle', 'Every program, what it includes, and how long it takes.')}</p><small>{t('majorMatch3.programs.optionalSupport', 'These are separate support options—not a required sequence. Your personal roadmap remains available.')}</small></div>
    <div className="mm3-program-catalogue__grid">{ROADMAP_PROGRAMS.map((program, index) => <article className="mm3-program-catalogue__card" key={program.nameKey}>
      <header><span className="mm3-program-catalogue__number">{String(index + 1).padStart(2, '0')}</span><span className="mm3-program-catalogue__duration"><Clock3 size={13} aria-hidden="true" />{t(program.durationKey, program.durationFallback)}</span></header>
      <div className="mm3-program-catalogue__identity"><h3>{t(program.nameKey, program.nameFallback)}</h3><p>{t(`majorMatch3.programs.visual${index}Tagline`, visuals[index].label)}</p></div>
      <div className={`mm3-program-catalogue__visual mm3-program-catalogue__visual--${index}`}>
        {visuals[index].image && <figure><img src={visuals[index].image!} alt={visuals[index].caption} loading="lazy" /><figcaption>{visuals[index].caption}</figcaption></figure>}
        <div className="mm3-program-catalogue__workspace"><span className="mm3-program-catalogue__workspace-label">{t('majorMatch3.programs.featureIllustration', 'Feature illustration')}</span><strong>{t(`majorMatch3.programs.visual${index}Workspace`, visuals[index].workspace)}</strong><div>{visuals[index].steps.map((step, stepIndex) => <div key={step}><span aria-hidden="true">{String(stepIndex + 1).padStart(2, '0')}</span>{t(`majorMatch3.programs.visual${index}Step${stepIndex}`, step)}</div>)}</div><span className="mm3-program-catalogue__workspace-footer"><Sparkles size={12} aria-hidden="true" />{t('majorMatch3.programs.visualSupport', 'With TopCoach support')}</span></div>
      </div>
      {program.bullets && <ul className="mm3-program-catalogue__bullets">{program.bullets.map(bullet => <li key={bullet.key}>{t(bullet.key, bullet.fallback)}</li>)}</ul>}
      {program.phases && <div className="mm3-program-catalogue__phases">{program.phases.map((phase, phaseIndex) => <div key={phase.nameKey}><span aria-hidden="true">{phaseIndex + 1}</span><div><header><h4>{t(phase.nameKey, phase.nameFallback)}</h4><small>{t(phase.weeksKey, phase.weeksFallback)}</small></header><p>{t(phase.descKey, phase.descFallback)}</p></div></div>)}</div>}
    </article>)}</div>
    <section className="mm3-program-catalogue__outcomes">
      <header><div><span className="mm3-results__eyebrow">{t('majorMatch3.programs.outcomesEyebrow', 'The bigger picture')}</span><h3>{t('majorMatch3.programs.outcomesStoryTitle', 'Build a profile with a story.')}</h3><p>{t('majorMatch3.programs.outcomesStoryBody', 'Turn your interests into work you can share—and a direction you can explain.')}</p></div><div className="mm3-program-catalogue__outcome-note"><Compass size={24} aria-hidden="true" /><span>{t('majorMatch3.programs.outcomesScope', 'Depending on your chosen programme. Outcomes vary; publication and admission are not guaranteed.')}</span></div></header>
      <div className="mm3-program-catalogue__deliverables">{[3, 2, 4].map((index, position) => {
        const outcome = ROADMAP_OUTCOMES[index];
        return <article key={outcome.titleKey}>
          <OutcomeWorkPreview kind={position} />
          <div className="mm3-program-catalogue__deliverable-copy"><span>{t(`majorMatch3.programs.outputCategory${position}`, ['DIRECTION', 'DISCOVERY', 'EVIDENCE'][position])}</span><h4>{position === 1 ? t('majorMatch3.programs.researchOutputTitle', 'A research paper to build on') : t(outcome.titleKey, outcome.titleFallback)}</h4><p>{position === 1 ? t('majorMatch3.programs.researchOutputBody', 'Develop a research question into a paper, with guidance through writing and revision.') : t(outcome.bodyKey, outcome.bodyFallback)}</p></div>
        </article>;
      })}</div>
      <div className="mm3-program-catalogue__support"><span>{t('majorMatch3.programs.supportBehindWork', 'The support behind your work')}</span><div>{[0, 1, 5].map((index, position) => {
        const outcome = ROADMAP_OUTCOMES[index];
        const Icon = [Clock3, Users, Compass][position];
        return <article key={outcome.titleKey}><span><Icon size={19} aria-hidden="true" /></span><div><h4>{t(outcome.titleKey, outcome.titleFallback)}</h4><p>{t(outcome.bodyKey, outcome.bodyFallback)}</p></div></article>;
      })}</div></div>
    </section>
    {!readOnly && <div className="mm3-program-catalogue__cta"><div><strong>{t('majorMatch3.programs.supportChoiceTitle', 'Choose support that fits your next step.')}</strong><p>{t('majorMatch3.programs.supportChoiceNote', 'Explore the options with the TopCoach team before choosing a programme.')}</p></div>{onLearnMore ? <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onLearnMore}>{t('majorMatch3.programs.learnMoreCta', 'Learn more')}<ArrowUpRight size={16} aria-hidden="true" /></button> : <Link to="/programs">{t('majorMatch3.programs.learnMoreCta', 'Learn more')}<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>}
  </details>;
}

/** The full detail for one university — everything the old per-university
 * card used to render inline, unchanged, now shown in a modal opened from
 * the compact list row. Portaled to document.body so it isn't clipped by
 * any ancestor's overflow/stacking context. */
const Mm3UniversityModal: React.FC<{ university: Mm3University; degreeLevel: 'bachelor' | 'master'; onClose: () => void; readOnly: boolean; sampleReport?: boolean }> = ({
  university,
  degreeLevel,
  onClose,
  readOnly,
  sampleReport = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const universityPanelRef = useRef<HTMLDivElement>(null);

  // "Already saved" is detected against the student's real college list
  // rather than tracked in purely local state, because the backend has NO
  // duplicate guard on this endpoint — createCollegeApplication just
  // inserts. A second click with only local state would silently write a
  // second row. Skipped entirely for the counselor read-only embed, which
  // must never write into a student's list.
  const { data: collegeApplications } = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: readOnly || sampleReport },
  );
  const alreadySaved = !readOnly && !!collegeApplications?.data?.some((a) =>
    a.universityId === university.id && (a.degreeLevel ?? 'bachelor') === degreeLevel && a.major === university.matchedMajor,
  );

  const [createCollegeApplication, { isLoading: isSaving }] = useCreateCollegeApplicationMutation();
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSavedNow = alreadySaved || justSaved;

  const handleSave = async () => {
    if (sampleReport || readOnly || !university.id || isSaving || isSavedNow) return;
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
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    universityPanelRef.current?.querySelector<HTMLButtonElement>('.mm3-modal__close')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const focusable = Array.from(universityPanelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first && e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (last && !e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div className="mm3-modal__backdrop" onClick={onClose}>
      <div
        className="mm3-modal__panel mm3-modal__panel--university"
        ref={universityPanelRef}
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

        <div className="mm3-modal__header mm3-university__header">
          {sampleReport && <p className="mm3-modal__sample-note">Design preview · Fictional university & illustrative data · Saving disabled</p>}
          <div className="mm3-university__identity-grid"><div>
          <span className="mm3-university__eyebrow"><Building2 size={16} aria-hidden="true" />{t('majorMatch3.results.universityMatch', 'Your university match')}</span>
          <h3>{university.name}</h3>
          <div className="mm3-results__uni-meta">
            {[university.country, university.matchedMajor].filter(Boolean).join(' · ')}
          </div>
          <div className="mm3-university__tier-explanation"><span className={`mm3-results__tier ${tierClass(university.tier)}`}>{university.tier}</span><span>{university.tier === 'Reach'
            ? t('majorMatch3.results.tierReachDef', 'A stretch for your current profile.')
            : university.tier === 'Match' ? t('majorMatch3.results.tierMatchDef', 'A realistic, well-aligned fit.')
            : t('majorMatch3.results.tierSafetyDef', 'Likely admission based on your profile.')} {t('majorMatch3.results.tierNotProbability', 'Not an admission probability or guarantee.')}</span></div>
          </div><div className="mm3-university__campus-visual"><CampusEditorialIllustration /><span>{t('majorMatch3.results.campusIllustration', 'Decorative illustration · not the university campus')}</span></div></div>
        </div>
        <div className="mm3-modal__body mm3-university__body">
          {university.admissionOdds && <div className="mm3-results__uni-row"><span>{t('majorMatch3.results.admissionOddsLabel', 'Admission odds')}</span><span>{university.admissionOdds}</span></div>}
          <UniversityDetailContent university={university} />
        </div>
        <div className="mm3-university__footer">
          <p>{sampleReport ? 'Sample data only. No changes will be saved.' : t('majorMatch3.results.verifyUniversityDetails', 'Confirm fees, requirements and deadlines with the university before applying.')}</p>

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
                      navigate(applicantLinks.applications)
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
                  disabled={sampleReport || !university.id || isSaving}
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

      </div>
    </div>,
    document.body,
  );
};

/** Primary hand-off from results into Find universities, pre-filtered to the major when the catalogue has a match. */
const SeeUniversitiesCta: React.FC<{ majorName: string; degree: 'bachelor' | 'master'; placement: 'matches' | 'end' }> = ({ majorName, degree, placement }) => {
  const { t } = useTranslation();
  const isMaster = degree === 'master';
  const filters = useGetUniversityFiltersQuery('undergraduate', { skip: isMaster });
  const to = isMaster ? applicantLinks.universities : findUniversitiesLink(majorName, buildUniversitySubjectOptions(filters.data?.majors ?? [], 'undergraduate'));
  return (
    <div className={`mm3-results__see-universities mm3-results__see-universities--${placement}`}>
      {placement === 'end' && <p>{t('majorMatch3.results.seeUniversitiesEndLead', 'Your matches are ready. See where you could study them.')}</p>}
      <Link className="mm2__btn mm2__btn--primary" to={to}>
        {isMaster
          ? t('majorMatch3.results.seeUniversitiesMaster', 'See universities')
          : t('majorMatch3.results.seeUniversitiesCta', { major: majorName, defaultValue: 'See universities for {{major}}' })}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
};

interface MM3ResultsProps {
  report: Mm3Report;
  readOnly?: boolean;
  sampleReport?: boolean;
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
  sampleReport = false,
  access,
  onRetake,
  onUnlock,
  onBack,
}) => {
  const { t } = useTranslation();

  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);
  const { data: mentorDirectory = [], isLoading: mentorsLoading } = useGetMentorsQuery(undefined, { skip: readOnly });
  const suggestedMentors = suggestMentors(mentorDirectory, (report.majors ?? []).map(major => major.name));
  const [selectedUniversity, setSelectedUniversity] = useState<Mm3University | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const majorTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const requiresEnrollment = !readOnly && !!access && !access.canStart && access.requiresCommunityEnrollment;
  const hasCommunityAccess = !!access?.isCommunityEnrolled;
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
    <div className="mm3-results mm3-results--discovery">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mm3-results__hero">
        <div className="mm3-results__hero-copy">
        <div className="mm3-results__eyebrow">{t('majorMatch3.results.discoveryEyebrow', 'AI Major Match · Your future, mapped')}{sampleReport && <span className="mm3-results__sample-badge">Sample report</span>}</div>
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
        <a className="mm3-results__hero-link" href="#mm3-matches">{t('majorMatch3.results.exploreMatches', 'Explore your matches')} <ArrowUpRight size={18} /></a>
        </div>
        <div className="mm3-results__direction-art" aria-hidden="true">
          <svg viewBox="0 0 260 260" fill="none"><circle cx="130" cy="130" r="112" stroke="currentColor" strokeOpacity=".18" /><circle cx="130" cy="130" r="78" stroke="currentColor" strokeOpacity=".24" strokeDasharray="3 7" /><path d="M18 130h224M130 18v224M51 51l158 158M51 209 209 51" stroke="currentColor" strokeOpacity=".12" /><circle cx="130" cy="18" r="5" fill="currentColor" /><circle cx="209" cy="209" r="5" fill="currentColor" /><path d="m169 88-23 58-58 25 24-59 57-24Z" fill="currentColor" /><path d="m169 88-39 42-42 41 24-59 57-24Z" fill="#f6c7aa" /><circle cx="130" cy="130" r="7" fill="#7b1f2f" /></svg>
          <span><Compass size={15} /> {t('majorMatch3.results.directionLabel', 'A direction, not a destination')}</span>
          <div className="mm3-results__orbit-labels">{majors.slice(0, 3).map((major, index) => <span key={index}><Sparkles size={12} />{major.name}</span>)}</div>
        </div>
      </div>
      <nav className="mm3-results__report-nav" aria-label={t('majorMatch3.results.reportNav', 'Report sections')}>
        <a href="#mm3-matches"><Sparkles size={16} />{t('majorMatch3.results.matchesNav', 'Your matches')}</a>
        {!!report.masterRoadmap?.length && <a href="#mm3-roadmap"><Flag size={16} />{t('majorMatch3.results.planNav', 'Your roadmap')}</a>}
        {!readOnly && majors.length > 0 && <a href="#mm3-mentor-suggestions"><Users size={16} />{t('majorMatch3.results.mentorsNav', 'Find your mentor')}</a>}
      </nav>

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
        <section className="mm3-results__section" id="mm3-matches">
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
                    `mm3-results__major-tab mm3-results__major-tab--tone-${i % 3}${isActive ? ' mm3-results__major-tab--active' : ''}`
                  }
                  onClick={() => setSelectedMajorIndex(i)}
                  onKeyDown={(e) => handleMajorTabKeyDown(e, i)}
                >
                  <span className="mm3-results__major-tab-rank">{rankLabelFor(i)}</span>
                  <MajorIllustration name={m.name} />
                  <span className="mm3-results__major-tab-name">{m.name}</span>
                  {m.why && <span className="mm3-results__card-reason">{m.why}</span>}
                  <span className="mm3-results__card-footer"><span>{m.fitScore} <small>{t('majorMatch3.results.fitSuffix', '/100 FIT')}</small></span><ArrowUpRight size={18} aria-hidden="true" /></span>
                </button>
              );
            })}
          </div>

          {majors.length > 1 && <MajorComparison majors={majors} />}

          {selectedMajor && (
            <div
              className="mm3-results__major-panel"
              role="tabpanel"
              id="mm3-major-panel"
              aria-labelledby={`mm3-major-tab-${selectedMajorIndex}`}
            >
              <MajorProfileOverview major={selectedMajor} />
              {!readOnly && !sampleReport && selectedMajor && <SeeUniversitiesCta majorName={selectedMajor.name} degree={report.meta?.targetDegree ?? 'bachelor'} placement="matches" />}

              {/* Universities for THIS major only, grouped by majorIndex —
                  previously a single flat list shared across all majors,
                  which mixed unrelated schools into one section. Skip the
                  whole block during a partial report (stage 2 failed, so
                  there is nothing to ground it in) rather than showing an
                  empty heading. */}
              {!isPartial &&
                (universitiesForSelectedMajor.length > 0 ? (
                  <div className="mm3-results__major-universities">
                    <h3 className="mm3-results__university-heading">
                      <Building2 size={22} aria-hidden="true" />
                      {t('majorMatch3.results.universitiesForMajorTitle', 'Universities for this major')}
                    </h3>

                    {/* The count comes from `meta.catalogueSize`, computed per
                        report against the live catalogue. It used to be the
                        hardcoded string "205", which turns into a false claim
                        the moment universities are imported — in a sentence
                        whose entire purpose is to be trusted. When the backend
                        can't supply a count we drop the number rather than
                        print a stale one. */}
                    <div className="mm3-results__note">
                      <b>{t('majorMatch3.results.provenanceLabel', 'How these were chosen:')}</b>{' '}
                      {sampleReport ? 'Fictional examples for this local design preview—not university recommendations or verified admissions data.' : report.meta?.catalogueSize
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
                          <span className="mm3-results__university-card-top"><Building2 size={23} aria-hidden="true" /><span className={`mm3-results__tier ${tierClass(u.tier)}`}>{u.tier}</span></span>
                          <span className="mm3-results__uni-list-row-main">
                            <span className="mm3-results__uni-list-row-name">{u.name}</span>
                            <span className="mm3-results__uni-list-row-meta">
                              {[u.country, u.matchedMajor].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="mm3-results__uni-list-row-cost"><span>{t('majorMatch3.results.tuitionLabel', 'Tuition (our records)')}</span><strong>{u.tuitionUnreliable
                              ? t('majorMatch3.results.tuitionUnreliable', 'See official page (figure under review)')
                              : u.tuition ?? t('majorMatch3.results.tuitionUnknown', 'See official page')}</strong></span>
                          <span className="mm3-results__university-card-link">{t('majorMatch3.results.viewUniversityDetails', 'View details')}<ArrowUpRight size={16} aria-hidden="true" /></span>
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

      {/* Full personalised roadmap from this student's report. */}
      {report.masterRoadmap && report.masterRoadmap.length > 0 && (
        <section className="mm3-results__section" id="mm3-roadmap">
          <SectionHeading
            number="02"
            title={t('majorMatch3.results.roadmapTitle', 'Your roadmap')}
            subtitle={t(
              'majorMatch3.results.roadmapSubtitle',
              'A personalised plan built from your answers, phase by phase to your target intake.',
            )}
          />

          <RoadmapJourneyBoard phases={report.masterRoadmap} readOnly={readOnly} />

        </section>
      )}

      {!readOnly && report.majors?.[0] && (
        <aside className="mm3-results__mentor-note" id="mm3-mentor-suggestions">
          <div className="mm3-results__eyebrow"><Users size={16} /> {t('majorMatch3.results.mentorEyebrow', 'People behind the possibilities')}</div>
          <h3>{t('majorMatch3.results.mentorsTitle', 'Mentors for your direction')}</h3>
          <p>Explore mentors whose subjects overlap with your matches. These are directory suggestions, not mentor feedback or a guarantee of fit.</p>
          <div className="mm3-results__mentor-grid">{suggestedMentors.map(mentor => {
            const photo = getLatestCreatedImg(mentor.profile?.media || []);
            const name = mentor.profile?.name || 'Mentor';
            return <Link className="mm3-results__mentor-card" key={mentor.id} to={`/mentors/${mentor.id}`}>
              <div className="mm3-results__mentor-avatar">{photo ? <img src={photo} alt="" loading="lazy" /> : <span>{name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>}<ArrowUpRight size={17} /></div>
              <strong>{name}</strong><span className="mm3-results__mentor-university">{mentor.mentorProfile.university}</span><span className="mm3-results__mentor-subject">{mentor.mentorProfile.major}</span>
              <span className="mm3-results__mentor-cta">{t('majorMatch3.results.viewMentor', 'Meet this mentor')} <ArrowUpRight size={15} /></span>
            </Link>;
          })}</div>
          {!mentorsLoading && !suggestedMentors.length && <p>No subject-specific mentor match is available yet.</p>}
          <Link to="/mentors">Browse all mentors</Link>
          <div className="mm3-results__mentor-prompt"><MessageCircle size={22} aria-hidden="true" /><div><strong>{t('majorMatch3.results.mentorSuggestionTitle', 'A question for your mentor')}</strong>
          <p>{t('majorMatch3.results.mentorSuggestionBody', {
            major: report.majors[0].name,
            defaultValue: 'Ask a mentor how {{major}} compares with your other matches, and which projects or courses could help you test that direction.',
          })}</p>
          <small>{t('majorMatch3.results.mentorSuggestionDisclaimer', 'Suggested by AI from your report; not feedback written by a mentor.')}</small>
          </div></div>
        </aside>
      )}

      {majors.length > 0 && !report.masterRoadmap?.length && (
        <div className="mm3-results__next-step"><div><span className="mm3-results__eyebrow">{t('majorMatch3.results.nextStepEyebrow', 'From insight to action')}</span><h3>{t('majorMatch3.results.nextStepTitle', 'Start with one small step.')}</h3><p>{report.masterRoadmap?.[0]?.actions?.[0] || t('majorMatch3.results.nextStepFallback', 'Explore an introductory course in the direction that interests you most.')}</p><small>{t('majorMatch3.results.nextStepNote', 'A suggested starting point—not a completed task.')}</small></div><a href={report.masterRoadmap?.length ? '#mm3-roadmap' : '#mm3-matches'}>{report.masterRoadmap?.length ? t('majorMatch3.results.planNav', 'Your roadmap') : t('majorMatch3.results.matchesNav', 'Your matches')} <ArrowUpRight size={18} /></a></div>
      )}

      {!readOnly && !hasCommunityAccess && (
        <aside className="mm3-results__community-ad" id="mm3-community-access">
          <div className="mm3-results__community-art" aria-hidden="true"><Users size={34} /><span /><span /></div>
          <div>
            <strong>{t('majorMatch3.results.communityAdTitle', 'Keep making progress together')}</strong>
            <p>{t('majorMatch3.results.communityAdBody', 'Your full roadmap stays available. Community access adds peer connections and a place to learn together.')}</p>
          </div>
          <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onUnlock}>
            {t('majorMatch3.results.communityAdCta', 'Explore Community access')}
          </button>
        </aside>
      )}

      {/* TopCoach's static programme catalogue, separate from the roadmap. */}
      <TopCoachPrograms defaultOpen readOnly={readOnly || sampleReport} onLearnMore={() => setContactOpen(true)} />

      {!readOnly && !sampleReport && majors[0] && <SeeUniversitiesCta majorName={majors[0].name} degree={report.meta?.targetDegree ?? 'bachelor'} placement="end" />}

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
            <button type="button" className="mm2__btn mm2__btn--primary" onClick={onRetake} disabled={sampleReport}>
              <RotateCcw size={14} />
              {t('majorMatch3.results.retakeCta', 'Retake the assessment')}
            </button>
          ))}
      </div>

      <LearnMoreContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        topMajor={report.majors?.[0]?.name}
      />

      <p className="mm3-results__disclaimer">
        {sampleReport ? 'Local sample only: scores, phases, university names, tuition, aid and requirements are fictional display data, not an assessment or admissions advice.' : t(
          'majorMatch3.results.disclaimer',
          "This report is generated from your answers together with TopCoach's university records. Requirements, deadlines and aid policies change every cycle, so always confirm on the university's official admissions page, and review your final list with a TopCoach mentor.",
        )}
      </p>

      {selectedUniversity && (
        <Mm3UniversityModal university={selectedUniversity} degreeLevel={report.meta.targetDegree ?? 'bachelor'} onClose={closeUniversityModal} readOnly={readOnly} sampleReport={sampleReport} />
      )}
    </div>
  );
};
