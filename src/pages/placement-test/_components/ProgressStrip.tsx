import styles from '../PlacementTest.module.scss';

type Props = {
  /** 1-based index of the question currently shown. */
  current: number;
  total: number;
};

export function ProgressStrip({ current, total }: Props) {
  const pct = Math.min(100, Math.round(((current - 1) / total) * 100));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Question ${current} of ${total}`}
      className={styles.progressBar}
    >
      <span
        className={styles.progressBar__fill}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
