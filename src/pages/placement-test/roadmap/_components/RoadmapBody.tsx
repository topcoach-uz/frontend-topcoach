import { Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { RoadmapResponse } from 'src/app/services/roadmapApi';
import { generatePlacementRoadmapPdf } from 'src/utils/placementRoadmapPdf';

import styles from '../Roadmap.module.scss';
import { ActionItemRow } from './ActionItemRow';
import { LockedZone } from './LockedZone';
import { PlanPicker } from './PlanPicker';
import { RecommendedMentors } from './RecommendedMentors';
import { useRankedMentors } from './useRankedMentors';
import {
  isElevenYearSystem,
  localizeGradeText,
} from './localizeGradeLanguage';

type Props = {
  data: RoadmapResponse;
  /** Where the in-page "Choose a plan" CTA should route to. */
  onChoosePlan: () => void;
  /** Resource-link click handler for the unlocked TopCoach buttons. */
  onOpenTopcoach: (path: string) => void;
};

/**
 * One continuous editorial "report" card. Banner → student strip →
 * summary → timeline → action plan → recommended mentors → footer (with
 * download button) all live inside a single rounded container with
 * hairline dividers between sections — feels more like a printed
 * report than a stack of separate cards.
 */
export function RoadmapBody({
  data,
  onChoosePlan,
  onOpenTopcoach,
}: Props) {
  const navigate = useNavigate();
  const { meta, roadmap } = data;
  const hiddenCount = Math.max(
    0,
    meta.totalActionItems - meta.visibleActionItems,
  );

  const { mentors: rankedMentors, isLoading: mentorsLoading } =
    useRankedMentors(
      meta.academicInterests ?? [],
      meta.targetUniversities ?? [],
      3,
    );

  // For students in 11-year school systems already at grade 11, rewrite
  // any leftover "grade 12" language in the stored roadmap copy. The
  // prompt now avoids this directly, but older saved roadmaps still
  // need patching so users don't see references to a year that doesn't
  // exist for them.
  const localize = isElevenYearSystem(meta.country, meta.gradeLevel)
    ? localizeGradeText
    : (s: string) => s;

  return (
    <>
      <article className={styles.report}>
        <header className={styles.banner}>
          <div>
            <div className={styles.banner__eyebrow}>Top Coach University</div>
            <h1 className={styles.banner__title}>
              Personalized Admissions Roadmap
            </h1>
          </div>
          <div className={styles.banner__date}>
            <small>Generated</small>
            {formatDate(meta.generatedAt)}
          </div>
        </header>

        <div className={styles.studentStrip}>
          <div className={styles.studentStrip__cell}>
            <small>Student</small>
            <strong>{meta.studentName}</strong>
          </div>
          <div className={styles.studentStrip__cell}>
            <small>Grade</small>
            <strong>{meta.gradeLevel ?? '—'}</strong>
          </div>
          <div className={styles.studentStrip__cell}>
            <small>SAT</small>
            <strong>{meta.satScore ?? '—'}</strong>
          </div>
          <div className={styles.studentStrip__cell}>
            <small>English</small>
            <strong>
              {meta.placementLevel ?? '—'}
              {meta.placementScore != null
                ? ` · ${meta.placementScore}%`
                : ''}
            </strong>
          </div>
          <div className={styles.studentStrip__cell}>
            <small>Profile</small>
            <strong className={strengthClass(meta.strength)}>
              {meta.strength}
            </strong>
          </div>
        </div>

        {/* Personalized summary */}
        <section className={styles.reportSection}>
          <span className={styles.sectionEyebrow}>Summary</span>
          <p className={styles.summary}>
            {localize(roadmap.personalizedSummary)}
          </p>
        </section>

        {/* Timeline */}
        <section className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Timeline</span>
            <span className={styles.sectionTag}>3 phases</span>
          </div>
          <div className={styles.timeline}>
            {roadmap.timeline.map((p, i) => (
              <article className={styles.timelineCard} key={p.phase}>
                <div className={styles.timelineCard__phaseNum}>
                  Phase {String(i + 1).padStart(2, '0')}
                </div>
                <div className={styles.timelineCard__phase}>{p.phase}</div>
                <div className={styles.timelineCard__period}>
                  {localize(p.period)}
                </div>
                <p className={styles.timelineCard__focus}>
                  {localize(p.focus)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Action plan */}
        <section className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Action plan</span>
            <span className={styles.sectionTag}>
              {meta.totalActionItems} {meta.totalActionItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className={styles.actionList}>
            {roadmap.actionItems.map((item, i) => (
              <ActionItemRow
                key={i}
                item={{
                  ...item,
                  description: localize(item.description),
                  timeline: localize(item.timeline),
                }}
                redactLinks={meta.isPreview}
                onOpenTopcoach={onOpenTopcoach}
              />
            ))}
            {meta.isPreview && hiddenCount > 0 ? (
              <LockedZone hiddenCount={hiddenCount} />
            ) : null}
          </div>
        </section>

        {/* Recommended mentors */}
        <section className={styles.reportSection}>
          <RecommendedMentors
            mentors={rankedMentors}
            isLoading={mentorsLoading}
            primaryInterest={(meta.academicInterests ?? [])[0] ?? null}
            onOpenMentor={(id) => navigate(`/mentors/${id}`)}
            onOpenAllMentors={() => navigate('/mentors')}
          />
        </section>

        {/* Footer — only for unlocked users; preview users see the plan picker below */}
        {!meta.isPreview ? (
          <div className={styles.reportFooter}>
            <span className={styles.regenInfo}>
              Generated {formatDate(meta.generatedAt)}.
            </span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() =>
                generatePlacementRoadmapPdf(
                  applyLocalizationToResponse(data, localize),
                  { mentors: rankedMentors },
                )
              }
              title="Download a printable copy of your roadmap"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        ) : null}
      </article>

      {meta.isPreview ? <PlanPicker onChoose={onChoosePlan} /> : null}
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function strengthClass(s: 'Developing' | 'Competitive' | 'Strong'): string {
  if (s === 'Strong') return styles.studentStrip__strengthStrong;
  if (s === 'Competitive') return styles.studentStrip__strengthCompetitive;
  return styles.studentStrip__strengthDeveloping;
}

/**
 * Shallow-clone the roadmap payload with `localize` applied to every
 * field that may carry "grade 12" wording — so the downloaded PDF
 * shows the same corrected copy the on-page report shows.
 */
function applyLocalizationToResponse(
  data: import('src/app/services/roadmapApi').RoadmapResponse,
  localize: (s: string) => string,
): import('src/app/services/roadmapApi').RoadmapResponse {
  return {
    ...data,
    roadmap: {
      ...data.roadmap,
      personalizedSummary: localize(data.roadmap.personalizedSummary),
      timeline: data.roadmap.timeline.map((p) => ({
        ...p,
        period: localize(p.period),
        focus: localize(p.focus),
      })),
      actionItems: data.roadmap.actionItems.map((item) => ({
        ...item,
        description: localize(item.description),
        timeline: localize(item.timeline),
      })),
    },
  };
}
