import { ArrowRight } from 'lucide-react';

import type { MentorsResponseDto } from 'src/app/api/Api';
import { getUniversityFlag } from 'src/utils/countryFlags';
import { getLatestCreatedImg } from 'src/utils';

import styles from '../Roadmap.module.scss';
import { rateLabelForLevel } from './useRankedMentors';

type Props = {
  /**
   * Pre-ranked mentor shortlist. The ranking lives in
   * `useRankedMentors` so the PDF export can use the exact same list —
   * this component is purely presentational.
   */
  mentors: MentorsResponseDto[];
  isLoading?: boolean;
  primaryInterest?: string | null;
  onOpenMentor: (mentorId: string) => void;
  onOpenAllMentors: () => void;
};

export function RecommendedMentors({
  mentors,
  isLoading,
  primaryInterest,
  onOpenMentor,
  onOpenAllMentors,
}: Props) {
  if (isLoading) {
    return (
      <>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>Recommended mentors</span>
          <span className={styles.sectionTag}>1:1 sessions</span>
        </div>
        <div className={styles.mentorGrid} aria-hidden>
          <div className={styles.mentorCardSkeleton} />
          <div className={styles.mentorCardSkeleton} />
          <div className={styles.mentorCardSkeleton} />
        </div>
      </>
    );
  }

  if (mentors.length === 0) return null;

  const headerCopy = primaryInterest
    ? `Hand-picked from our top coaches based on your interest in ${primaryInterest}. Book a 1:1 to fast-track the work above.`
    : 'Hand-picked from our top coaches based on your goals. Book a 1:1 to fast-track the work above.';

  return (
    <>
      <div className={styles.sectionHead}>
        <span className={styles.sectionEyebrow}>Recommended mentors</span>
        <span className={styles.sectionTag}>1:1 sessions</span>
      </div>
      <p className={styles.sectionLede}>{headerCopy}</p>

      <div className={styles.mentorGrid}>
        {mentors.map((mentor) => {
          const profileImage = getLatestCreatedImg(mentor.profile?.media || []);
          const university = mentor.mentorProfile?.university || '';
          const major = mentor.mentorProfile?.major || '';
          const flag = university ? getUniversityFlag(university) : '';
          const level = mentor.mentorProfile?.level;
          const rate = rateLabelForLevel(level);

          return (
            <button
              key={mentor.id}
              type="button"
              className={styles.mentorCard}
              onClick={() => onOpenMentor(mentor.id)}
            >
              <div className={styles.mentorCard__avatar}>
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${mentor.profile.name} — mentor`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={styles.mentorCard__initials}>
                    {(mentor.profile.name || '?')
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join('')}
                  </span>
                )}
              </div>
              <div className={styles.mentorCard__body}>
                <div className={styles.mentorCard__nameRow}>
                  <h4 className={styles.mentorCard__name}>
                    {mentor.profile.name}
                  </h4>
                  {level ? (
                    <span
                      className={`${styles.mentorCard__level} ${
                        styles[`mentorCard__level_${level}`] ?? ''
                      }`}
                    >
                      {level === 'uzcombinator' ? 'UzCombinator' : level}
                    </span>
                  ) : null}
                </div>
                {university ? (
                  <div className={styles.mentorCard__uni}>
                    {flag ? (
                      <span className={styles.mentorCard__flag} aria-hidden>
                        {flag}
                      </span>
                    ) : null}
                    <span>{university}</span>
                  </div>
                ) : null}
                {major ? (
                  <div className={styles.mentorCard__major}>{major}</div>
                ) : null}
                <div className={styles.mentorCard__rate}>{rate}</div>
              </div>
              <ArrowRight
                size={16}
                className={styles.mentorCard__chevron}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.mentorAllBtn}
        onClick={onOpenAllMentors}
      >
        Browse all mentors
        <ArrowRight size={14} />
      </button>
    </>
  );
}
