import { useMemo, type ReactNode } from 'react';
import { Skeleton } from 'antd';
import { AlertTriangle, UserRound } from 'lucide-react';
import { useStudentProfile } from 'src/hooks/useStudentHub';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcEmpty } from '../components/CcEmpty';
import './StudentProfileDetailTab.scss';

/**
 * Read-only, flat rendering of the student's full hub profile for counselors.
 *
 * The student-facing ProfilePage splits the same data across three sub-tabs and
 * drives them from `?tab=` in the URL. That URL state would fight the counselor
 * page's own tab state, and a counselor wants the whole picture at once, so this
 * is a separate flat view rather than a reuse of those form components.
 *
 * Everything here degrades: a section that resolves to no rows is not rendered
 * at all, so a sparse profile reads as a short page rather than a wall of
 * blanks.
 */

const PROFILE_STATUS_PILL: Record<string, CcPillVariant> = {
  complete: 'success',
  reviewed: 'accent',
  in_progress: 'info',
  incomplete: 'warning',
};

function prettify(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** A key/value row. Renders nothing when the value is blank. */
function Field({ label, value }: { label: string; value: ReactNode }) {
  if (isBlank(value as any)) return null;
  return (
    <div className="cc-pd-field">
      <dt className="cc-pd-field-label">{label}</dt>
      <dd className="cc-pd-field-value">{value}</dd>
    </div>
  );
}

/** Yes/no field. Only shown when the flag was actually set. */
function BoolField({ label, value }: { label: string; value?: boolean | null }) {
  if (value === null || value === undefined) return null;
  return <Field label={label} value={value ? 'Yes' : 'No'} />;
}

/** A numeric stat rendered in the serif face (GPA, test scores, counts). */
function NumField({
  label,
  value,
  suffix,
}: {
  label: string;
  value?: number | string | null;
  suffix?: string;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <Field
      label={label}
      value={
        <span className="cc-pd-num">
          {value}
          {suffix ? <span className="cc-pd-num-suffix">{suffix}</span> : null}
        </span>
      }
    />
  );
}

/** Tag row for string lists. Renders nothing when the list is empty. */
function Chips({ label, items }: { label: string; items?: unknown[] }) {
  const clean = (items ?? [])
    .map((i) => (typeof i === 'string' ? i.trim() : String(i ?? '').trim()))
    .filter(Boolean);
  if (clean.length === 0) return null;
  return (
    <div className="cc-pd-field cc-pd-field--wide">
      <dt className="cc-pd-field-label">{label}</dt>
      <dd className="cc-pd-field-value">
        <div className="cc-pd-chips">
          {clean.map((c, i) => (
            <span className="cc-pd-chip" key={`${c}-${i}`}>
              {c}
            </span>
          ))}
        </div>
      </dd>
    </div>
  );
}

/**
 * A titled block. `children` is rendered inside a definition list; the block
 * disappears entirely when every child resolved to null (React children are
 * checked after the fact via `hasContent`).
 */
function Block({
  title,
  hasContent,
  note,
  children,
}: {
  title: string;
  hasContent: boolean;
  note?: ReactNode;
  children: ReactNode;
}) {
  if (!hasContent) return null;
  return (
    <section className="cc-profile-card cc-pd-block">
      <div className="cc-profile-card-head">
        <h2 className="cc-profile-card-title">{title}</h2>
      </div>
      {note ? <p className="cc-pd-note">{note}</p> : null}
      <dl className="cc-pd-grid">{children}</dl>
    </section>
  );
}

// ── Activities ───────────────────────────────────────────────────────────────
// The twelve activity arrays are untyped `Record<string, any>[]` bags written by
// several different forms, so no single field name is reliable. Each entry is
// reduced to a headline, a subtitle and a meta line by probing the keys that the
// student-facing forms actually write, and entries that yield nothing readable
// are dropped rather than dumped as raw JSON.

const TITLE_KEYS = [
  'name',
  'title',
  'role',
  'award',
  'activity',
  'position',
  'competition',
  'sport',
  'certification',
  'hobby',
  'publication',
  'project',
  'employer',
  'company',
  'organization',
];
const SUBTITLE_KEYS = [
  'organization',
  'employer',
  'company',
  'institution',
  'school',
  'position',
  'role',
  'level',
  'placement',
  'result',
  'issuer',
];
const META_KEYS = ['duration', 'year', 'years', 'dates', 'date', 'period', 'hours'];
const DESC_KEYS = ['description', 'details', 'summary', 'impact'];

function pick(entry: Record<string, any>, keys: string[], skip: string[] = []) {
  for (const k of keys) {
    if (skip.includes(k)) continue;
    const v = entry?.[k];
    if (typeof v === 'string' && v.trim()) return { key: k, value: v.trim() };
    if (typeof v === 'number') return { key: k, value: String(v) };
  }
  return null;
}

interface ActivityRow {
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
}

function toRow(entry: unknown): ActivityRow | null {
  if (typeof entry === 'string') {
    return entry.trim() ? { title: entry.trim() } : null;
  }
  if (!entry || typeof entry !== 'object') return null;
  const obj = entry as Record<string, any>;
  const title = pick(obj, TITLE_KEYS);
  if (!title) return null;
  const subtitle = pick(obj, SUBTITLE_KEYS, [title.key]);
  const meta = pick(obj, META_KEYS);
  const description = pick(obj, DESC_KEYS);
  return {
    title: title.value,
    subtitle: subtitle?.value,
    meta: meta?.value,
    description: description?.value,
  };
}

interface ActivityGroup {
  label: string;
  rows: ActivityRow[];
}

function ActivityList({ group }: { group: ActivityGroup }) {
  return (
    <div className="cc-pd-activity-group">
      <div className="cc-pd-activity-head">
        <span className="cc-pd-activity-label">{group.label}</span>
        <span className="cc-pd-activity-count">{group.rows.length}</span>
      </div>
      <ul className="cc-pd-activity-list">
        {group.rows.map((row, i) => (
          <li className="cc-pd-activity-row" key={`${row.title}-${i}`}>
            <span className="cc-pd-activity-title">{row.title}</span>
            {row.subtitle || row.meta ? (
              <span className="cc-pd-activity-meta">
                {[row.subtitle, row.meta].filter(Boolean).join(' · ')}
              </span>
            ) : null}
            {row.description ? (
              <span className="cc-pd-activity-desc">{row.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Tab ──────────────────────────────────────────────────────────────────────

export default function StudentProfileDetailTab({ userId }: { userId: string }) {
  // Passing studentId flips the hook into read-only mode and fetches
  // GET /student-profile/user/{userId}. The response is wrapped, and the hook
  // already unwraps `.data` defensively.
  const { profile, isLoading, error } = useStudentProfile({ studentId: userId });

  const p: any = profile ?? null;
  const academic = p?.academicProfile ?? null;
  const personal = p?.personalProfile ?? null;
  const activities = p?.activitiesProfile ?? null;

  // Intended major lives at personalProfile.intendedMajors[0], not top level.
  const intended = personal?.intendedMajors?.[0] ?? null;

  // Backup majors are stored as objects but only the name is meaningful: their
  // `confidence` is written as 60 by the student form while the intended-major
  // confidence is a 1-5 rating, so the two are not comparable and the backup
  // number is never shown.
  const backupMajors: string[] = useMemo(
    () =>
      (personal?.backupMajors ?? [])
        .map((m: any) => (typeof m === 'string' ? m : m?.major))
        .filter((m: any) => typeof m === 'string' && m.trim()),
    [personal],
  );

  const languages: string[] = useMemo(
    () =>
      (personal?.demographics?.languages ?? personal?.languages ?? [])
        .map((l: any) =>
          typeof l === 'string'
            ? l
            : l?.language
              ? `${l.language}${l.proficiency ? ` (${prettify(l.proficiency)})` : ''}`
              : null,
        )
        .filter(Boolean),
    [personal],
  );

  // Two spellings of the same answer exist in the data.
  const studyAbroad =
    personal?.studyAbroadInterest ?? personal?.studyAbroadGoals?.interest ?? null;

  const activityGroups: ActivityGroup[] = useMemo(() => {
    if (!activities) return [];
    const defs: [string, string][] = [
      ['extracurricularActivities', 'Extracurricular activities'],
      ['leadershipRoles', 'Leadership roles'],
      ['awards', 'Awards'],
      ['competitions', 'Competitions'],
      ['researchExperience', 'Research experience'],
      ['publications', 'Publications'],
      ['workExperience', 'Work experience'],
      ['volunteerWork', 'Volunteer work'],
      ['sports', 'Sports'],
      ['arts', 'Arts'],
      ['certifications', 'Certifications'],
      ['hobbies', 'Hobbies'],
    ];
    return defs
      .map(([key, label]) => ({
        label,
        rows: (Array.isArray(activities[key]) ? activities[key] : [])
          .map(toRow)
          .filter((r): r is ActivityRow => !!r),
      }))
      .filter((g) => g.rows.length > 0);
  }, [activities]);

  const sat = academic?.testScores?.sat;
  const act = academic?.testScores?.act;
  const ielts = academic?.testScores?.ielts;
  const toefl = academic?.testScores?.toefl;
  const duolingo = academic?.testScores?.duolingo;

  const hasIdentity = !!(
    personal?.country ||
    personal?.state ||
    personal?.city ||
    personal?.timezone ||
    personal?.demographics?.citizenship ||
    personal?.demographics?.visaStatus ||
    personal?.demographics?.ethnicity?.length
  );

  const hasAcademic = !!(
    academic &&
    (academic.gpa?.unweighted != null ||
      academic.gpa?.weighted != null ||
      academic.gpa?.cumulative != null ||
      academic.curriculum ||
      academic.graduationYear ||
      academic.gapYear != null ||
      academic.firstGeneration != null ||
      academic.financialAid != null)
  );

  const hasTests = !!(
    sat?.total ||
    sat?.math ||
    sat?.readingWriting ||
    act?.composite ||
    ielts?.overall ||
    toefl?.total ||
    duolingo
  );

  const hasDirection = !!(
    intended?.major ||
    backupMajors.length ||
    personal?.careerGoals?.length ||
    personal?.personalInterests?.length ||
    languages.length ||
    personal?.valuesAndMotivations?.length ||
    personal?.universityPreferences?.length ||
    personal?.workStylePreferences?.length ||
    personal?.problemSolvingApproach?.length ||
    studyAbroad != null ||
    personal?.studyAbroadGoals?.targetCountries?.length
  );

  const hasNarrative = !!(personal?.personalStatement || personal?.additionalInfo);

  const anyContent =
    hasIdentity ||
    hasAcademic ||
    hasTests ||
    hasDirection ||
    hasNarrative ||
    activityGroups.length > 0;

  if (isLoading && !profile) {
    return (
      <div className="cc-pd">
        <div className="cc-profile-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="cc-profile-error cc-profile-error--inline">
        <AlertTriangle size={20} />
        <div className="cc-profile-error-title">Couldn’t load the profile</div>
        <div className="cc-profile-error-text">
          This student’s profile detail failed to load. Try switching tabs or
          refreshing.
        </div>
      </div>
    );
  }

  const completion = Math.round(Number(p?.completionPercentage ?? 0));
  const status = p?.profileStatus as string | undefined;

  return (
    <div className="cc-pd">
      {/* Completion leads: it is what gates the AI recommendations. */}
      <section className="cc-profile-card cc-pd-summary">
        <div className="cc-pd-summary-figure">
          <span className="cc-pd-summary-pct">{completion}%</span>
          <span className="cc-pd-summary-cap">Profile complete</span>
        </div>
        <div className="cc-pd-summary-body">
          {status ? (
            <CcPill variant={PROFILE_STATUS_PILL[status] ?? 'neutral'}>
              {prettify(status)}
            </CcPill>
          ) : null}
          <p className="cc-pd-summary-text">
            {completion >= 100
              ? 'Everything the AI recommendations rely on has been filled in.'
              : 'The AI recommendations read this profile, so gaps below are what hold them back.'}
          </p>
        </div>
        <span className="cc-pd-summary-track" aria-hidden="true">
          <span
            className="cc-pd-summary-fill"
            style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
          />
        </span>
      </section>

      {!anyContent ? (
        <div className="cc-profile-card">
          <CcEmpty
            icon={<UserRound size={20} />}
            title="No profile yet"
            text="This student hasn’t filled in their profile. Nothing has been saved for the academic, personal or activities sections."
          />
        </div>
      ) : null}

      <Block title="Identity and location" hasContent={hasIdentity}>
        <Field label="Country" value={personal?.country} />
        <Field label="State or province" value={personal?.state} />
        <Field label="City" value={personal?.city} />
        <Field label="Timezone" value={personal?.timezone} />
        <Field label="Citizenship" value={personal?.demographics?.citizenship} />
        <Field label="Visa status" value={personal?.demographics?.visaStatus} />
        <Chips label="Ethnicity" items={personal?.demographics?.ethnicity} />
      </Block>

      <Block title="Academic" hasContent={hasAcademic}>
        <NumField label="Unweighted GPA" value={academic?.gpa?.unweighted} />
        <NumField label="Weighted GPA" value={academic?.gpa?.weighted} />
        <NumField label="Cumulative GPA" value={academic?.gpa?.cumulative} />
        <NumField label="GPA scale" value={academic?.gpa?.scale} />
        <Field label="Curriculum" value={academic?.curriculum} />
        <NumField label="Graduation year" value={academic?.graduationYear} />
        <BoolField label="Gap year planned" value={academic?.gapYear} />
        <BoolField label="First generation" value={academic?.firstGeneration} />
        <BoolField label="Financial aid needed" value={academic?.financialAid} />
        <Chips
          label="Favorite subjects"
          items={academic?.academicStrengthsAndInterests?.favoriteSubjects}
        />
        <Chips
          label="Academic strengths"
          items={academic?.academicStrengthsAndInterests?.strengths}
        />
      </Block>

      <Block title="Test scores" hasContent={hasTests}>
        <NumField label="SAT total" value={sat?.total} />
        <NumField label="SAT math" value={sat?.math} />
        <NumField label="SAT reading and writing" value={sat?.readingWriting} />
        <NumField label="ACT composite" value={act?.composite} />
        <NumField label="IELTS overall" value={ielts?.overall} />
        <NumField label="TOEFL total" value={toefl?.total} />
        <NumField label="Duolingo" value={duolingo} />
      </Block>

      <Block title="Direction" hasContent={hasDirection}>
        <Field label="Intended major" value={intended?.major} />
        {/* The intended-major confidence is a 1-5 rating from the student form.
            Backup majors carry a 0-100 style number instead, so theirs is never
            surfaced next to this one. */}
        <NumField
          label="Confidence in that major"
          value={intended?.confidence != null ? intended.confidence : null}
          suffix=" of 5"
        />
        <Field
          label="Why that major"
          value={
            intended?.whyInterested ? (
              <span className="cc-pd-prose">{intended.whyInterested}</span>
            ) : null
          }
        />
        <Chips label="Backup majors" items={backupMajors} />
        <Chips label="Career goals" items={personal?.careerGoals} />
        <Chips label="Personal interests" items={personal?.personalInterests} />
        <Chips label="Languages" items={languages} />
        <Chips label="Values and motivations" items={personal?.valuesAndMotivations} />
        <Chips label="University preferences" items={personal?.universityPreferences} />
        <Chips label="Work style" items={personal?.workStylePreferences} />
        <Chips label="Problem solving" items={personal?.problemSolvingApproach} />
        <BoolField label="Interested in studying abroad" value={studyAbroad} />
        <Chips
          label="Target countries"
          items={personal?.studyAbroadGoals?.targetCountries}
        />
        <Field
          label="Duration preference"
          value={prettify(personal?.studyAbroadGoals?.durationPreference)}
        />
      </Block>

      <Block title="In their words" hasContent={hasNarrative}>
        <Field
          label="Personal statement"
          value={
            personal?.personalStatement ? (
              <span className="cc-pd-prose">{personal.personalStatement}</span>
            ) : null
          }
        />
        <Field
          label="Additional information"
          value={
            personal?.additionalInfo ? (
              <span className="cc-pd-prose">{personal.additionalInfo}</span>
            ) : null
          }
        />
      </Block>

      {activityGroups.length > 0 ? (
        <section className="cc-profile-card cc-pd-block">
          <div className="cc-profile-card-head">
            <h2 className="cc-profile-card-title">Activities and achievements</h2>
          </div>
          <div className="cc-pd-activities">
            {activityGroups.map((g) => (
              <ActivityList group={g} key={g.label} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
