import { ArrowRight, Check, FlaskConical, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCommunityAccessGate } from 'src/lib/communityAccess';
import './researchIntroPreview.scss';

const weeks = [
  'Introduction to Research',
  'Formulating a Research Question',
  'Methodology & Literature',
  'Citations & Proposal',
  'Advisors & Outreach',
  'Data Visualization',
  'Deep Analysis & Results',
  'Finalizing & Publishing',
];

const tryFirst = [
  'Write one question about your topic.',
  'Find two credible sources and note what they agree or disagree on.',
  'Explain what evidence you would need to answer your question.',
];

/** Research prep for students without program access: a free taste plus a clear way in. */
export default function ResearchIntroPreview() {
  const { t } = useTranslation();
  const gate = useCommunityAccessGate();
  const unlockLabel =
    gate.state === 'eligible'
      ? t('studentHub.communityLock.openCommunityCta', 'Open Community')
      : gate.state === 'loading'
        ? t('studentHub.communityLock.checkingAccessCta', 'Checking access…')
        : t('research.preview.unlock', 'Unlock Research Prep');

  return (
    <div className="rp">
      <header className="rp-hero">
        <span className="rp-hero__icon" aria-hidden>
          <FlaskConical size={22} strokeWidth={1.75} />
        </span>
        <div className="rp-hero__text">
          <p className="rp-eyebrow">{t('research.preview.eyebrow', 'Research Prep · 8 weeks')}</p>
          <h1>{t('research.preview.title', 'Learn to do real research')}</h1>
          <p>
            {t(
              'research.preview.subtitle',
              'Go from a question you care about to a finished portfolio piece, with lessons, quizzes and mentor feedback every week.',
            )}
          </p>
        </div>
        <div className="rp-hero__cta">
          {gate.state === 'loading' ? (
            <span className="rp-button is-disabled" aria-disabled="true">{unlockLabel}</span>
          ) : (
            <Link to={gate.destination} className="rp-button">
              {unlockLabel}
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
          <small>{t('research.preview.included', 'Included with Community')}</small>
        </div>
      </header>

      <div className="rp-grid">
        <section className="rp-card" aria-labelledby="rp-intro-title">
          <span className="rp-tag rp-tag--free">{t('research.preview.free', 'Free introduction')}</span>
          <h2 id="rp-intro-title">{t('research.preview.introTitle', 'Introduction to research')}</h2>
          <p>
            {t(
              'research.preview.introBody',
              'Research starts with a focused question, not a predetermined answer. Choose a topic you care about, read reliable work already published on it, and identify a small question you could investigate with the time and resources available.',
            )}
          </p>
          <h3>{t('research.preview.tryFirst', 'Try this first')}</h3>
          <ol className="rp-steps">
            {tryFirst.map((step, index) => (
              <li key={step}>
                <span aria-hidden>{index + 1}</span>
                {t(`research.preview.step${index + 1}`, step)}
              </li>
            ))}
          </ol>
          <p className="rp-note">
            {t(
              'research.preview.note',
              'This activity is open to everyone. It does not submit a quiz or record course progress.',
            )}
          </p>
        </section>

        <section className="rp-card" aria-labelledby="rp-outline-title">
          <h2 id="rp-outline-title">{t('research.preview.outline', 'Course outline')}</h2>
          <ol className="rp-weeks">
            {weeks.map((title, index) => (
              <li key={title} className={index === 0 ? 'is-open' : undefined}>
                <span className="rp-weeks__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="rp-weeks__title">{t(`research.preview.week${index + 1}`, title)}</span>
                {index === 0 ? (
                  <Check size={16} aria-label={t('research.preview.available', 'Available')} />
                ) : (
                  <Lock size={14} aria-label={t('research.preview.locked', 'Requires access')} />
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
