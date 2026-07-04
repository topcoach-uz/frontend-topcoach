// ISC 2026 — public applicant experience (self-contained mock).
// Phases: landing (Before you begin) → form (4 sections) → review → submitted.
// Designed as a focused application portal: a slim functional header
// (brand + Exit), a one-frame landing, and a form with a sticky
// progress header + sticky Back/Next bar so navigation is always visible.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  FileCheck2,
  X,
  Save,
} from 'lucide-react';
import s from './applicant.module.scss';
import { IscApplicantType, IscProgram } from './types';
import {
  useGetIscConfigQuery,
  useGetIscApplicationMeQuery,
  useSubmitIscApplicationMutation,
  useUploadIscDocumentMutation,
  type IscApplicationStatus,
} from 'src/app/services/iscAdmissionsApi';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { hasIscLocalDraft } from '../events/_components/useIscCardState';

const ISC_PATH = '/events/international-summer-camp-2026';

/** Backend status → applicant-facing status screen copy. */
const STATUS_VIEW: Record<
  IscApplicationStatus,
  { title: string; body: string; tone: 'pending' | 'success' | 'danger' } | null
> = {
  submitted: {
    title: 'Application submitted',
    body: 'Your application is in. Our admissions team will review it and follow up by email.',
    tone: 'pending',
  },
  under_review: {
    title: 'Under review',
    body: 'Our reviewers are reading your application. We’ll be in touch with next steps.',
    tone: 'pending',
  },
  reviewed: {
    title: 'Under review',
    body: 'Your application has been reviewed and is moving through the process.',
    tone: 'pending',
  },
  interview_scheduled: {
    title: 'Interview scheduled',
    body: 'You’ve advanced to the interview stage. Check your email for the details.',
    tone: 'pending',
  },
  interview_completed: {
    title: 'Interview completed',
    body: 'Thanks for interviewing. We’ll share the final decision by email soon.',
    tone: 'pending',
  },
  waitlisted: {
    title: 'Waitlisted',
    body: 'You’re on the waitlist. We’ll reach out by email if a place opens up.',
    tone: 'pending',
  },
  accepted: {
    title: 'Congratulations — you’re in! 🎉',
    body: 'You’ve been accepted to the International Summer Camp 2026. Watch your email for joining details.',
    tone: 'success',
  },
  rejected: {
    title: 'Application decision',
    body: 'Thank you for applying. Unfortunately you weren’t selected this year — we hope to see you again.',
    tone: 'danger',
  },
  withdrawn: null,
};

type Phase = 'landing' | 'form' | 'review' | 'submitted' | 'status';

interface Draft {
  fullName: string;
  age: string;
  grade: string;
  countryOfResidence: string;
  passportNumber: string;
  email: string;
  phone: string;
  telegram: string;
  passportUploaded: boolean;
  passportPath: string;
  passportName: string;
  englishTest: string;
  englishScore: string;
  englishDate: string;
  englishUploaded: boolean;
  englishCertPath: string;
  englishCertName: string;
  satScore: string;
  satUploaded: boolean;
  satReportPath: string;
  satName: string;
  // Master's-track current education
  university: string;
  degree: string;
  gradYear: string;
  gpa: string;
  gre: string;
  gmat: string;
  cvUploaded: boolean;
  cvPath: string;
  cvName: string;
  extracurriculars: string;
  awards: string;
  whyCamp: string;
  whySelect: string;
}

const EMPTY: Draft = {
  fullName: '', age: '', grade: '', countryOfResidence: '', passportNumber: '', email: '', phone: '', telegram: '',
  passportUploaded: false, passportPath: '', passportName: '', englishTest: '', englishScore: '', englishDate: '',
  englishUploaded: false, englishCertPath: '', englishCertName: '', satScore: '', satUploaded: false, satReportPath: '', satName: '',
  university: '', degree: '', gradYear: '', gpa: '', gre: '', gmat: '', cvUploaded: false, cvPath: '', cvName: '',
  extracurriculars: '', awards: '', whyCamp: '', whySelect: '',
};

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const ENGLISH_TESTS = ['IELTS', 'CEFR', 'TOEFL', 'Duolingo', 'Mock result'];
const GRAD_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032'];
const COUNTRIES = [
  'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Afghanistan',
  'Russia', 'Turkey', 'United States', 'United Kingdom', 'Canada', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Czech Republic',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'China', 'South Korea',
  'Japan', 'India', 'Pakistan', 'Malaysia', 'Australia', 'Other',
];

function words(str: string): number {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

type Errors = Record<string, string>;

/** Required-field validation for a given section. Empty object = valid. */
function validateSection(
  idx: number,
  d: Draft,
  program: IscProgram | null,
  applicantType: IscApplicantType | null,
): Errors {
  const isMaster = program === 'master';
  const isInternational = applicantType === 'international';
  const e: Errors = {};
  const req = (k: keyof Draft, msg = 'This field is required') => {
    if (!String(d[k] ?? '').trim()) e[k] = msg;
  };
  if (idx === 0) {
    req('fullName');
    req('age');
    // Bachelor's applicants are school students — ask their current grade.
    if (!isMaster) req('grade', 'Select your grade');
    req('passportNumber');
    // International applicants must tell us where they currently live.
    if (isInternational) req('countryOfResidence', 'Select your country of residence');
    if (!d.email.trim()) e.email = 'This field is required';
    else if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Enter a valid email address';
    req('phone');
    req('telegram');
    if (!d.passportUploaded) e.passportUploaded = 'Upload your passport photo page';
  } else if (idx === 1) {
    if (isMaster) {
      // Master's track: current education + CV, plus English proficiency.
      req('university');
      req('degree');
      req('gradYear', 'Select your expected graduation year');
      if (!d.cvUploaded) e.cvUploaded = 'Upload your CV / résumé';
      req('englishTest', 'Select a proficiency test');
      if (!d.englishUploaded) e.englishUploaded = 'Upload your proficiency certificate';
    } else {
      req('englishTest', 'Select a proficiency test');
      if (!d.englishUploaded) e.englishUploaded = 'Upload your proficiency certificate';
    }
  } else if (idx === 2) {
    req('extracurriculars');
    req('awards');
  } else if (idx === 3) {
    const w1 = words(d.whyCamp);
    if (w1 < 100 || w1 > 150) e.whyCamp = 'Essay must be 100–150 words';
    const w2 = words(d.whySelect);
    if (w2 < 100 || w2 > 150) e.whySelect = 'Essay must be 100–150 words';
  }
  return e;
}

/** localStorage key for the in-progress application draft. */
const DRAFT_KEY = 'isc-2026-application-draft-v1';

function initialPhase(): Phase {
  if (typeof window === 'undefined') return 'landing';
  const p = new URLSearchParams(window.location.search).get('phase');
  return p === 'form' || p === 'review' || p === 'submitted' ? (p as Phase) : 'landing';
}

export default function ApplicantSite() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [program, setProgram] = useState<IscProgram | null>('bachelor');
  const [applicantType, setApplicantType] = useState<IscApplicantType | null>('local');
  const [section, setSection] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [maxReached, setMaxReached] = useState(0); // furthest unlocked section

  const { data: config } = useGetIscConfigQuery();
  const [submitApplication, { isLoading: submitting }] = useSubmitIscApplicationMutation();
  const [uploadDoc] = useUploadIscDocumentMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Application is logged-in only (like every other application). Fetch the
  // account so we can prefill the contact fields we already have on file.
  const isAuthenticated = useTypedSelector((st) => st.auth.isAuthenticated);
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: meApp, isLoading: meAppLoading } = useGetIscApplicationMeQuery(
    undefined,
    { skip: !isAuthenticated, refetchOnMountOrArgChange: true },
  );
  const existingApp =
    meApp?.application && meApp.application.status !== 'withdrawn'
      ? meApp.application
      : null;
  const contactPrefilled = useRef(false);
  const bootstrapped = useRef(false);

  // Hydrate any previously-saved draft on mount so "Save draft" actually
  // survives a reload / coming back later.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        draft?: Partial<Draft>;
        program?: IscProgram | null;
        applicantType?: IscApplicantType | null;
        section?: number;
        maxReached?: number;
      };
      if (saved.draft) setDraft((d) => ({ ...d, ...saved.draft }));
      if (saved.program) setProgram(saved.program);
      if (saved.applicantType) setApplicantType(saved.applicantType);
      if (typeof saved.section === 'number') setSection(saved.section);
      if (typeof saved.maxReached === 'number') setMaxReached(saved.maxReached);
    } catch {
      /* corrupt draft — ignore and start fresh */
    }
  }, []);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  /** Persist the in-progress application locally + flash a "Saved" label. */
  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ draft, program, applicantType, section, maxReached }),
      );
      setDraftSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setDraftSaved(false), 2200);
    } catch {
      /* storage full / unavailable — silently no-op */
    }
  };

  const clearSavedDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  // Logged-in only: bounce to sign-in when an anonymous user tries to open
  // the actual application (form/review). The landing stays viewable.
  useEffect(() => {
    if (isAuthenticated) return;
    if (phase === 'form' || phase === 'review') {
      try {
        localStorage.setItem('redirectAfterLogin', ISC_PATH);
      } catch {
        /* ignore */
      }
      navigate('/auth/signin', { replace: true });
    }
  }, [isAuthenticated, phase, navigate]);

  // Prefill the contact fields we already have on file (email + phone) from
  // the account, once, and only for fields the applicant hasn't already
  // filled (e.g. from a restored draft). They remain fully editable.
  useEffect(() => {
    if (!me || contactPrefilled.current) return;
    contactPrefilled.current = true;
    const accountEmail = me.email ?? '';
    const accountPhone =
      me.phoneNumber ?? (me as { telegramPhoneNumber?: string }).telegramPhoneNumber ?? '';
    setDraft((d) => ({
      ...d,
      email: d.email || accountEmail,
      phone: d.phone || accountPhone,
    }));
  }, [me]);

  // Decide the entry phase once, after the application query settles:
  //   • submitted application (live status) → show the status screen
  //   • a saved local draft → jump straight into the form (skip the gate)
  //   • otherwise → the "Before you begin" landing
  // A `?phase=` deep-link always wins (preview / returning links).
  useEffect(() => {
    if (bootstrapped.current) return;
    if (isAuthenticated && meAppLoading) return; // wait for the status
    bootstrapped.current = true;

    const urlPhase = new URLSearchParams(window.location.search).get('phase');
    if (urlPhase) return;

    if (existingApp) {
      setPhase('status');
    } else if (isAuthenticated && hasIscLocalDraft()) {
      setPhase('form');
    }
  }, [isAuthenticated, meAppLoading, existingApp]);

  // Safety net: if the application disappears (e.g. withdrawn) while we're on
  // the status screen, drop back to the landing instead of a blank screen.
  useEffect(() => {
    if (phase === 'status' && !existingApp && !meAppLoading) setPhase('landing');
  }, [phase, existingApp, meAppLoading]);

  const up = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    // clear a field's error as soon as the user edits it
    setErrors((e) => {
      const next = { ...e };
      Object.keys(p).forEach((k) => delete next[k]);
      return next;
    });
  };
  const exit = () => navigate('/events');

  /** Assemble the 4-section draft and submit to the real API. */
  const doSubmit = async () => {
    setSubmitError(null);
    try {
      await submitApplication({
        program: program ?? 'bachelor',
        applicantType: applicantType ?? 'local',
        draft: {
          personal: {
            fullName: draft.fullName,
            age: draft.age,
            grade: draft.grade,
            countryOfResidence: draft.countryOfResidence || null,
            passportNumber: draft.passportNumber,
            email: draft.email,
            phone: draft.phone,
            telegram: draft.telegram,
            passportPath: draft.passportPath || null,
          },
          academics: {
            englishTest: draft.englishTest,
            englishScore: draft.englishScore,
            englishDate: draft.englishDate,
            certificatePath: draft.englishCertPath || null,
            satScore: draft.satScore,
            satReportPath: draft.satReportPath || null,
            // Master's-track current education
            university: draft.university,
            degree: draft.degree,
            gradYear: draft.gradYear,
            gpa: draft.gpa,
            gre: draft.gre,
            gmat: draft.gmat,
            cvPath: draft.cvPath || null,
          },
          activities: { extracurriculars: draft.extracurriculars, awards: draft.awards },
          essays: { whyCamp: draft.whyCamp, whySelect: draft.whySelect },
        },
      }).unwrap();
      clearSavedDraft();
      setPhase('submitted');
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const serverMsg = (err as { data?: { message?: string | string[] } })?.data
        ?.message;
      const serverMsgText = Array.isArray(serverMsg) ? serverMsg[0] : serverMsg;
      setSubmitError(
        status === 401
          ? 'Please sign in to submit your application.'
          : // 403 = application window closed (or not yet open) — show the
            // server's specific deadline message verbatim.
            status === 403 && serverMsgText
            ? serverMsgText
            : 'Something went wrong submitting your application. Please try again.',
      );
    }
  };

  /** Upload one document to the backend and store its returned path in the draft. */
  const uploadAndStore = async (file: File, kind: 'passport' | 'english' | 'sat' | 'cv') => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadDoc(fd).unwrap();
    const name = res.originalName || file.name;
    if (kind === 'passport') up({ passportUploaded: true, passportPath: res.path, passportName: name });
    else if (kind === 'english') up({ englishUploaded: true, englishCertPath: res.path, englishCertName: name });
    else if (kind === 'cv') up({ cvUploaded: true, cvPath: res.path, cvName: name });
    else up({ satUploaded: true, satReportPath: res.path, satName: name });
  };

  // advance only if the current section validates
  const next = () => {
    const errs = validateSection(section, draft, program, applicantType);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (section < 3) {
      const n = section + 1;
      setSection(n);
      setMaxReached((m) => Math.max(m, n));
    } else {
      setPhase('review');
    }
  };
  const back = () => { setErrors({}); setSection((x) => Math.max(0, x - 1)); };
  // tabs: free to revisit reached sections; forward jumps must validate
  const goToTab = (i: number) => {
    if (i <= section) { setErrors({}); setSection(i); return; }
    if (i <= maxReached) {
      const errs = validateSection(section, draft, program, applicantType);
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setSection(i);
    }
  };

  const programLabel = program === 'master' ? "Master's program" : "Bachelor's program";
  const typeLabel =
    applicantType === 'international' ? 'International applicant' : 'Local applicant (Uzbekistan)';
  // Step 2 is the school-leaver "Academics" block for bachelor's, and the
  // "Education" (current studies + CV) block for master's.
  const stepLabels = ['Personal info', program === 'master' ? 'Education' : 'Academics', 'Activities', 'Essays'];

  /* ── Landing ─────────────────────────────────────────────── */
  if (phase === 'landing') {
    return (
      <Shell onExit={exit}>
        <div className={s.landingWrap}>
          <div className={s.landingLeft}>
            <span className={s.eyebrow}>◷ Applications open · June 22 – July 6, 2026</span>
            <h1 className={s.heroTitle}>
              International Summer Camp <b>2026</b>
            </h1>
            <p className={s.heroSub}>
              A one-week academic camp bringing together 250 local and international students,
              particularly from Central Asia — for learning, networking, and fun, and a head
              start on studying abroad.
            </p>
            <div className={s.statsStrip}>
              <div><b>Aug 3–9</b> · 1 week</div>
              <span className={s.dot} />
              <div><b>250</b> students</div>
              <span className={s.dot} />
              <div><b>Bachelor&apos;s &amp; Master&apos;s</b></div>
            </div>
            <div className={s.deadlineInline}>
              Applications close <b>July 6, 2026 · 23:59</b>
            </div>

            <ul className={s.expectList}>
              <li><b>Mornings</b> — admissions, scholarships &amp; career sessions</li>
              <li><b>Afternoons</b> — workshops, networking, sports &amp; culture</li>
              <li><b>Connect</b> — mentors, university students &amp; peers across the region</li>
            </ul>
          </div>

          <div className={s.landingCard}>
            <h2 className={s.cardHead}>Before you begin</h2>
            <p className={s.cardSub}>Two quick questions so we open the right application for you.</p>

            <div className={s.qLabel}>Which program?</div>
            <div className={s.optionGrid}>
              <Opt active={program === 'bachelor'} onClick={() => setProgram('bachelor')}
                title="Bachelor's" desc="School students (Grades 9–11) & gap-year" />
              <Opt active={program === 'master'} onClick={() => setProgram('master')}
                title="Master's" desc="University students & recent graduates" />
            </div>

            <div className={s.qLabel}>Where are you applying from?</div>
            <div className={s.optionGrid}>
              <Opt active={applicantType === 'local'} onClick={() => setApplicantType('local')}
                title="Local" desc="Living & studying in Uzbekistan" />
              <Opt active={applicantType === 'international'} onClick={() => setApplicantType('international')}
                title="International" desc="Applying from outside Uzbekistan" />
            </div>

            <button className={`${s.btn} ${s.btnPrimary} ${s.fullBtn}`}
              disabled={!program || !applicantType} onClick={() => setPhase('form')}>
              Open my application <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Status (returning applicant, live backend status) ───── */
  if (phase === 'status' && existingApp) {
    // Acceptance gets its own celebratory screen (confetti + fancy layout).
    if (existingApp.status === 'accepted') {
      return <AcceptedScreen app={existingApp} onExit={exit} />;
    }
    const view = STATUS_VIEW[existingApp.status] ?? STATUS_VIEW.submitted!;
    const StatusIcon =
      view.tone === 'success' ? CheckCircle2 : view.tone === 'danger' ? XCircle : Clock;
    const iconColor =
      view.tone === 'success' ? '#047857' : view.tone === 'danger' ? '#b42318' : '#92651b';
    const appProgramLabel =
      existingApp.program === 'master' ? "Master's program" : "Bachelor's program";
    const appTypeLabel =
      existingApp.applicantType === 'international'
        ? 'International applicant'
        : 'Local applicant (Uzbekistan)';
    return (
      <Shell onExit={exit}>
        <div className={s.narrow}>
          <div className={s.successCard}>
            <StatusIcon size={52} color={iconColor} />
            <h1 className={s.successTitle}>{view.title}</h1>
            <p className={s.successBody}>
              {existingApp.fullName ? `${existingApp.fullName}, ` : ''}
              {view.body}
            </p>
            <div className={s.emailBox}>
              <strong>Your application</strong>
              <br />
              {appProgramLabel} · {appTypeLabel}
              {existingApp.submittedAt
                ? ` · submitted ${new Date(existingApp.submittedAt).toLocaleDateString()}`
                : ''}
            </div>
            <div className={s.successActions}>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={exit}>
                Back to events
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Submitted ───────────────────────────────────────────── */
  if (phase === 'submitted') {
    return (
      <Shell onExit={exit}>
        <div className={s.narrow}>
          <div className={s.successCard}>
            <CheckCircle2 size={52} color="#047857" />
            <h1 className={s.successTitle}>Application submitted</h1>
            <p className={s.successBody}>
              Thank you, {draft.fullName || 'applicant'}. Your application to the
              International Summer Camp 2026 has been received.
            </p>
            <div className={s.emailBox}>
              <strong>What happens next</strong><br />
              Our admissions team will review your application and follow up by email about
              next steps. A confirmation has been sent to <b>{draft.email || 'your email'}</b>.
              <br />
              Questions? Message us on Telegram:{' '}
              <a href="https://t.me/Top100uni_admin" target="_blank" rel="noreferrer">
                @Top100uni_admin
              </a>.
            </div>
            {/* One application per user — no "Start over". Returning here
                shows the live status of the submitted application. */}
            <div className={s.successActions}>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={exit}>Back to events</button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Review ──────────────────────────────────────────────── */
  if (phase === 'review') {
    const isMaster = program === 'master';
    const rows: [string, string][] = [
      ['Program', programLabel],
      ['Applying from', typeLabel],
      ['Full name', draft.fullName || '—'],
      ['Age', draft.age || '—'],
      ...(!isMaster ? [['Grade / year', draft.grade || '—'] as [string, string]] : []),
      ...(applicantType === 'international'
        ? [['Country of residence', draft.countryOfResidence || '—'] as [string, string]]
        : []),
      ['Passport number', draft.passportNumber || '—'],
      ['Email', draft.email || '—'],
      ['Phone', draft.phone || '—'],
      ['Telegram', draft.telegram || '—'],
      ...(isMaster
        ? ([
            ['University / institution', draft.university || '—'],
            ['Degree / field', draft.degree || '—'],
            ['Expected graduation', draft.gradYear || '—'],
            ['GPA / standing', draft.gpa || '—'],
            ['GRE', draft.gre || '—'],
            ['GMAT', draft.gmat || '—'],
            ['CV / résumé', draft.cvUploaded ? 'Uploaded' : '—'],
            ['English test', [draft.englishTest, draft.englishScore].filter(Boolean).join(' · ') || '—'],
          ] as [string, string][])
        : ([
            ['English test', [draft.englishTest, draft.englishScore].filter(Boolean).join(' · ') || '—'],
            ['SAT / standardized', draft.satScore || '—'],
          ] as [string, string][])),
      ['Extracurriculars', draft.extracurriculars || '—'],
      ['Awards & honors', draft.awards || '—'],
      ['Why this camp', draft.whyCamp || '—'],
      ['Why select you', draft.whySelect || '—'],
    ];
    return (
      <Shell onExit={exit}>
        <div className={s.narrow}>
          <h2 className={s.pageH}>Review your application</h2>
          <p className={s.pageHSub}>Check everything looks right before you submit.</p>
          <div className={s.section}>
            {rows.map(([k, v]) => (
              <div key={k} className={s.reviewRow}>
                <div className={s.reviewKey}>{k}</div>
                <div className={s.reviewVal}>{v}</div>
              </div>
            ))}
          </div>
          {submitError && <div className={s.submitError}>{submitError}</div>}
        </div>
        <div className={s.stickyBar}>
          <div className={s.stickyInner}>
            <button className={s.btn} onClick={() => setPhase('form')} disabled={submitting}>
              <ArrowLeft size={16} /> Back to edit
            </button>
            <div className={s.stickyRight}>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={doSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Form ────────────────────────────────────────────────── */
  const STEP_STATE = (i: number) => (i < section ? 'Done' : i === section ? 'In progress' : '');
  return (
    <Shell onExit={exit}>
      <div className={s.formScroll}>
        <div className={s.formGrid}>
          <aside className={s.stepNav}>
            <div className={s.ctxLine}>
              {programLabel} · {typeLabel}
              <button className={s.changeLink} onClick={() => setPhase('landing')}>Change</button>
            </div>
            <ol className={s.stepList}>
              {stepLabels.map((label, i) => {
                const locked = i > maxReached;
                return (
                  <li key={label}
                    className={`${s.stepItem} ${i === section ? s.stepActive : ''} ${i < section ? s.stepDone : ''} ${locked ? s.stepLocked : ''}`}
                    onClick={() => goToTab(i)}>
                    <span className={s.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={s.stepBody}>
                      <span className={s.stepName}>{label}</span>
                      <span className={s.stepState}>{STEP_STATE(i)}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className={s.deadlineNote}>
              Apply by · July 6, 2026 · 23:59<br />Camp · August 3–9, 2026
            </div>
          </aside>

          <div className={s.formCol}>
            {section === 0 && <PersonalSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} program={program} applicantType={applicantType} />}
            {section === 1 && <AcademicsSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} program={program} />}
            {section === 2 && <ActivitiesSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} />}
            {section === 3 && <EssaysSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} />}
          </div>
        </div>
      </div>

      <div className={s.stickyBar}>
        <div className={s.stickyInner}>
          <button className={s.btn} disabled={section === 0} onClick={back}>
            <ArrowLeft size={16} /> Previous
          </button>
          <span className={s.stickyMeta}>
            {Object.keys(errors).length > 0
              ? <span className={s.stickyError}>Complete the highlighted fields to continue</span>
              : `Section ${section + 1} of 4`}
          </span>
          <div className={s.stickyRight}>
            <button className={s.btnGhost} onClick={saveDraft}>
              {draftSaved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {draftSaved ? 'Saved' : 'Save draft'}
            </button>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={next}>
              {section < 3 ? 'Next' : 'Review'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ── Sections ──────────────────────────────────────────────── */
function PersonalSection({ draft, up, errors, onUpload, program, applicantType }: SectionProps & { program: IscProgram | null; applicantType: IscApplicantType | null }) {
  const isMaster = program === 'master';
  const isInternational = applicantType === 'international';
  return (
    <div className={s.section}>
      <Head num={1} title="Personal information" required />
      <Field label="Full name" req error={errors.fullName}>
        <input className={s.input} placeholder="As it appears on your passport"
          value={draft.fullName} onChange={(e) => up({ fullName: e.target.value })} />
      </Field>
      <div className={s.fieldRow}>
        <Field label="Age" req error={errors.age}>
          <input className={s.input} placeholder="e.g. 22" value={draft.age}
            onChange={(e) => up({ age: e.target.value })} />
        </Field>
        {!isMaster && (
          <Field label="Current grade / year" req error={errors.grade}>
            <select className={s.select} value={draft.grade} onChange={(e) => up({ grade: e.target.value })}>
              <option value="">Select grade</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
        )}
        <Field label="Passport number" req error={errors.passportNumber}>
          <input className={s.input} placeholder="e.g. AB1234567" value={draft.passportNumber}
            onChange={(e) => up({ passportNumber: e.target.value })} />
        </Field>
      </div>

      {isInternational && (
        <Field label="Country of residence" req error={errors.countryOfResidence}>
          <select className={s.select} value={draft.countryOfResidence}
            onChange={(e) => up({ countryOfResidence: e.target.value })}>
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      )}

      <div className={s.subLabel}>
        Contact
        <span className={s.subLabelHint}>From your account — update if needed</span>
      </div>
      <div className={s.fieldRow}>
        <Field label="Email address" req error={errors.email}>
          <input className={s.input} placeholder="you@example.com" value={draft.email}
            onChange={(e) => up({ email: e.target.value })} />
        </Field>
        <Field label="Phone number" req error={errors.phone}>
          <input className={s.input} placeholder="+998 90 123 45 67" value={draft.phone}
            onChange={(e) => up({ phone: e.target.value })} />
        </Field>
        <Field label="Telegram username" req error={errors.telegram}>
          <input className={s.input} placeholder="@username" value={draft.telegram}
            onChange={(e) => up({ telegram: e.target.value })} />
        </Field>
      </div>

      <Field label="Upload passport (photo page)" req error={errors.passportUploaded}>
        <Dropzone uploaded={draft.passportUploaded} fileName={draft.passportName} onFile={(f) => onUpload(f, 'passport')}
          onRemove={() => up({ passportUploaded: false, passportPath: '', passportName: '' })}
          title="Scan or photo of your passport's main page"
          hint="PDF, JPG, or PNG · max 5 MB · must show name, photo, and expiry date" />
      </Field>
    </div>
  );
}

function AcademicsSection({ draft, up, errors, onUpload, program }: SectionProps & { program: IscProgram | null }) {
  // Master's track: current education + CV, plus the same English
  // proficiency block that bachelor's applicants complete.
  if (program === 'master') {
    return (
      <div className={s.section}>
        <Head num={2} title="Current education" required />
        <Field label="University / institution you are currently studying at" req error={errors.university}>
          <input className={s.input} placeholder="e.g. National University of Uzbekistan, University of Westminster…"
            value={draft.university} onChange={(e) => up({ university: e.target.value })} />
        </Field>
        <div className={s.fieldRow2}>
          <Field label="Degree / field of study" req error={errors.degree}>
            <input className={s.input} placeholder="e.g. BSc Computer Science" value={draft.degree}
              onChange={(e) => up({ degree: e.target.value })} />
          </Field>
          <Field label="Expected graduation year" req error={errors.gradYear}>
            <select className={s.select} value={draft.gradYear} onChange={(e) => up({ gradYear: e.target.value })}>
              <option value="">Select year</option>
              {GRAD_YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
        </div>
        <Field label="GPA / academic standing (optional)">
          <input className={s.input} placeholder="e.g. 3.8 / 4.0 or First Class Honours" value={draft.gpa}
            onChange={(e) => up({ gpa: e.target.value })} />
        </Field>
        <div className={s.fieldRow2}>
          <Field label="GRE score (optional)">
            <input className={s.input} placeholder="e.g. 320" value={draft.gre}
              onChange={(e) => up({ gre: e.target.value })} />
          </Field>
          <Field label="GMAT score (optional)">
            <input className={s.input} placeholder="e.g. 700" value={draft.gmat}
              onChange={(e) => up({ gmat: e.target.value })} />
          </Field>
        </div>
        <Field label="Upload CV / résumé" req error={errors.cvUploaded}>
          <Dropzone uploaded={draft.cvUploaded} fileName={draft.cvName} onFile={(f) => onUpload(f, 'cv')}
            onRemove={() => up({ cvUploaded: false, cvPath: '', cvName: '' })}
            title="Upload your CV or résumé" hint="PDF preferred · max 5 MB" />
        </Field>
        <p className={s.fieldHelp}>Include education, work experience, research projects, and any relevant achievements.</p>

        <div className={s.subLabel}>English proficiency</div>
        <Field label="English proficiency test" req error={errors.englishTest}>
          <div className={s.chipRow}>
            {ENGLISH_TESTS.map((tst) => (
              <button key={tst} className={`${s.chip} ${draft.englishTest === tst ? s.chipActive : ''}`}
                onClick={() => up({ englishTest: tst })}>{tst}</button>
            ))}
          </div>
        </Field>
        <div className={s.fieldRow2}>
          <Field label="Score / band">
            <input className={s.input} placeholder="e.g. 7.0 / C1 / 105" value={draft.englishScore}
              onChange={(e) => up({ englishScore: e.target.value })} />
          </Field>
          <Field label="Test date">
            <input className={s.input} placeholder="MM/YYYY" value={draft.englishDate}
              onChange={(e) => up({ englishDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Upload proficiency certificate" req error={errors.englishUploaded}>
          <Dropzone uploaded={draft.englishUploaded} fileName={draft.englishCertName} onFile={(f) => onUpload(f, 'english')}
            onRemove={() => up({ englishUploaded: false, englishCertPath: '', englishCertName: '' })}
            title="Drag and drop your file here" hint="PDF, JPG, or PNG · max 5 MB" />
        </Field>
      </div>
    );
  }

  return (
    <div className={s.section}>
      <Head num={2} title="Academic & language qualifications" required />
      <Field label="English proficiency test" req error={errors.englishTest}>
        <div className={s.chipRow}>
          {ENGLISH_TESTS.map((tst) => (
            <button key={tst} className={`${s.chip} ${draft.englishTest === tst ? s.chipActive : ''}`}
              onClick={() => up({ englishTest: tst })}>{tst}</button>
          ))}
        </div>
      </Field>
      <div className={s.fieldRow2}>
        <Field label="Score / band">
          <input className={s.input} placeholder="e.g. 7.0 / C1 / 105" value={draft.englishScore}
            onChange={(e) => up({ englishScore: e.target.value })} />
        </Field>
        <Field label="Test date">
          <input className={s.input} placeholder="MM/YYYY" value={draft.englishDate}
            onChange={(e) => up({ englishDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Upload proficiency certificate" req error={errors.englishUploaded}>
        <Dropzone uploaded={draft.englishUploaded} fileName={draft.englishCertName} onFile={(f) => onUpload(f, 'english')}
          onRemove={() => up({ englishUploaded: false, englishCertPath: '', englishCertName: '' })}
          title="Drag and drop your file here" hint="PDF, JPG, or PNG · max 5 MB" />
      </Field>
      <div className={s.fieldRow2}>
        <Field label="SAT or other standardized tests (optional)">
          <input className={s.input} placeholder="e.g. SAT 1480, AMC 10…" value={draft.satScore}
            onChange={(e) => up({ satScore: e.target.value })} />
        </Field>
        <Field label="Upload score reports (optional)">
          <Dropzone compact uploaded={draft.satUploaded} fileName={draft.satName} onFile={(f) => onUpload(f, 'sat')}
            onRemove={() => up({ satUploaded: false, satReportPath: '', satName: '' })}
            title="Drag & drop files" hint="PDF, JPG, PNG · max 10 MB" />
        </Field>
      </div>
    </div>
  );
}

function ActivitiesSection({ draft, up, errors }: SectionProps) {
  return (
    <div className={s.section}>
      <Head num={3} title="Extracurricular activities & achievements" required />
      <Field label="Describe your main extracurricular activities" req error={errors.extracurriculars}>
        <textarea className={s.textarea} rows={4}
          placeholder="Sports, clubs, volunteering, arts, leadership roles, etc."
          value={draft.extracurriculars} onChange={(e) => up({ extracurriculars: e.target.value })} />
      </Field>
      <Field label="Awards, honors & additional achievements" req error={errors.awards}>
        <textarea className={s.textarea} rows={4}
          placeholder="Academic prizes, competition placements, certifications, or other recognitions."
          value={draft.awards} onChange={(e) => up({ awards: e.target.value })} />
      </Field>
    </div>
  );
}

function EssaysSection({ draft, up, errors }: SectionProps) {
  return (
    <div className={s.section}>
      <Head num={4} title="Personal essays" extra="100–150 words each" />
      <Field label="Why do you want to participate in this camp?" req error={errors.whyCamp}>
        <textarea className={s.textarea} rows={5}
          placeholder="Your motivations, what you hope to gain, and how this camp aligns with your goals."
          value={draft.whyCamp} onChange={(e) => up({ whyCamp: e.target.value })} />
        <WordCount n={words(draft.whyCamp)} />
      </Field>
      <Field label="Why should we select you?" req error={errors.whySelect}>
        <textarea className={s.textarea} rows={5}
          placeholder="The qualities, experiences, and perspective you would bring to the program."
          value={draft.whySelect} onChange={(e) => up({ whySelect: e.target.value })} />
        <WordCount n={words(draft.whySelect)} />
      </Field>
    </div>
  );
}

/* ── Bits ──────────────────────────────────────────────────── */
interface SectionProps {
  draft: Draft;
  up: (p: Partial<Draft>) => void;
  errors: Errors;
  onUpload: (file: File, kind: 'passport' | 'english' | 'sat' | 'cv') => Promise<void>;
}

/* ── Accepted: celebratory screen (confetti + editorial layout) ───── */
function AcceptedScreen({
  app,
  onExit,
}: {
  app: {
    fullName?: string | null;
    program: IscProgram;
    applicantType: IscApplicantType;
    submittedAt?: string | null;
  };
  onExit: () => void;
}) {
  // Confetti bursts once when the page opens, then clears itself.
  const [celebrate, setCelebrate] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setCelebrate(false), 7000);
    return () => clearTimeout(t);
  }, []);

  const firstName = (app.fullName ?? '').trim().split(/\s+/)[0] || 'there';
  const programLabel =
    app.program === 'master' ? "Master's program" : "Bachelor's program";
  const typeLabel =
    app.applicantType === 'international'
      ? 'International'
      : 'Local (Uzbekistan)';

  return (
    <Shell onExit={onExit}>
      {celebrate && <Confetti />}
      <div className={s.narrow}>
        <div className={s.acceptedCard}>
          <div className={s.acceptedGlow} aria-hidden />
          <div className={s.acceptedSeal}>🎉</div>
          <div className={s.acceptedEyebrow}>International Summer Camp 2026</div>
          <h1 className={s.acceptedTitle}>
            Congratulations, {firstName} — you’re in!
          </h1>
          <p className={s.acceptedLede}>
            You’ve earned your place at the International Summer Camp 2026. Out
            of a competitive field, your application stood out — we can’t wait
            to meet you this summer.
          </p>

          <div className={s.acceptedDivider}>
            <span>✦</span>
          </div>

          <div className={s.acceptedMetaRow}>
            <div className={s.acceptedMeta}>
              <span>Program</span>
              <strong>{programLabel}</strong>
            </div>
            <div className={s.acceptedMeta}>
              <span>Track</span>
              <strong>{typeLabel}</strong>
            </div>
            <div className={s.acceptedMeta}>
              <span>Status</span>
              <strong className={s.acceptedStatus}>Accepted</strong>
            </div>
          </div>

          <div className={s.acceptedNext}>
            <strong>What happens next</strong>
            Joining details, dates and logistics are on their way to your inbox.
            Keep an eye on your email — and message us on Telegram{' '}
            <a
              href="https://t.me/Top100uni_admin"
              target="_blank"
              rel="noreferrer"
            >
              @Top100uni_admin
            </a>{' '}
            if you have any questions.
          </div>

          <button
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={onExit}
            style={{ marginTop: 4 }}
          >
            Back to events
          </button>
        </div>
      </div>
    </Shell>
  );
}

/**
 * Lightweight, dependency-free confetti (CSP-safe — no external lib). Renders
 * ~90 randomized pieces that fall once via CSS keyframes.
 */
function Confetti() {
  const pieces = React.useMemo(() => {
    const colors = ['#7B1F2F', '#c99a2e', '#047857', '#b45462', '#e0b64d', '#1f7a8c'];
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 3.6 + Math.random() * 2.6,
      size: 6 + Math.random() * 7,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      round: Math.random() > 0.72,
    }));
  }, []);

  return (
    <div className={s.confetti} aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={s.confettiPiece}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Shell({ children, onExit }: { children: React.ReactNode; onExit: () => void }) {
  return (
    <div className={s.site}>
      <header className={s.appbar}>
        <div className={s.appbarBrand}>
          <span className={s.appMark}>IS</span>
          <div>
            <div className={s.appName}>International Summer Camp 2026</div>
            <div className={s.appSub}>Application</div>
          </div>
        </div>
        <button className={s.exitBtn} onClick={onExit}>
          <X size={16} /> Exit
        </button>
      </header>
      {children}
    </div>
  );
}

function Opt({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <div className={`${s.option} ${active ? s.selected : ''}`} onClick={onClick}>
      <div className={s.optionTitle}>{title}</div>
      <div className={s.optionDesc}>{desc}</div>
    </div>
  );
}

function Head({ title, required, extra }: { num?: number; title: string; required?: boolean; extra?: string }) {
  return (
    <div className={s.sectionHead}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {required && <span className={s.required}>Required</span>}
      {extra && <span className={s.required}>{extra}</span>}
    </div>
  );
}

function Field({ label, req, error, children }: { label: string; req?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className={`${s.field} ${error ? s.hasError : ''}`}>
      <label className={s.label}>
        {label} {req && <span className={s.star}>*</span>}
      </label>
      {children}
      {error && <div className={s.fieldError}>{error}</div>}
    </div>
  );
}

function Dropzone({ uploaded, fileName, onFile, onRemove, title, hint, compact }: {
  uploaded: boolean;
  fileName?: string;
  onFile: (file: File) => Promise<void>;
  onRemove?: () => void;
  title: string;
  hint: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      await onFile(file);
    } catch {
      setErr('Upload failed. Please sign in and try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // Hidden input is rendered in BOTH states so "Replace" can re-open it.
  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      style={{ display: 'none' }}
      onChange={handleChange}
    />
  );

  if (uploaded) {
    return (
      <div className={s.uploaded}>
        {input}
        <span className={s.uploadedLabel}>
          <FileCheck2 size={16} />
          {busy ? (
            'Uploading…'
          ) : (
            <span className={s.uploadedName} title={fileName || undefined}>
              {fileName || 'File uploaded'}
            </span>
          )}
        </span>
        <span className={s.uploadedActions}>
          <button type="button" className={s.uploadedAction} disabled={busy}
            onClick={() => inputRef.current?.click()}>
            Replace
          </button>
          {onRemove && (
            <button type="button" className={`${s.uploadedAction} ${s.uploadedRemove}`} disabled={busy}
              onClick={onRemove}>
              Remove
            </button>
          )}
        </span>
      </div>
    );
  }
  return (
    <div className={`${s.dropzone} ${compact ? s.dropzoneCompact : ''}`}>
      {input}
      <Upload size={compact ? 16 : 20} style={{ marginBottom: 4 }} />
      <div className={s.dropTitle}>{title}</div>
      <div className={s.dropHint}>{err ?? hint}</div>
      <button className={s.browseBtn} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Uploading…' : 'Browse files'}
      </button>
    </div>
  );
}

function WordCount({ n }: { n: number }) {
  const ok = n >= 100 && n <= 150;
  return <div className={`${s.wordCount} ${ok ? s.ok : ''}`}>{n} words · 100–150 required</div>;
}
