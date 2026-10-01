/**
 * Community Mentors — a distinct, ranked mentor directory shown inside the
 * COMMUNITY sidebar section (`?section=mentors`).
 *
 * Unlike the public `/mentors` page (unranked, identical for every visitor),
 * this view re-orders the SAME mentor roster around signals pulled from the
 * student's own data:
 *   1. College list (`application-tracking`) — mentor's university appears
 *      on the student's list → strongest signal.
 *   2. Intended majors (`personalProfile.intendedMajors`) — mentor's major
 *      matches, confidence-weighted.
 *   3. Mentor specialization tags vs. intended majors / career goals — a
 *      softer fuzzy signal for near-matches structured fields miss.
 *   4. Shared language.
 *   5. Rating — tiebreak only, never the primary sort.
 *
 * Country/region matching (`studyAbroadGoals.targetCountries`) was
 * evaluated and DROPPED: `mentor_profiles` has no country field, only a
 * free-text `university` string, so there is nothing reliable to match a
 * region against without guessing from university names.
 *
 * The mentor card + booking flow are reused as-is (`../../mentors/_components/mentorCard`,
 * navigates to `/mentors/:id` exactly like the public page) — this file
 * only adds ranking, reason chips, and the surrounding editorial chrome.
 */

import { useMemo, useState } from 'react';
import { Input, Skeleton } from 'antd';
import { Search, X, Sparkles, GraduationCap, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import CustomSelect from 'src/components/common/select';
import { getLatestCreatedImg } from 'src/utils';
import { MentorExperienceLevel, MentorsResponseDto } from 'src/app/api/Api';
import { useGetMentorsQuery } from 'src/app/services/mentors';
import { useGetCollegeApplicationsQuery } from 'src/app/services/student-hub/applicationTrackingApi';
import { useStudentProfile } from 'src/hooks/useStudentHub';
import MentorCard from '../../mentors/_components/mentorCard';
import { ApplicantPage } from '../applicant/ApplicantPage';

import './CommunityMentorsView.scss';

const RATING_OPTIONS = [
  { value: 'all', threshold: 0 },
  { value: '4', threshold: 4 },
  { value: '4.5', threshold: 4.5 },
] as const;

/** Match reasons shown per card before collapsing into a "+N more" chip. */
const MAX_VISIBLE_REASONS = 2;

/* ─────────────────────────────────────────────────────────────
   Matching
   ───────────────────────────────────────────────────────────── */

interface MatchReason {
  key: string;
  label: string;
}

interface ScoredMentor {
  mentor: MentorsResponseDto;
  score: number;
  reasons: MatchReason[];
}

function norm(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

/** Loose overlap check — exact match or either side contains the other.
 * University/major fields are free text on both sides (mentor profile and
 * student data), so an exact string match is too brittle (e.g. "MIT" vs
 * "Massachusetts Institute of Technology (MIT)"). */
function overlaps(a?: string | null, b?: string | null): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function humanizeTag(tag: string): string {
  return tag.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface MatchInputs {
  collegeUniversities: string[];
  collegeMajors: string[];
  intendedMajors: Array<{ major: string; confidence?: number }>;
  languages: string[];
  careerGoals: string[];
}

// `t` is passed in rather than hooked here so scoring stays a pure function.
// Signature mirrors i18next's `t(key, defaultValue, options)` overload.
type TFn = (k: string, defaultValue: string, opts?: Record<string, unknown>) => string;

function scoreMentor(mentor: MentorsResponseDto, inputs: MatchInputs, t: TFn): ScoredMentor {
  const uni = mentor.mentorProfile?.university?.trim();
  const major = mentor.mentorProfile?.major?.trim();
  const mentorLangs = (mentor.mentorProfile?.languages || []).filter(Boolean);
  const tags = (mentor.mentorProfile as any)?.tags as string[] | undefined;

  let score = 0;
  const reasons: MatchReason[] = [];

  // 1) College list — strongest signal.
  if (uni && inputs.collegeUniversities.some((u) => overlaps(u, uni))) {
    score += 50;
    reasons.push({
      key: 'college',
      label: t('studentHub.communityMentors.reason.college', 'On your college list: {{university}}', { university: uni }),
    });
  }

  // 2) Intended major — strong, confidence-weighted. Falls back to a
  //    college-list major (weaker) when there's no intended-major match.
  if (major) {
    const majorMatch = inputs.intendedMajors.find((im) => overlaps(im.major, major));
    if (majorMatch) {
      const confidence = majorMatch.confidence ?? 3;
      score += 35 + Math.max(0, confidence - 1) * 3;
      reasons.push({
        key: 'major',
        label: t('studentHub.communityMentors.reason.major', 'Matches your intended major: {{major}}', { major }),
      });
    } else if (inputs.collegeMajors.some((m) => overlaps(m, major))) {
      score += 20;
      reasons.push({
        key: 'college-major',
        label: t('studentHub.communityMentors.reason.collegeMajor', 'Matches a major on your college list: {{major}}', { major }),
      });
    }
  }

  // 3) Specialization tags vs. intended majors / career goals — soft
  //    fuzzy signal for near-matches the structured fields miss.
  if (tags && tags.length) {
    const haystacks = [...inputs.intendedMajors.map((m) => m.major), ...inputs.careerGoals];
    let tagHits = 0;
    for (const tag of tags) {
      const humanized = humanizeTag(tag);
      if (haystacks.some((h) => overlaps(h, humanized) || overlaps(h, tag))) {
        tagHits += 1;
        if (tagHits === 1) {
          reasons.push({
            key: `tag-${tag}`,
            label: t('studentHub.communityMentors.reason.tag', 'Specializes in {{tag}}', { tag: humanized }),
          });
        }
      }
    }
    score += Math.min(tagHits, 2) * 12;
  }

  // 4) Shared language — light tiebreak.
  if (mentorLangs.length && inputs.languages.length) {
    const shared = mentorLangs.filter((l) => inputs.languages.some((sl) => overlaps(sl, l)));
    if (shared.length) {
      score += Math.min(shared.length, 2) * 8;
      reasons.push({
        key: 'language',
        label: t('studentHub.communityMentors.reason.language', 'Speaks {{language}}', { language: shared[0] }),
      });
    }
  }

  const matched = reasons.length > 0;
  // Rating is a FINAL tiebreak only — it never fires a reason chip and is
  // only added once a real signal has already matched, so an unrelated
  // 5.0-rated mentor can't outrank a genuine college/major match.
  if (matched) {
    score += (mentor.profile?.overallRating || 0) * 1.5;
  }

  return { mentor, score, reasons: reasons.slice(0, 2) };
}

/** Same default ordering the public /mentors page uses, for the
 * non-matched fallback group and as the final tiebreak within groups. */
function defaultCompare(a: MentorsResponseDto, b: MentorsResponseDto): number {
  const aAvail = a.sessionStats?.availableSessions || 0;
  const bAvail = b.sessionStats?.availableSessions || 0;
  if (aAvail !== bAvail) return bAvail - aAvail;
  const aDone = a.numberOfSessions || 0;
  const bDone = b.numberOfSessions || 0;
  if (aDone !== bDone) return bDone - aDone;
  return (a.profile.name || '').localeCompare(b.profile.name || '');
}

/* ───────────────────────────────────────────────────────────── */

export default function CommunityMentorsView() {
  const { t } = useTranslation();
  const { data: mentorsData, isLoading, isError } = useGetMentorsQuery();
  const studentProfile = useStudentProfile();
  const { data: collegeAppsResponse } = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });

  const [selectedLevel, setSelectedLevel] = useState('all');
  const [nameQuery, setNameQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // `useStudentProfile()` widens to `any` (its read-only branch casts), so the
  // handful of fields this view reads are narrowed here instead.
  const personalProfile = studentProfile.profile?.personalProfile as
    | {
        intendedMajors?: Array<{ major: string; confidence?: number }>;
        demographics?: { languages?: Array<{ language?: string }> };
        careerGoals?: string[];
      }
    | undefined;
  const collegeApps = collegeAppsResponse?.data || [];

  const matchInputs: MatchInputs = useMemo(() => {
    const collegeUniversities = collegeApps
      .map((a) => a.universityName?.trim())
      .filter((v): v is string => !!v);
    const collegeMajors = collegeApps
      .map((a) => a.major?.trim())
      .filter((v): v is string => !!v);
    const intendedMajors = (personalProfile?.intendedMajors || [])
      .filter((m) => !!m?.major)
      .map((m) => ({ major: m.major, confidence: m.confidence }));
    const languages = (personalProfile?.demographics?.languages || [])
      .map((l) => l?.language)
      .filter((v): v is string => !!v);
    const careerGoals = personalProfile?.careerGoals || [];
    return { collegeUniversities, collegeMajors, intendedMajors, languages, careerGoals };
  }, [collegeApps, personalProfile]);

  const hasMatchableSignals =
    matchInputs.collegeUniversities.length > 0 ||
    matchInputs.intendedMajors.length > 0 ||
    matchInputs.languages.length > 0 ||
    matchInputs.careerGoals.length > 0;

  const mentorLevelOptions = [
    { label: t('mentors.filters.allCoachingTiers', 'All coaching tiers'), value: 'all' },
    { label: 'Pro bono', value: MentorExperienceLevel.Probono },
    { label: 'Junior', value: MentorExperienceLevel.Junior },
    { label: 'Senior', value: MentorExperienceLevel.Senior },
    { label: 'Expert', value: MentorExperienceLevel.Expert },
  ];

  const universityOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((m) => {
      const uni = m.mentorProfile?.university?.trim();
      if (uni) set.add(uni);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const majorOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((m) => {
      const major = m.mentorProfile?.major?.trim();
      if (major) set.add(major);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const languageOptions = useMemo(() => {
    if (!mentorsData) return [];
    const set = new Set<string>();
    mentorsData.forEach((m) => {
      (m.mentorProfile?.languages || []).forEach((lang) => {
        const trimmed = lang?.trim();
        if (trimmed) set.add(trimmed);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mentorsData]);

  const ratingSelectOptions = RATING_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.value === 'all' ? t('mentors.filters.allRatings', 'All ratings') : t('mentors.filters.ratingPlus', '{{value}}+', { value: opt.value }),
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

  const filteredMentors = useMemo(() => {
    if (!mentorsData) return [];
    const query = nameQuery.trim().toLowerCase();
    const ratingThreshold = RATING_OPTIONS.find((o) => o.value === selectedRating)?.threshold ?? 0;

    return mentorsData.filter((mentor) => {
      if (selectedLevel !== 'all' && mentor.mentorProfile?.level !== selectedLevel) return false;
      if (query && !mentor.profile?.name?.toLowerCase().includes(query)) return false;
      if (selectedUniversity !== 'all' && mentor.mentorProfile?.university !== selectedUniversity) return false;
      if (selectedMajor !== 'all' && mentor.mentorProfile?.major !== selectedMajor) return false;
      if (selectedLanguage !== 'all' && !(mentor.mentorProfile?.languages || []).includes(selectedLanguage)) return false;
      if (ratingThreshold > 0 && (mentor.profile?.overallRating || 0) < ratingThreshold) return false;
      return true;
    });
  }, [mentorsData, selectedLevel, nameQuery, selectedUniversity, selectedMajor, selectedLanguage, selectedRating]);

  const { recommended, others } = useMemo(() => {
    const scored = filteredMentors.map((m) => scoreMentor(m, matchInputs, t));
    const matched = scored.filter((s) => s.reasons.length > 0).sort((a, b) => b.score - a.score || defaultCompare(a.mentor, b.mentor));
    const unmatched = scored
      .filter((s) => s.reasons.length === 0)
      .map((s) => s.mentor)
      .sort(defaultCompare);
    return { recommended: matched, others: unmatched };
  }, [filteredMentors, matchInputs, t]);

  const totalCount = filteredMentors.length;

  const renderFilterBar = () => (
    <div className="communityMentors__filterBar">
      <div className="communityMentors__filterField communityMentors__filterSearch">
        <Input
          allowClear
          prefix={<Search size={15} style={{ opacity: 0.45 }} />}
          placeholder={t('mentors.filters.searchPlaceholder', 'Search by name')}
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="communityMentors__filterToggle"
        aria-expanded={filtersOpen}
        aria-controls="community-mentor-filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <SlidersHorizontal size={16} aria-hidden />
        {t('mentors.filters.filters', 'Filters')}
        {hasActiveFilters && <span className="communityMentors__filterDot" aria-hidden />}
        <ChevronDown size={15} aria-hidden className={filtersOpen ? 'is-open' : ''} />
      </button>
      <div
        id="community-mentor-filters"
        className={`communityMentors__advancedFilters${filtersOpen ? ' is-open' : ''}`}
      >
      {universityOptions.length > 0 && (
        <div className="communityMentors__filterField">
          <CustomSelect
            value={selectedUniversity}
            style={{ width: '100%' }}
            options={[{ label: t('mentors.filters.allUniversities', 'All universities'), value: 'all' }, ...universityOptions.map((u) => ({ label: u, value: u }))]}
            onChange={(value) => setSelectedUniversity(value)}
          />
        </div>
      )}
      {majorOptions.length > 0 && (
        <div className="communityMentors__filterField">
          <CustomSelect
            value={selectedMajor}
            style={{ width: '100%' }}
            options={[{ label: t('mentors.filters.allMajors', 'All majors'), value: 'all' }, ...majorOptions.map((m) => ({ label: m, value: m }))]}
            onChange={(value) => setSelectedMajor(value)}
          />
        </div>
      )}
      {languageOptions.length > 0 && (
        <div className="communityMentors__filterField">
          <CustomSelect
            value={selectedLanguage}
            style={{ width: '100%' }}
            options={[{ label: t('mentors.filters.allLanguages', 'All languages'), value: 'all' }, ...languageOptions.map((l) => ({ label: l, value: l }))]}
            onChange={(value) => setSelectedLanguage(value)}
          />
        </div>
      )}
      <div className="communityMentors__filterField">
        <CustomSelect value={selectedRating} style={{ width: '100%' }} options={ratingSelectOptions} onChange={(value) => setSelectedRating(value)} />
      </div>
      <div className="communityMentors__filterField">
        <CustomSelect value={selectedLevel} style={{ width: '100%' }} options={mentorLevelOptions} onChange={(value) => setSelectedLevel(value)} />
      </div>
      {hasActiveFilters && (
        <button type="button" className="communityMentors__clearFilters" onClick={clearFilters}>
          <X size={14} />
          {t('mentors.filters.clearFilters', 'Clear filters')}
        </button>
      )}
      </div>
    </div>
  );

  const renderCard = (mentor: MentorsResponseDto, reasons: MatchReason[], index: number) => {
    const profileImage = getLatestCreatedImg(mentor.profile?.media || []);
    return (
      <div className="communityMentors__cardWrap" key={mentor.id}>
        <MentorCard
          id={mentor.id}
          name={mentor.profile.name}
          imgSrc={profileImage || ''}
          rating={mentor.profile.overallRating}
          sessionNumber={mentor?.numberOfSessions}
          major={mentor?.mentorProfile?.major}
          university={(mentor as any).displayUniversity || mentor?.mentorProfile?.university || ''}
          level={mentor.mentorProfile?.level}
          availableSessions={mentor.sessionStats?.availableSessions || 0}
          email={mentor.email}
          cardIndex={index}
        />
        {/* Why this mentor was ranked here. Sits UNDER the card, not above
            it: chips wrap to one, two or three lines depending on how many
            signals matched, and when they led the cell every card in the
            row started at a different height. Capped at two so the tallest
            cell can only ever be one line taller than the shortest. */}
        {reasons.length > 0 && (
          <div className="communityMentors__reasonChips">
            {reasons.slice(0, MAX_VISIBLE_REASONS).map((r) => (
              <span className="communityMentors__reasonChip" key={r.key}>
                <Sparkles size={11} aria-hidden />
                {r.label}
              </span>
            ))}
            {reasons.length > MAX_VISIBLE_REASONS && (
              <span className="communityMentors__reasonMore">
                {t('studentHub.communityMentors.moreReasons', '+{{count}} more', {
                  count: reasons.length - MAX_VISIBLE_REASONS,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <div key={`sk-${i}`} className="communityMentors__cardSkeleton">
        <Skeleton.Image active style={{ width: '100%', height: 320 }} />
        <div className="communityMentors__cardSkeletonBody">
          <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 2, width: ['90%', '40%'] }} />
        </div>
      </div>
    ));

  return (
    <ApplicantPage
      title={t('studentHub.communityMentors.title', 'Mentors for you')}
      subtitle={t('studentHub.communityMentors.subtitle', 'Mentors ranked by how well they match your college list and profile goals.')}
    >
    <div className="communityMentors">

      {renderFilterBar()}

      {!isLoading && !isError && (
        <div className="communityMentors__resultCount">
          {t('mentors.filters.resultCount', '{{count}} mentors found', { count: totalCount })}
        </div>
      )}

      {isLoading && <div className="communityMentors__cards">{renderSkeletons(8)}</div>}

      {!isLoading && isError && (
        <p className="communityMentors__cardsError">
          {t('mentors.loadError', "Couldn't load mentors. Please refresh the page to try again.")}
        </p>
      )}

      {!isLoading && !isError && totalCount === 0 && (
        <p className="communityMentors__cardsEmpty">
          {t('mentors.filters.noResults', 'No mentors match your filters. Try clearing some filters.')}
        </p>
      )}

      {!isLoading && !isError && totalCount > 0 && (
        <>
          {!hasMatchableSignals && (
            <div className="communityMentors__prompt">
              <div className="communityMentors__promptIcon" aria-hidden>
                <GraduationCap size={18} />
              </div>
              <div className="communityMentors__promptBody">
                <div className="communityMentors__promptTitle">
                  {t('studentHub.communityMentors.promptTitle', 'Get matched to mentors')}
                </div>
                <p className="communityMentors__promptText">
                  {t(
                    'studentHub.communityMentors.promptBody',
                    "Add colleges to your list or fill out your goals in your profile, and we'll surface mentors who fit."
                  )}
                </p>
                <div className="communityMentors__promptActions">
                  <a className="communityMentors__promptLink" href="/student-hub?section=others&target=profile&tab=college-lists">
                    {t('studentHub.communityMentors.promptAddColleges', 'Add colleges to your list')}
                  </a>
                  <a className="communityMentors__promptLink" href="/student-hub?section=others&target=profile&tab=personal">
                    {t('studentHub.communityMentors.promptCompleteProfile', 'Complete your profile')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <section className="communityMentors__section">
              <div className="communityMentors__sectionHeader">
                <h2 className="communityMentors__sectionTitle">
                  {t('studentHub.communityMentors.recommendedHeading', 'Recommended for you')}
                </h2>
                <p className="communityMentors__sectionSubtitle">
                  {t('studentHub.communityMentors.recommendedSubtext', 'Based on your college list and profile goals')}
                </p>
              </div>
              <div className="communityMentors__cards">
                {recommended.map((s, i) => renderCard(s.mentor, s.reasons, i))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="communityMentors__section">
              <div className="communityMentors__sectionHeader">
                <h2 className="communityMentors__sectionTitle">
                  {t('studentHub.communityMentors.allMentorsHeading', 'All mentors')}
                </h2>
                <p className="communityMentors__sectionSubtitle">
                  {recommended.length > 0
                    ? t('studentHub.communityMentors.allMentorsSubtextWithMatches', 'Everyone else on the mentor roster')
                    : t('studentHub.communityMentors.allMentorsSubtextNoMatches', 'Explore the full mentor roster')}
                </p>
              </div>
              <div className="communityMentors__cards">
                {others.map((m, i) => renderCard(m, [], i))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
    </ApplicantPage>
  );
}
