import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './howItWorks.module.scss';

const STEP_KEYS = [
  { key: 'step1Title', descKey: 'step1Desc' },
  { key: 'step2Title', descKey: 'step2Desc' },
  { key: 'step3Title', descKey: 'step3Desc' },
  { key: 'step4Title', descKey: 'step4Desc' },
] as const;

function StepArrow() {
  return (
    <svg
      className={styles.arrow}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 12h14M13 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{t('landing.howItWorks.kicker')}</p>
          <h2 className={styles.title}>{t('landing.howItWorks.title')}</h2>
          <p className={styles.subtitle}>{t('landing.howItWorks.subtitle')}</p>
        </header>

        <div className={styles.stepsRow}>
          {STEP_KEYS.map(({ key, descKey }, i) => (
            <Fragment key={key}>
              {i > 0 && (
                <div className={styles.arrowWrap}>
                  <StepArrow />
                </div>
              )}
              <article className={styles.step}>
                <span className={styles.bigNumber}>{i + 1}</span>
                <h3 className={styles.stepTitle}>
                  {t(`landing.howItWorks.${key}`).replace(/^Step \d+:\s*/i, '').replace(/^Шаг \d+:\s*/i, '')}
                </h3>
                <p className={styles.stepDesc}>{t(`landing.howItWorks.${descKey}`)}</p>
              </article>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
