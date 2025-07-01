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

  const mentorLevelOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pro bono', value: MentorExperienceLevel.Probono },
    { label: 'Expert', value: MentorExperienceLevel.Expert },
    { label: 'Senior', value: MentorExperienceLevel.Senior },
    { label: 'Junior', value: MentorExperienceLevel.Junior },
  ];

  // Dynamic subtitle based on selected filter
  const mentorSubtitles: Record<string, string> = {
    all: 'Connect with experienced mentors who can guide you through your university application journey.',
    [MentorExperienceLevel.Probono]: 'Pro Bono Mentors volunteer their time to help students succeed, offering free guidance and making a social impact.',
    [MentorExperienceLevel.Junior]: 'Junior Mentors are recent admits to top universities, eager to share fresh, relatable advice.',
    [MentorExperienceLevel.Senior]: 'Senior Mentors have guided multiple students to acceptance and offer proven, practical insights.',
    [MentorExperienceLevel.Expert]: 'Expert Mentors are leaders in admissions, with years of experience and a strong record of success.',
  };
  
  const subtitle = mentorSubtitles[selectedLevel] || mentorSubtitles.all;

  // Filter mentors based on selected level
  let filteredMentors = useMemo(() => {
    if (selectedLevel === 'all') {
      return response?.data || [];
    }

    return (
      response?.data?.filter(
        (mentor) => mentor?.mentorProfile?.level === selectedLevel
      ) || []
    );
  }, [response?.data, selectedLevel]);

  if (isAuthenticated) {
    filteredMentors = filteredMentors.filter(
      (mentor) => mentor.id !== meData?.id
    );
  }

  const sortedMentors = sortMentors(filteredMentors);

  return (
    <main>
      <section>
        <div className={'container ' + styles.mentors}>
          <div className={styles.top}>
            <MainTitleDescription
              title={t('mentors.mentorTitle')}
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

const sortMentors = (mentors: MentorsResponseDto[]) => {
  return mentors.sort((a, b) => {
    if (
      a.mentorProfile?.level === MentorExperienceLevel.Probono &&
      b.mentorProfile?.level !== MentorExperienceLevel.Probono
    ) {
      return -1;
    }
    if (
      a.mentorProfile?.level !== MentorExperienceLevel.Probono &&
      b.mentorProfile?.level === MentorExperienceLevel.Probono
    ) {
      return 1;
    }
    return 0;
  });
};
