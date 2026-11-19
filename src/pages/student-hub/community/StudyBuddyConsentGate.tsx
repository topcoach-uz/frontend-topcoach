import React, { useState } from 'react';
import { Button, Checkbox, Spin, message } from 'antd';
import { BookOpen, Eye, HeartHandshake, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useFillViewport } from 'src/hooks/useFillViewport';
import { useTranslation } from 'react-i18next';
import {
  useStudyBuddyConsentStatusQuery,
  useStudyBuddyAcceptConsentMutation,
} from 'src/app/services/student-hub/studyBuddyApi';
import styles from './communityHubMock.module.scss';


/**
 * Note: the third guideline's body is translated inline in the component
 * (it needed a copy fix — see render below) while the rest stay as plain
 * strings, matching this file's existing (untranslated) convention.
 */
const GUIDELINES: Array<{ title: string; body?: string; Icon: LucideIcon }> = [
  {
    Icon: HeartHandshake,
    title: 'Be kind and respectful',
    body: 'Treat every peer with respect. No harassment, hate, or spam — ever.',
  },
  {
    Icon: BookOpen,
    title: 'Keep it study-focused',
    body: 'Connect over shared goals, tests, and timelines. Help each other grow.',
  },
  {
    Icon: Eye,
    title: 'Your profile becomes visible',
  },
];

/**
 * Gates the Study Buddy hub behind a one-time community-guidelines consent.
 * The feature is free, but a user is not discoverable and cannot send/accept
 * requests until they accept here (backend records `studyBuddyConsent`).
 */
export default function StudyBuddyConsentGate({ children, browseOnly = false }: { children: React.ReactNode; browseOnly?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useStudyBuddyConsentStatusQuery(undefined, { skip: browseOnly });
  const [acceptConsent, { isLoading: accepting }] = useStudyBuddyAcceptConsentMutation();
  const [agreed, setAgreed] = useState(false);
  // Fill the window like the other workspace gates (no gap, no scrollbar).
  const cardRef = useFillViewport<HTMLElement>([isLoading, data?.consented]);

  // Browsing must not opt this student into discovery or peer contact.
  if (browseOnly) return <>{children}</>;

  if (isLoading) {
    return (
      <div style={{ padding: 64, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (data?.consented) {
    return <>{children}</>;
  }

  const handleAgree = async () => {
    if (!agreed) return;
    try {
      await acceptConsent().unwrap();
      message.success("You're in! Discover your study buddies.");
    } catch {
      message.error('Could not save your agreement. Please try again.');
    }
  };

  return (
    <section ref={cardRef} className={styles.buddyConsent} aria-labelledby="buddy-consent-title">
      <div className={styles.buddyConsentMain}>
        <span className={styles.buddyConsentBadge}>
          <ShieldCheck size={14} aria-hidden />
          Study buddies · Community guidelines
        </span>
        <h1 id="buddy-consent-title" className={styles.buddyConsentTitle}>
          Find someone on the same path
        </h1>
        <p className={styles.buddyConsentLead}>
          Browsing Study Buddy is open to everyone; connecting needs Community access. Agree to keep this a safe,
          respectful space and we’ll match you with peers who share your goals.
        </p>

        <Checkbox
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className={styles.buddyConsentCheckbox}
        >
          I agree to be respectful and follow the TopCoach community guidelines.
        </Checkbox>

        <div className={styles.buddyConsentActions}>
          <Button
            type="primary"
            size="large"
            disabled={!agreed}
            loading={accepting}
            onClick={handleAgree}
            className={styles.buddyConsentButton}
          >
            Agree &amp; continue
          </Button>
        </div>

        <p className={styles.buddyConsentFootNote}>
          By continuing, your profile becomes visible to peers so they can send you study buddy requests.
        </p>
      </div>

      <aside className={styles.buddyConsentRules} aria-label="Community guidelines">
        <p className={styles.buddyConsentRulesTitle}>The guidelines</p>
        <ul>
          {GUIDELINES.map(({ title, body, Icon }) => (
            <li key={title}>
              <span className={styles.buddyConsentRuleIcon} aria-hidden>
                <Icon size={17} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>
                  {body ??
                    t(
                      'studentHub.buddyConsent.guidelineVisibilityBody',
                      'Once you join, peers can discover you and send buddy requests based on your shared goals.',
                    )}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
