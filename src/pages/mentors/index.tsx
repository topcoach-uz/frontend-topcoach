import { useMemo, useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import MainTitleDescription from 'src/components/mainTitleDesc';
import { getLatestCreatedImg } from 'src/utils';
import MentorCard from './_components/mentorCard';
import styles from './mentors.module.scss';
import { useTranslation } from 'react-i18next';
import CustomSelect from 'src/components/common/select';
import { MentorExperienceLevel, MentorsResponseDto } from 'src/app/api/Api';
import { useGetGiveawaySessionsQuery } from 'src/app/services/sessions';
import { useGetMentorsQuery } from 'src/app/services/mentors';

export default function MentorsPage() {
  const { data: mentorsData, isLoading, isError } = useGetMentorsQuery();
  const [selectedLevel, setSelectedLevel] = useState('all');
  const { isAuthenticated, profile: meData } = useTypedSelector(
    (state) => state.auth
  );
  const { t } = useTranslation();

  // Fetch giveaway sessions only if authenticated
  const { data: giveawaySessions } = useGetGiveawaySessionsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // List of mentor IDs participating in the giveaway
  const giveawayMentorIds = [''
    // 'e433af15-105e-448a-89e4-d48d104fca02','a6c78c0f-7649-460c-b309-74796c325481',
    // 'c4e3ff79-db8e-4142-86b1-10e0ae68c482','49340a6d-1216-4f05-8e5d-542647bb456d',
    // '7f20bb05-8026-4f25-b081-7cd2b4db2a55','573ef815-5589-478e-bd20-46d3fe823224',
    // '68af607b-fc31-482e-9ca5-211bdf048d49','bee6229b-9222-4d8a-af7a-df12845c84d5',
    // '2bfd89d8-de12-45be-8bf1-7469196d9226','1ec89629-0fe4-47bd-8177-58e28c6b95f5',
    // 'fe445679-4811-4f2f-9802-e6aff7ac2460','c226e300-58a9-4b92-baf0-64e4c59f470e',
    // 'e9a6741b-d2f7-4cca-bb70-07fbb933933d'
  ];

  const mentorLevelOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pro bono', value: MentorExperienceLevel.Probono },
    { label: 'Junior', value: MentorExperienceLevel.Junior },
    { label: 'Senior', value: MentorExperienceLevel.Senior },
    { label: 'Expert', value: MentorExperienceLevel.Expert },
    { label: 'UzC', value: MentorExperienceLevel.Uzcombinator },
  ];

  // Dynamic title and subtitle based on selected filter
  let title = t('mentors.mentorTitle');
  let subtitle = t('mentors.mentorText');
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
  } else if (selectedLevel === MentorExperienceLevel.Uzcombinator) {
    title = 'UzCombinator Mentors';
    subtitle = 'Connect with startup mentors who provide guidance for building and scaling your startup.';
  }

  const filteredMentors = useMemo(() => {
    if (!mentorsData) return [];
    
    let mentors = mentorsData;
    
    if (selectedLevel !== 'all') {
      mentors = mentors.filter(
        (mentor) => mentor.mentorProfile?.level === selectedLevel
      );
    }
    
    return mentors;
  }, [mentorsData, selectedLevel]);

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
            {sortedMentors.map((mentor, index) => {
              // Backend now only returns the profile-picture media record, so this pick is O(1).
              const profileImage = getLatestCreatedImg(mentor.profile?.media || []);

              // Calculate giveaway sessions count for this mentor
              const giveawaySessionsCount = giveawaySessions?.filter(
                session => (session.mentor as any)?.id === mentor.id && !session.giveawayBookedBy
              ).length || 0;

              return (
                <MentorCard
                  key={mentor.id}
                  id={mentor.id}
                  name={mentor.profile.name}
                  imgSrc={profileImage || ''}
                  rating={mentor.profile.overallRating}
                  sessionNumber={mentor?.numberOfSessions}
                  major={mentor?.mentorProfile?.major}
                  university={(mentor as any).displayUniversity || mentor?.mentorProfile?.university || ''}
                  level={mentor.mentorProfile?.level}
                  availableSessions={mentor.sessionStats?.availableSessions || 0}
                  isGiveaway={giveawayMentorIds.includes(mentor.id)}
                  giveawaySessionsCount={giveawaySessionsCount}
                  email={mentor.email}
                  cardIndex={index}
                />
              );
            })}
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
