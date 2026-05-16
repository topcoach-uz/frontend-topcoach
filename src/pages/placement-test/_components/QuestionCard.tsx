import type { PlacementPublicQuestion } from 'src/app/services/placementTestApi';

import styles from '../PlacementTest.module.scss';

type Props = {
  question: PlacementPublicQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
};

const LETTERS = ['A', 'B', 'C', 'D'];
const CATEGORY_LABEL: Record<PlacementPublicQuestion['category'], string> = {
  reading: 'Reading',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
};

export function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  disabled,
}: Props) {
  return (
    <>
      <div className={styles.categoryEyebrow}>
        {CATEGORY_LABEL[question.category]}
      </div>
      <p className={styles.questionText}>{question.text}</p>

      <div className={styles.options} role="radiogroup">
        {question.options.map((opt, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(i)}
              className={`${styles.option} ${
                active ? styles.optionActive : ''
              }`}
            >
              <span className={styles.option__letter}>{LETTERS[i] ?? '?'}</span>
              <span className={styles.option__text}>{opt}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
