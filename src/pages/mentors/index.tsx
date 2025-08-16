import { useMemo, useState } from 'react';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';
import CardSkeletons from 'src/components/common/cardSkeletons';
import MainTitleDescription from 'src/components/mainTitleDesc';
import useApi from 'src/hooks/useApi';
import { getLatestCreatedImg } from 'src/utils';
import MentorCard from './_components/mentorCard';
import styles from './mentors.module.scss';
import { useTranslation } from 'react-i18next';
import CustomSelect from 'src/components/common/select';
import { MentorExperienceLevel, MentorsResponseDto } from 'src/app/api/Api';

export default function MentorsPage() {
  const { response, isLoading, isError } = useApi(() => api.users.getMentors());
  const [selectedLevel, setSelectedLevel] = useState('all');
  const { isAuthenticated, profile: meData } = useTypedSelector(
    (state) => state.auth
  );
  const { t } = useTranslation();

  // List of mentor IDs participating in the giveaway
  const giveawayMentorIds = [
    'e433af15-105e-448a-89e4-d48d104fca02','a6c78c0f-7649-460c-b309-74796c325481'
  ];

  const mentorLevelOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pro bono', value: MentorExperienceLevel.Probono },
    { label: 'Junior', value: MentorExperienceLevel.Junior },
    { label: 'Senior', value: MentorExperienceLevel.Senior },
    { label: 'Expert', value: MentorExperienceLevel.Expert },
  ];

  // Dynamic title and subtitle based on selected filter
  let title = t('mentors.mentorTitle');
  let subtitle = 'Connect with experienced mentors who can guide you through your university application journey.';
  if (selectedLevel === MentorExperienceLevel.Probono) {
    title = 'Pro Bono Mentors';
    subtitle = 'Connect with pro bono mentors who offer free guidance for your university application journey.';
  } else if (selectedLevel === MentorExperienceLevel.Junior) {
    title = 'Junior Mentors';
    subtitle = 'Connect with junior mentors who provide affordable guidance for your university application journey.';
  } else if (selectedLevel === MentorExperienceLevel.Senior) {
    title = 'Senior Mentors';
    subtitle = 'Connect with senior mentors who offer comprehensive guidance for your university application journey.';
  } else if (selectedLevel === MentorExperienceLevel.Expert) {
    title = 'Expert Mentors';
    subtitle = 'Connect with expert mentors who provide premium guidance for your university application journey.';
  }

  const filteredMentors = useMemo(() => {
    if (!response?.data) return [];
    
    let mentors = response.data;
    
    if (selectedLevel !== 'all') {
      mentors = mentors.filter(
        (mentor) => mentor.mentorProfile?.level === selectedLevel
      );
    }
    
    return mentors;
  }, [response?.data, selectedLevel]);

  const sortedMentors = useMemo(() => {
    return [...filteredMentors].sort((a, b) => {
      // Sort by available sessions (higher first), then by completed sessions, then by name
      const aAvailableSessions = a.sessionStats?.availableSessions || 0;
      const bAvailableSessions = b.sessionStats?.availableSessions || 0;
      
      if (aAvailableSessions !== bAvailableSessions) {
        return bAvailableSessions - aAvailableSessions;
      }
      
      const aCompletedSessions = a.numberOfSessions || 0;
      const bCompletedSessions = b.numberOfSessions || 0;
      
      if (aCompletedSessions !== bCompletedSessions) {
        return bCompletedSessions - aCompletedSessions;
      }
      
      return (a.profile.name || '').localeCompare(b.profile.name || '');
    });
  }, [filteredMentors]);

  return (
    <main>
      <section>
        <div className={'container ' + styles.mentors}>
          <div className={styles.top}>
            <MainTitleDescription
              title={title}
              description={subtitle}
            />
          </div>
          {/* // Mentor Level Filter */}
          <div className={styles.level}>
            <CustomSelect
              defaultValue={'all'}
              style={{ width: 100 }}
              options={mentorLevelOptions}
              onChange={(value) => setSelectedLevel(value)}
            />
          </div>
          <div className={styles.cards}>
            {!isLoading ? (
              sortedMentors.map((mentor, index) => {
                const profileImage = getLatestCreatedImg(mentor.profile.media);

                return (
                  <MentorCard
                    key={mentor.id}
                    id={mentor.id}
                    name={mentor.profile.name}
                    imgSrc={profileImage}
                    rating={mentor.profile.overallRating}
                    sessionNumber={mentor?.numberOfSessions}
                    major={mentor?.mentorProfile?.major}
                    university={
                      // @ts-ignore
                      mentor?.selectedUniversities?.[0].name ??
                      mentor?.mentorProfile?.university
                    }
                    level={mentor.mentorProfile?.level}
                    availableSessions={mentor.sessionStats?.availableSessions || 0}
                    isGiveaway={giveawayMentorIds.includes(mentor.id)}
                  />
                );
              })
            ) : (
              <CardSkeletons />
            )}
          </div>
          {/* <Pagination
            total={response?.data?.length}
            showTotal={(total) => `Total ${total} items`}
            defaultPageSize={20}
            defaultCurrent={1}
          /> */}
        </div>
      </section>
    </main>
  );
}
