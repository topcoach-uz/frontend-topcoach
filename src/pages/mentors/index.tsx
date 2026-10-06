import { useMemo, useState } from 'react';
import { Input, Skeleton } from 'antd';
import { Search, X } from 'lucide-react';
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

const RATING_OPTIONS = [
  { value: 'all', threshold: 0 },
  { value: '4', threshold: 4 },
  { value: '4.5', threshold: 4.5 },
] as const;

export default function MentorsPage() {
  const { data: mentorsData, isLoading, isError } = useGetMentorsQuery();
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [nameQuery, setNameQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
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
  ];

  // Options derived from the loaded mentor list — nothing hardcoded, so the
  // filter bar always reflects whatever universities/majors/languages
  // actually exist across the current mentor roster.
  const universityOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((mentor) => {
      const uni = mentor.mentorProfile?.university?.trim();
      if (uni) set.add(uni);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const majorOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((mentor) => {
      const major = mentor.mentorProfile?.major?.trim();
      if (major) set.add(major);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const languageOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((mentor) => {
      (mentor.mentorProfile?.languages || []).forEach((lang) => {
        const trimmed = lang?.trim();
        if (trimmed) set.add(trimmed);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const ratingSelectOptions = RATING_OPTIONS.map((opt) => ({
    value: opt.value,
    label:
      opt.value === 'all'
        ? t('mentors.filters.allRatings', 'All ratings')
        : t('mentors.filters.ratingPlus', '{{value}}+', { value: opt.value }),
  }));

  const hasActiveFilters =
    selectedLevel !== 'all' ||
    nameQuery.trim() !== '' ||
    selectedUniversity !== 'all' ||
    selectedMajor !== 'all' ||
    selectedLanguage !== 'all' ||
    selectedRating !== 'all';

  const clearFilters = () => {
    setSelectedLevel('all');
    setNameQuery('');
    setSelectedUniversity('all');
    setSelectedMajor('all');
    setSelectedLanguage('all');
    setSelectedRating('all');
  };

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
  }

  const filteredMentors = useMemo(() => {
    if (!mentorsData) return [];

    const query = nameQuery.trim().toLowerCase();
    const ratingThreshold =
      RATING_OPTIONS.find((opt) => opt.value === selectedRating)?.threshold ??
      0;

    return mentorsData.filter((mentor) => {
      if (
        selectedLevel !== 'all' &&
        mentor.mentorProfile?.level !== selectedLevel
      ) {
        return false;
      }

      if (query && !mentor.profile?.name?.toLowerCase().includes(query)) {
        return false;
      }

      if (
        selectedUniversity !== 'all' &&
        mentor.mentorProfile?.university !== selectedUniversity
      ) {
        return false;
      }

      if (
        selectedMajor !== 'all' &&
        mentor.mentorProfile?.major !== selectedMajor
      ) {
        return false;
      }

      if (
        selectedLanguage !== 'all' &&
        !(mentor.mentorProfile?.languages || []).includes(selectedLanguage)
      ) {
        return false;
      }

      if (
        ratingThreshold > 0 &&
        (mentor.profile?.overallRating || 0) < ratingThreshold
      ) {
        return false;
      }

      return true;
    });
  }, [
    mentorsData,
    selectedLevel,
    nameQuery,
    selectedUniversity,
    selectedMajor,
    selectedLanguage,
    selectedRating,
  ]);

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
      <section className={styles.shell}>
        <div className={styles.mentors}>
          <div className={styles.top}>
            <MainTitleDescription
              title={title}
              description={subtitle}
            />
          </div>
          {/* Filter bar — level (existing) + name/university/major/language/
              rating (new). Options for the data-driven selects are derived
              from the loaded mentors, and a select is only rendered when
              there's at least one real value to filter by. */}
          <div className={styles.filterBar}>
            <div className={styles.filterField}>
              <Input
                allowClear
                prefix={<Search size={15} style={{ opacity: 0.45 }} />}
                placeholder={t('mentors.filters.searchPlaceholder', 'Search by name')}
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
              />
            </div>

            {universityOptions.length > 0 && (
              <div className={styles.filterField}>
                <CustomSelect
                  value={selectedUniversity}
                  style={{ width: '100%' }}
                  options={[
                    {
                      label: t('mentors.filters.allUniversities', 'All universities'),
                      value: 'all',
                    },
                    ...universityOptions.map((u) => ({ label: u, value: u })),
                  ]}
                  onChange={(value) => setSelectedUniversity(value)}
                />
              </div>
            )}

            {majorOptions.length > 0 && (
              <div className={styles.filterField}>
                <CustomSelect
                  value={selectedMajor}
                  style={{ width: '100%' }}
                  options={[
                    {
                      label: t('mentors.filters.allMajors', 'All majors'),
                      value: 'all',
                    },
                    ...majorOptions.map((m) => ({ label: m, value: m })),
                  ]}
                  onChange={(value) => setSelectedMajor(value)}
                />
              </div>
            )}

            {languageOptions.length > 0 && (
              <div className={styles.filterField}>
                <CustomSelect
                  value={selectedLanguage}
                  style={{ width: '100%' }}
                  options={[
                    {
                      label: t('mentors.filters.allLanguages', 'All languages'),
                      value: 'all',
                    },
                    ...languageOptions.map((l) => ({ label: l, value: l })),
                  ]}
                  onChange={(value) => setSelectedLanguage(value)}
                />
              </div>
            )}

            <div className={styles.filterField}>
              <CustomSelect
                value={selectedRating}
                style={{ width: '100%' }}
                options={ratingSelectOptions}
                onChange={(value) => setSelectedRating(value)}
              />
            </div>

            <div className={styles.filterField}>
              <CustomSelect
                value={selectedLevel}
                style={{ width: '100%' }}
                options={mentorLevelOptions}
                onChange={(value) => setSelectedLevel(value)}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearFilters}
                onClick={clearFilters}
              >
                <X size={14} />
                {t('mentors.filters.clearFilters', 'Clear filters')}
              </button>
            )}
          </div>

          {!isLoading && !isError && (
            <div className={styles.resultCount}>
              {t('mentors.filters.resultCount', '{{count}} mentors found', {
                count: sortedMentors.length,
              })}
            </div>
          )}

          <div className={styles.cards}>
            {/* Skeleton grid while mentors load — same footprint as the real
                cards, so the grid doesn't render blank and then pop in. */}
            {isLoading &&
              Array.from({ length: 8 }, (_, i) => (
                <div key={`sk-${i}`} className={styles.cardSkeleton}>
                  <Skeleton.Image
                    active
                    style={{ width: '100%', height: 320 }}
                  />
                  <div className={styles.cardSkeletonBody}>
                    <Skeleton
                      active
                      title={{ width: '60%' }}
                      paragraph={{ rows: 2, width: ['90%', '40%'] }}
                    />
                  </div>
                </div>
              ))}
            {!isLoading && isError && (
              <p className={styles.cardsError}>
                {t(
                  'mentors.loadError',
                  "Couldn't load mentors. Please refresh the page to try again."
                )}
              </p>
            )}
            {!isLoading && !isError && sortedMentors.length === 0 && (
              <p className={styles.cardsEmpty}>
                {t(
                  'mentors.filters.noResults',
                  'No mentors match your filters. Try clearing some filters.'
                )}
              </p>
            )}
            {!isLoading && !isError && sortedMentors.map((mentor, index) => {
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
                  mentorshipType={mentor.mentorProfile?.mentorshipType}
                  showPrice={mentor.mentorProfile?.showPrice}
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
