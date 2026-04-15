import React from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { YouthLeadersSubmission } from './submissionsStorage';
import styles from './YouthLeadersApplication.module.scss';

type Props = {
  submission?: YouthLeadersSubmission | null;
};

export default function SubmittedView({ submission }: Props) {
  const status = submission?.status ?? 'pending';
  const reviewed = submission?.reviewedAt;

  const stampClass =
    status === 'approved'
      ? `${styles.reviewStamp} ${styles.reviewStampApproved}`
      : status === 'rejected'
        ? styles.reviewStampRejected
        : styles.reviewStamp;

  const stampLabel =
    status === 'approved' ? 'Approved' : status === 'rejected' ? 'Not approved' : 'Reviewing';

  const title =
    status === 'approved'
      ? 'Application approved'
      : status === 'rejected'
        ? 'Application update'
        : 'Application submitted';

  return (
    <div className={styles.submittedCard}>
      <div className={stampClass} style={{ float: 'none', margin: '0 auto 20px' }} aria-hidden>
        {stampLabel}
      </div>
      <div className={styles.submittedTitle}>{title}</div>
      <p className={styles.submittedNote}>
        Submitted on{' '}
        <strong>{submission?.submittedAt ? dayjs(submission.submittedAt).format('MMM D, YYYY h:mm A') : '—'}</strong>
        {submission && (
          <>
            {' '}
            · Reference <strong>{submission.id.slice(0, 8)}</strong>
          </>
        )}
      </p>
      {status === 'pending' && (
        <p className={styles.submittedNote}>
          Thank you. Your application is under review. You will be notified when the status changes.
        </p>
      )}
      {status === 'approved' && (
        <p className={styles.submittedNote}>
          Congratulations — your application has been approved. Check your email for next steps from the organizers.
        </p>
      )}
      {status === 'rejected' && (
        <p className={styles.submittedNote}>
          Your application was not approved at this time. If you have questions, please contact the program team.
        </p>
      )}
      {submission?.adminNote && status === 'rejected' && (
        <p className={styles.submittedNote}>
          <strong>Note:</strong> {submission.adminNote}
        </p>
      )}
      {reviewed && status !== 'pending' && (
        <p className={styles.submittedNote} style={{ fontSize: 13, color: '#64748b' }}>
          Decision recorded {dayjs(reviewed).format('MMM D, YYYY h:mm A')}
        </p>
      )}
      {status === 'pending' && (
        <p className={styles.submittedNote}>
          After review, approved applications will show an <strong>Approved</strong> status here.
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/events">
          <Button size="large" className={styles.btnOutline}>
            Back to Events
          </Button>
        </Link>
      </div>
    </div>
  );
}
