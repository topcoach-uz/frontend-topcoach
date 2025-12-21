import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { getLatestCreatedImg } from 'src/utils';
import MentorCard from '../../../_components/mentorCard';
import styles from './similarMentors.module.scss';
import { useTranslation } from 'react-i18next';

export default function SimilarMentors() {
  const colors = useColors();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentMentor = useTypedSelector(
    (state) => state.mentor?.lastMentorData
  );
  const { data: allMentors, isLoading } = useGetMentorsQuery();

  const similarMentors = useMemo(() => {
    if (!currentMentor?.mentorProfile?.tags || !allMentors) {
      return [];
    }

    const currentTags = currentMentor.mentorProfile.tags || [];
    const currentMentorId = currentMentor.id;

    // Filter mentors that share at least one tag and exclude current mentor
    const filtered = allMentors.filter((mentor) => {
      if (mentor.id === currentMentorId) return false;
      if (!mentor.mentorProfile?.tags || mentor.mentorProfile.tags.length === 0) return false;
      
      // Check if mentor has at least one matching tag
      const mentorTags = mentor.mentorProfile.tags;
      return currentTags.some((tag) => mentorTags.includes(tag));
    });

    // Sort by number of matching tags (most similar first)
    return filtered
      .map((mentor) => {
        const matchingTags = (mentor.mentorProfile?.tags || []).filter((tag) =>
          currentTags.includes(tag)
        );
        return {
          mentor,
          matchingCount: matchingTags.length,
        };
      })
      .sort((a, b) => b.matchingCount - a.matchingCount)
      .slice(0, 10) // Limit to 10 similar mentors
      .map((item) => item.mentor);
  }, [currentMentor, allMentors]);

  if (isLoading || similarMentors.length === 0) {
    return null;
  }

  return (
    <div className={styles.similar_mentors_wrapper}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightSemibold}
        fontSize={themeFontSize.fontSizeTitle4}
        color={colors.colorText}
        mb={16}
      >
        {t('mentors.similarMentors') || 'Similar Mentors'}
      </CustomText>
      <div className={styles.mentors_scroll_container}>
        <div className={styles.mentors_list}>
          {similarMentors.map((mentor) => {
            const profileImage = getLatestCreatedImg(mentor.profile?.media || []);
            return (
              <div key={mentor.id} className={styles.mentor_card_wrapper}>
                <MentorCard
                  id={mentor.id}
                  name={mentor.profile?.name || ''}
                  imgSrc={profileImage || ''}
                  rating={mentor.profile?.overallRating || 0}
                  sessionNumber={mentor?.numberOfSessions || 0}
                  major={mentor?.mentorProfile?.major || ''}
                  university={(mentor as any).displayUniversity || mentor?.mentorProfile?.university || ''}
                  level={mentor.mentorProfile?.level}
                  availableSessions={mentor.sessionStats?.availableSessions || 0}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

