import { ArrowRight, ExternalLink } from 'lucide-react';

import type { RoadmapActionItem } from 'src/app/services/roadmapApi';

import styles from '../Roadmap.module.scss';
import { pickTopcoachLink } from './categoryTopcoachLinks';

type Props = {
  item: RoadmapActionItem;
  /** When true the resource links + topcoach CTA are hidden (preview state). */
  redactLinks?: boolean;
  onOpenTopcoach?: (path: string) => void;
};

export function ActionItemRow({ item, redactLinks, onOpenTopcoach }: Props) {
  const dotClass =
    item.priority === 'medium'
      ? styles.actionItem__dotMedium
      : item.priority === 'low'
        ? styles.actionItem__dotLow
        : '';

  const showLinks = !redactLinks;
  const topcoachLink = pickTopcoachLink(item);

  return (
    <article className={styles.actionItem}>
      <span className={`${styles.actionItem__dot} ${dotClass}`} />
      <div className={styles.actionItem__body}>
        <h3 className={styles.actionItem__title}>{item.title}</h3>
        <p className={styles.actionItem__desc}>{item.description}</p>

        {showLinks && topcoachLink ? (
          <button
            type="button"
            className={styles.actionItem__topcoachBtn}
            onClick={() => onOpenTopcoach?.(topcoachLink.path)}
          >
            {topcoachLink.action}
            <ArrowRight size={12} />
          </button>
        ) : null}

        {showLinks && item.externalResources.length > 0 ? (
          <ul className={styles.actionItem__resources}>
            {item.externalResources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                  <ExternalLink size={11} />
                </a>
                <span>{r.why}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={styles.actionItem__timeline}>{item.timeline}</div>
    </article>
  );
}
