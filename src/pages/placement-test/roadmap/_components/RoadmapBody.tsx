import { Download } from 'lucide-react';

import type { RoadmapResponse } from 'src/app/services/roadmapApi';
import { generatePlacementRoadmapPdf } from 'src/utils/placementRoadmapPdf';

import styles from '../Roadmap.module.scss';
import { ActionItemRow } from './ActionItemRow';
import { LockedZone } from './LockedZone';
import { PlanPicker } from './PlanPicker';

type Props = {
  data: RoadmapResponse;
  /** Where the in-page "Choose a plan" CTA should route to. */
  onChoosePlan: () => void;
  /** Resource-link click handler for the unlocked TopCoach buttons. */
  onOpenTopcoach: (path: string) => void;
};

/**
 * Pure roadmap content (banner → student strip → summary → timeline →
 * action plan → paywall/plan picker if preview). No outer `.page`
 * background — the caller decides whether to wrap in the editorial
 * cream background or render inside an existing layout (settings tab).
 *
 * Read-only by design: no Edit / Regenerate affordances. The roadmap
 * is the report; profile lives elsewhere. Users return to the hub via
 * the parent page's top "Back to dashboard" link.
 */
export function RoadmapBody({
  data,
  onChoosePlan,
  onOpenTopcoach,
}: Props) {
  const { meta, roadmap } = data;
  const hiddenCount = Math.max(
    0,
    meta.totalActionItems - meta.visibleActionItems,
  );

  return (
    <>
      {/* Banner */}
      <section>
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

        {/* Student strip */}
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
      </section>

      {/* Personalized summary */}
      <section className={`${styles.card} ${styles.section}`}>
        <span className={styles.sectionEyebrow}>Summary</span>
        <p className={styles.summary}>{roadmap.personalizedSummary}</p>
      </section>

      {/* Timeline */}
      <section className={`${styles.card} ${styles.section}`}>
        <span className={styles.sectionEyebrow}>Timeline</span>
        <div className={styles.timeline}>
          {roadmap.timeline.map((p) => (
            <article className={styles.timelineCard} key={p.phase}>
              <div className={styles.timelineCard__phase}>{p.phase}</div>
              <div className={styles.timelineCard__period}>{p.period}</div>
              <p className={styles.timelineCard__focus}>{p.focus}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Action plan */}
      <section className={`${styles.card} ${styles.section}`}>
        <span className={styles.sectionEyebrow}>
          Action plan ({meta.totalActionItems} items)
        </span>
        <div className={styles.actionList}>
          {roadmap.actionItems.map((item, i) => (
            <ActionItemRow
              key={i}
              item={item}
              redactLinks={meta.isPreview}
              onOpenTopcoach={onOpenTopcoach}
            />
          ))}
          {meta.isPreview && hiddenCount > 0 ? (
            <LockedZone hiddenCount={hiddenCount} />
          ) : null}
        </div>

        {/* Footer row — unlocked users get Regenerate + meta */}
        {!meta.isPreview ? (
          <div className={styles.footerRow}>
            <span className={styles.regenInfo}>
              {meta.source === 'fallback'
                ? 'Built from your profile. '
                : 'AI-generated. '}
              Generated {formatDate(meta.generatedAt)}.
            </span>
            {/* Download as PDF — only for unlocked users; the helper
                bakes the same header + timeline + action plan the page
                renders, so what they see is what they save. */}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => generatePlacementRoadmapPdf(data)}
              title="Download a printable copy of your roadmap"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        ) : null}
      </section>

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
