import React, { useState } from 'react';
import { Button, Card, Checkbox, Spin, Typography, message } from 'antd';
import { ShieldCheck } from 'lucide-react';
import {
  useStudyBuddyConsentStatusQuery,
  useStudyBuddyAcceptConsentMutation,
} from 'src/app/services/student-hub/studyBuddyApi';
import styles from './communityHubMock.module.scss';

const { Title, Paragraph } = Typography;

const GUIDELINES: Array<{ title: string; body: string }> = [
  {
    title: 'Be kind and respectful',
    body: 'Treat every peer with respect. No harassment, hate, or spam — ever.',
  },
  {
    title: 'Keep it study-focused',
    body: 'Connect over shared goals, tests, and timelines. Help each other grow.',
  },
  {
    title: 'Your profile becomes visible',
    body: 'Once you join, peers can discover you and send buddy requests. You can hide it anytime in Settings → Privacy.',
  },
];

/**
 * Gates the Study Buddy hub behind a one-time community-guidelines consent.
 * The feature is free, but a user is not discoverable and cannot send/accept
 * requests until they accept here (backend records `studyBuddyConsent`).
 */
export default function StudyBuddyConsentGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useStudyBuddyConsentStatusQuery();
  const [acceptConsent, { isLoading: accepting }] = useStudyBuddyAcceptConsentMutation();
  const [agreed, setAgreed] = useState(false);

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
    <div className={styles.buddyConsentWrap}>
      <Card bordered={false} className={styles.buddyConsentCard}>
        <div className={styles.buddyConsentBadge}>
          <ShieldCheck size={14} />
          <span>Study buddies · Community guidelines</span>
        </div>

        <Title level={3} style={{ marginTop: 12, marginBottom: 6 }}>
          Find someone on the same path
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 20 }}>
          Study Buddy is free for everyone. Before you join, agree to keep this a
          safe, respectful space — then we'll connect you with peers who share
          your goals.
        </Paragraph>

        <div className={styles.buddyConsentList}>
          {GUIDELINES.map((g) => (
            <div key={g.title} className={styles.buddyConsentItem}>
              <div>
                <div className={styles.buddyConsentItemTitle}>{g.title}</div>
                <div className={styles.buddyConsentItemBody}>{g.body}</div>
              </div>
            </div>
          ))}
        </div>

        <Checkbox
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className={styles.buddyConsentCheckbox}
        >
          I agree to be respectful and follow the TopCoach community guidelines.
        </Checkbox>

        <Button
          type="primary"
          size="large"
          block
          disabled={!agreed}
          loading={accepting}
          onClick={handleAgree}
          className={styles.buddyConsentButton}
        >
          Agree &amp; continue
        </Button>

        <Paragraph type="secondary" className={styles.buddyConsentFootNote}>
          By continuing, your profile becomes visible to peers so they can send
          you study buddy requests.
        </Paragraph>
      </Card>
    </div>
  );
}
