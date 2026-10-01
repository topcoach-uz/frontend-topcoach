import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Spin, message } from 'antd';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  GraduationCap,
  Lock,
  MapPin,
  Send,
  Sparkles,
  Users as UsersIcon,
} from 'lucide-react';

import { useTypedSelector } from 'src/app/store';
import { useCommunityAccessGate } from 'src/lib/communityAccess';
import { useLaunchEventVisible } from 'src/lib/launchEventAccess';
import { Navigate } from 'react-router-dom';
import {
  useGetTopcoachLaunchEventMeQuery,
  useSubmitTopcoachLaunchEventMutation,
  type LaunchEventAttendance,
  type LaunchEventCountryId,
  type LaunchEventEnglishLevel,
  type LaunchEventFieldId,
  type LaunchEventGradeId,
  type LaunchEventReferralSource,
  type SubmitTopcoachLaunchEventDto,
} from 'src/app/services/topcoachLaunchEventApi';
import styles from './TopcoachLaunchEvent.module.scss';

// ── Static event metadata (single-event hardcoded module) ────────────────
const TELEGRAM_INVITE_URL = 'https://t.me/+LXj0FDnI6ow3YTBi';
const EVENT_DATE_LABEL = 'Sunday, May 24, 2026';
const EVENT_DOORS_LABEL = 'Registration 10:00 AM · Starts 11:00 AM · Apply by May 22';
const EVENT_VENUE_PRIMARY = 'Youth Affairs Agency of Uzbekistan';
const EVENT_VENUE_CITY = 'Tashkent, Uzbekistan';
const EVENT_VENUE_NOTE = 'Entry closes at 11:00 AM — please arrive during the registration window';

const FIELDS: { id: LaunchEventFieldId; label: string }[] = [
  { id: 'business_economics', label: 'Business & Economics' },
  { id: 'computer_science_it', label: 'Computer Science & IT' },
  { id: 'medicine_healthcare', label: 'Medicine & Healthcare' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'law', label: 'Law' },
  { id: 'design_architecture', label: 'Design & Architecture' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'finance_banking', label: 'Finance & Banking' },
  { id: 'natural_sciences', label: 'Natural Sciences' },
  { id: 'other', label: 'Other' },
];

const COUNTRIES: { id: LaunchEventCountryId; label: string }[] = [
  { id: 'usa', label: '🇺🇸 USA' },
  { id: 'uk', label: '🇬🇧 UK' },
  { id: 'germany', label: '🇩🇪 Germany' },
  { id: 'canada', label: '🇨🇦 Canada' },
  { id: 'australia', label: '🇦🇺 Australia' },
  { id: 'netherlands', label: '🇳🇱 Netherlands' },
  { id: 'singapore', label: '🇸🇬 Singapore' },
  { id: 'south_korea', label: '🇰🇷 South Korea' },
  { id: 'japan', label: '🇯🇵 Japan' },
  { id: 'other', label: 'Other' },
];

const GRADES: { id: LaunchEventGradeId; label: string }[] = [
  { id: '8th_grade', label: '8th grade' },
  { id: '9th_grade', label: '9th grade' },
  { id: '10th_grade', label: '10th grade' },
  { id: '11th_grade', label: '11th grade' },
  { id: '12th_grade', label: '12th grade' },
  { id: 'gap_year', label: 'Gap year' },
  { id: 'undergrad', label: 'Undergrad' },
  { id: 'graduate', label: 'Graduate / postgrad' },
  { id: 'other', label: 'Other' },
];

const ENGLISH_LEVELS: {
  id: LaunchEventEnglishLevel;
  title: string;
  body: string;
}[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    body: 'A1 – A2 · Just getting started',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    body: 'B1 · Comfortable in everyday situations',
  },
  {
    id: 'upper_intermediate',
    title: 'Upper-intermediate',
    body: 'B2 · Can handle academic texts',
  },
  {
    id: 'advanced',
    title: 'Advanced / IELTS 6.5+',
    body: 'C1 – C2 · Ready for top universities',
  },
];

const REFERRAL_SOURCES: {
  id: LaunchEventReferralSource;
  label: string;
}[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'friend', label: 'A friend' },
  { id: 'school', label: 'School' },
  { id: 'other', label: 'Other' },
];

type Step = 'about' | 'education' | 'goals' | 'confirm';
const STEPS: { id: Step; label: string }[] = [
  { id: 'about', label: 'About you' },
  { id: 'education', label: 'Education' },
  { id: 'goals', label: 'Goals' },
  { id: 'confirm', label: 'Confirm' },
];

type Draft = Partial<SubmitTopcoachLaunchEventDto> & {
  fields: LaunchEventFieldId[];
  countries: LaunchEventCountryId[];
};

/** Returns the first invalid field name on the given step, or null. */
function validateStep(step: Step, draft: Draft): string | null {
  if (step === 'about') {
    if (!draft.fullName || draft.fullName.trim().length < 2) return 'fullName';
    if (!draft.phone || draft.phone.trim().length < 6) return 'phone';
    if (!draft.telegramUsername || draft.telegramUsername.trim().length < 2)
      return 'telegramUsername';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!draft.email || !emailRe.test(draft.email)) return 'email';
  }
  if (step === 'education') {
    if (!draft.grade) return 'grade';
    if (!draft.englishLevel) return 'englishLevel';
  }
  if (step === 'goals') {
    if (!draft.fields || draft.fields.length === 0) return 'fields';
    if (!draft.countries || draft.countries.length === 0) return 'countries';
  }
  if (step === 'confirm') {
    if (!draft.referralSource) return 'referralSource';
    if (!draft.attendance) return 'attendance';
  }
  return null;
}

export default function TopcoachLaunchEventPage() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useTypedSelector((s) => s.auth);
  const visible = useLaunchEventVisible();

  const { data, isLoading: meLoading } = useGetTopcoachLaunchEventMeQuery(
    undefined,
    { skip: !isAuthenticated || !visible },
  );
  const [submit, { isLoading: submitting }] =
    useSubmitTopcoachLaunchEventMutation();

  const alreadyRegistered = data?.registration?.status === 'confirmed';

  // Funnel-aware Community CTA (shown on the registration success screen).
  // The gate routes registrants to the Community plan or their unlocked hub,
  // roadmap preview, or subscription tab — based on how far through the
  // Community membership funnel they are.
  const communityGate = useCommunityAccessGate();

  const [step, setStep] = useState<Step>('about');
  const [draft, setDraft] = useState<Draft>(() => ({
    fields: [],
    countries: [],
  }));
  const [errorField, setErrorField] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-fill email + name from the logged-in profile so the user
  // doesn't retype them. Re-runs whenever the modal opens.
  useEffect(() => {
    if (!isAuthenticated || !profile) return;
    setDraft((d) => ({
      ...d,
      email: d.email ?? profile.email ?? undefined,
      fullName:
        d.fullName ?? (profile.profile as { name?: string })?.name ?? undefined,
    }));
  }, [isAuthenticated, profile]);

  const stepIndex = useMemo(
    () => STEPS.findIndex((s) => s.id === step),
    [step],
  );

  const handleNext = () => {
    const invalid = validateStep(step, draft);
    if (invalid) {
      setErrorField(invalid);
      return;
    }
    setErrorField(null);
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const handleBack = () => {
    setErrorField(null);
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const handleSubmit = async () => {
    const invalid = validateStep('confirm', draft);
    if (invalid) {
      setErrorField(invalid);
      return;
    }
    try {
      await submit(draft as SubmitTopcoachLaunchEventDto).unwrap();
      setShowSuccess(true);
      message.success("You're in! Confirmation email on its way.");
    } catch (err) {
      const anyErr = err as { data?: { message?: string | string[] } };
      const m = anyErr?.data?.message;
      const text = Array.isArray(m) ? m.join(' • ') : m;
      message.error(
        text ?? "Couldn't complete your registration. Please try again.",
      );
    }
  };

  // ── Feature-flag gate ──────────────────────────────────────────────
  // While the Launch Event is still private, redirect non-admin visitors
  // back to /events. SuperAdmin / Owner can preview the full flow.
  if (!visible) {
    return <Navigate to="/events" replace />;
  }

  // ── Login required gate ────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <Hero />
        <article className={`${styles.card} ${styles.lockedCard}`}>
          <Lock size={22} className={styles.lockedCard__icon} />
          <h2 className={styles.lockedCard__title}>Sign in to register</h2>
          <p className={styles.lockedCard__desc}>
            Registration is free — we just need a Top Coach account to send
            your confirmation, ticket and event reminders.
          </p>
          <div className={styles.lockedCard__actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() =>
                navigate(
                  `/auth/signin?redirect=${encodeURIComponent('/events/topcoach-launch-event')}`,
                )
              }
            >
              Sign in to continue <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() =>
                navigate(
                  `/auth/signup?redirect=${encodeURIComponent('/events/topcoach-launch-event')}`,
                )
              }
            >
              Create an account
            </button>
          </div>
        </article>
      </div>
    );
  }

  if (meLoading) {
    return (
      <div className={styles.page}>
        <Hero />
        <article className={`${styles.card} ${styles.loadingCard}`}>
          <Spin />
          <p>Checking your registration…</p>
        </article>
      </div>
    );
  }

  // ── Already registered (or just succeeded) ────────────────────────
  if (alreadyRegistered || showSuccess) {
    return (
      <div className={styles.page}>
        <Hero />
        <article className={`${styles.card} ${styles.successCard}`}>
          <div className={styles.successCard__bubble}>
            <CheckCircle2 size={32} strokeWidth={2} />
          </div>
          <h2 className={styles.successCard__title}>You're in! 🎉</h2>
          <p className={styles.successCard__desc}>
            Your spot is reserved for the New Feature Launch. Here's
            everything you need to know.
          </p>

          <div className={styles.eventGrid}>
            <div className={styles.eventGrid__item}>
              <Calendar size={16} />
              <div>
                <div className={styles.eventGrid__label}>Date &amp; time</div>
                <strong>{EVENT_DATE_LABEL}</strong>
                <span>{EVENT_DOORS_LABEL}</span>
              </div>
            </div>
            <div className={styles.eventGrid__item}>
              <MapPin size={16} />
              <div>
                <div className={styles.eventGrid__label}>Venue</div>
                <strong>{EVENT_VENUE_PRIMARY}</strong>
                <span>{EVENT_VENUE_CITY}</span>
                <em>{EVENT_VENUE_NOTE}</em>
              </div>
            </div>
            <div className={styles.eventGrid__item}>
              <Send size={16} />
              <div>
                <div className={styles.eventGrid__label}>Confirmation email</div>
                <strong>On its way to your inbox</strong>
                <span>
                  Check your spam folder if you don't see it within a few
                  minutes.
                </span>
              </div>
            </div>
          </div>

          {/* Pre-event community channel. Telegram is where attendees
              get speaker announcements, schedule updates, and meet
              each other before May 24. */}
          <a
            className={styles.telegramCard}
            href={TELEGRAM_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.telegramCard__icon} aria-hidden>
              <Send size={20} />
            </div>
            <div className={styles.telegramCard__body}>
              <div className={styles.telegramCard__title}>
                Join our community channel
              </div>
              <div className={styles.telegramCard__desc}>
                Get event updates, speaker announcements, and connect with
                other attendees before the big day.
              </div>
            </div>
            <span className={styles.telegramCard__cta}>
              <Send size={14} /> Join on Telegram
            </span>
          </a>

          <div className={styles.successCard__actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate(communityGate.destination)}
              disabled={communityGate.state === 'loading'}
            >
              {communityGate.state === 'eligible'
                ? 'Open Community'
                : communityGate.state === 'needs_subscription'
                    ? 'View Community plans'
                    : 'Join the Community'}
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate('/student-hub')}
            >
              Back to My Journey
            </button>
          </div>
        </article>
      </div>
    );
  }

  // ── Multi-step form ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <Hero />

      <article className={`${styles.card} ${styles.formCard}`}>
        <Stepper currentStep={step} />

        {step === 'about' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tell us about yourself</h2>
            <p className={styles.sectionDesc}>
              We'll use this to send you updates and confirm your spot.
            </p>

            <Field
              label="Full name"
              required
              value={draft.fullName ?? ''}
              onChange={(v) => setDraft((d) => ({ ...d, fullName: v }))}
              placeholder="e.g. Azizbek Karimov"
              error={errorField === 'fullName' ? 'Please enter your full name' : null}
            />
            <Field
              label="Phone number"
              required
              value={draft.phone ?? ''}
              onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
              placeholder="+998 90 123 45 67"
              error={errorField === 'phone' ? 'Please enter your phone number' : null}
            />
            <Field
              label="Telegram username"
              required
              value={draft.telegramUsername ?? ''}
              onChange={(v) => setDraft((d) => ({ ...d, telegramUsername: v }))}
              placeholder="@username"
              error={
                errorField === 'telegramUsername'
                  ? 'Please enter your Telegram username'
                  : null
              }
            />
            <Field
              label="Email address"
              required
              value={draft.email ?? ''}
              onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
              placeholder="you@example.com"
              type="email"
              error={
                errorField === 'email' ? 'Please enter a valid email address' : null
              }
            />
          </section>
        )}

        {step === 'education' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your education background</h2>
            <p className={styles.sectionDesc}>
              Help us tailor the event content to your level.
            </p>

            <label className={styles.fieldLabel}>
              Which grade are you in? <span className={styles.req}>*</span>
            </label>
            <select
              className={`${styles.select} ${
                errorField === 'grade' ? styles.invalid : ''
              }`}
              value={draft.grade ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  grade: e.target.value as LaunchEventGradeId,
                }))
              }
            >
              <option value="">Select your grade…</option>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            {errorField === 'grade' && (
              <div className={styles.errorMsg}>Please select your grade</div>
            )}

            <label className={styles.fieldLabel} style={{ marginTop: 18 }}>
              English level <span className={styles.req}>*</span>
            </label>
            <div className={styles.optionList}>
              {ENGLISH_LEVELS.map((opt) => {
                const active = draft.englishLevel === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    className={`${styles.optionRow} ${
                      active ? styles.optionRowActive : ''
                    }`}
                    onClick={() =>
                      setDraft((d) => ({ ...d, englishLevel: opt.id }))
                    }
                  >
                    <span className={styles.optionRow__radio}>
                      {active ? <span /> : null}
                    </span>
                    <div>
                      <strong>{opt.title}</strong>
                      <span>{opt.body}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errorField === 'englishLevel' && (
              <div className={styles.errorMsg}>
                Please choose your English level
              </div>
            )}
          </section>
        )}

        {step === 'goals' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your interests &amp; goals</h2>
            <p className={styles.sectionDesc}>
              What are you aiming for? We'll make sure the event delivers.
            </p>

            <label className={styles.fieldLabel}>
              Fields you're interested in <span className={styles.req}>*</span>
              <span className={styles.fieldHint}> (pick all that apply)</span>
            </label>
            <div className={styles.chipGrid}>
              {FIELDS.map((f) => {
                const active = draft.fields.includes(f.id);
                return (
                  <button
                    type="button"
                    key={f.id}
                    className={`${styles.chip} ${
                      active ? styles.chipActive : ''
                    }`}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        fields: active
                          ? d.fields.filter((x) => x !== f.id)
                          : [...d.fields, f.id],
                      }))
                    }
                  >
                    {active && <Check size={13} />}
                    {f.label}
                  </button>
                );
              })}
            </div>
            {errorField === 'fields' && (
              <div className={styles.errorMsg}>Pick at least one field</div>
            )}

            <label className={styles.fieldLabel} style={{ marginTop: 18 }}>
              Countries you'd like to study in{' '}
              <span className={styles.req}>*</span>
              <span className={styles.fieldHint}> (pick all that apply)</span>
            </label>
            <div className={styles.chipGrid}>
              {COUNTRIES.map((c) => {
                const active = draft.countries.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`${styles.chip} ${
                      active ? styles.chipActive : ''
                    }`}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        countries: active
                          ? d.countries.filter((x) => x !== c.id)
                          : [...d.countries, c.id],
                      }))
                    }
                  >
                    {active && <Check size={13} />}
                    {c.label}
                  </button>
                );
              })}
            </div>
            {errorField === 'countries' && (
              <div className={styles.errorMsg}>Pick at least one country</div>
            )}
          </section>
        )}

        {step === 'confirm' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Final details</h2>
            <p className={styles.sectionDesc}>
              You're almost in — just a few last questions.
            </p>

            <label className={styles.fieldLabel}>
              How did you hear about us? <span className={styles.req}>*</span>
            </label>
            <div className={styles.chipGrid}>
              {REFERRAL_SOURCES.map((r) => {
                const active = draft.referralSource === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={`${styles.chip} ${
                      active ? styles.chipActive : ''
                    }`}
                    onClick={() =>
                      setDraft((d) => ({ ...d, referralSource: r.id }))
                    }
                  >
                    {active && <Check size={13} />}
                    {r.label}
                  </button>
                );
              })}
            </div>
            {errorField === 'referralSource' && (
              <div className={styles.errorMsg}>Please pick one option</div>
            )}

            <label className={styles.fieldLabel} style={{ marginTop: 18 }}>
              What do you expect from this event?{' '}
              <span className={styles.fieldHint}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={draft.expectations ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, expectations: e.target.value }))
              }
              placeholder="e.g. I want to learn how to apply to top universities and meet students who've already done it…"
            />

            <label className={styles.fieldLabel} style={{ marginTop: 18 }}>
              Can you attend on May 24? <span className={styles.req}>*</span>
            </label>
            <div className={styles.attendanceGrid}>
              {(
                [
                  { id: 'yes' as LaunchEventAttendance, title: "Yes, I'll be there!", hint: 'Confirmed attendance' },
                  { id: 'maybe_next_time' as LaunchEventAttendance, title: "Can't make it", hint: 'Maybe next time' },
                ] as const
              ).map((opt) => {
                const active = draft.attendance === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    className={`${styles.attendanceTile} ${
                      active ? styles.attendanceTileActive : ''
                    }`}
                    onClick={() =>
                      setDraft((d) => ({ ...d, attendance: opt.id }))
                    }
                  >
                    <span className={styles.attendanceTile__radio}>
                      {active ? <span /> : null}
                    </span>
                    <strong>{opt.title}</strong>
                    <span>{opt.hint}</span>
                  </button>
                );
              })}
            </div>
            {errorField === 'attendance' && (
              <div className={styles.errorMsg}>Please choose an option</div>
            )}

            <label className={styles.fieldLabel} style={{ marginTop: 18 }}>
              <Sparkles size={13} /> Your admissions question{' '}
              <span className={styles.fieldHint}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={draft.admissionsQuestion ?? ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  admissionsQuestion: e.target.value,
                }))
              }
              placeholder="e.g. How do I write a compelling personal statement for Oxford?"
            />
          </section>
        )}

        <div className={styles.actions}>
          {stepIndex > 0 ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={handleBack}
              disabled={submitting}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <span />
          )}
          {step !== 'confirm' ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleNext}
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Spin size="small" /> : <CheckCircle2 size={14} />}{' '}
              Complete registration
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────

function Hero() {
  return (
    <header className={styles.hero}>
      <span className={styles.hero__eyebrow}>Top Coach · Featured event</span>
      <h1 className={styles.hero__title}>
        New <em>Feature Launch</em>
      </h1>
      <p className={styles.hero__lede}>
        Your path to the world's best universities starts here.
      </p>
      <div className={styles.hero__pills}>
        <span className={styles.hero__pill}>
          <Calendar size={13} /> {EVENT_DATE_LABEL}
        </span>
        <span className={styles.hero__pill}>
          <MapPin size={13} /> {EVENT_VENUE_PRIMARY}
        </span>
        <span className={styles.hero__pill}>
          <UsersIcon size={13} /> {EVENT_VENUE_CITY}
        </span>
      </div>
    </header>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <ol className={styles.stepper}>
      {STEPS.map((s, i) => {
        const state = i < idx ? 'done' : i === idx ? 'active' : 'idle';
        const Icon = i < idx ? Check : GraduationCap; // last-icon is just decorative
        return (
          <li
            key={s.id}
            className={`${styles.stepper__item} ${styles[`stepper__item--${state}`]}`}
          >
            <span className={styles.stepper__dot}>
              {state === 'done' ? <Icon size={12} /> : i + 1}
            </span>
            <span className={styles.stepper__label}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
};
function Field({ label, required, value, onChange, placeholder, type = 'text', error }: FieldProps) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>
        {label} {required && <span className={styles.req}>*</span>}
      </label>
      <input
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}

// Quiet the unused-import linter while ESLint sees the `App` symbol —
// AntD's `message` API uses the imperative form which is fine but TS
// complains if we don't reference both.
void App;
