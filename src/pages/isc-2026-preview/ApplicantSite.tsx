// ISC 2026 — public applicant experience (self-contained mock).
// Phases: landing (Before you begin) → form (4 sections) → review → submitted.
// Designed as a focused application portal: a slim functional header
// (brand + Exit), a one-frame landing, and a form with a sticky
// progress header + sticky Back/Next bar so navigation is always visible.
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileCheck2,
  X,
  Save,
} from 'lucide-react';
import s from './applicant.module.scss';
import { IscApplicantType, IscProgram } from './types';
import {
  useGetIscConfigQuery,
  useSubmitIscApplicationMutation,
  useUploadIscDocumentMutation,
} from 'src/app/services/iscAdmissionsApi';

type Phase = 'landing' | 'form' | 'review' | 'submitted';

interface Draft {
  fullName: string;
  age: string;
  grade: string;
  passportNumber: string;
  email: string;
  phone: string;
  telegram: string;
  passportUploaded: boolean;
  passportPath: string;
  englishTest: string;
  englishScore: string;
  englishDate: string;
  englishUploaded: boolean;
  englishCertPath: string;
  satScore: string;
  satUploaded: boolean;
  satReportPath: string;
  extracurriculars: string;
  awards: string;
  whyCamp: string;
  whySelect: string;
}

const EMPTY: Draft = {
  fullName: '', age: '', grade: '', passportNumber: '', email: '', phone: '', telegram: '',
  passportUploaded: false, passportPath: '', englishTest: '', englishScore: '', englishDate: '',
  englishUploaded: false, englishCertPath: '', satScore: '', satUploaded: false, satReportPath: '',
  extracurriculars: '', awards: '', whyCamp: '', whySelect: '',
};

const SECTIONS = ['Personal info', 'Academics', 'Activities', 'Essays'];
const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Undergraduate', 'Graduate'];
const ENGLISH_TESTS = ['IELTS', 'CEFR', 'TOEFL', 'Duolingo', 'Mock result'];

function words(str: string): number {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

type Errors = Record<string, string>;

/** Required-field validation for a given section. Empty object = valid. */
function validateSection(idx: number, d: Draft): Errors {
  const e: Errors = {};
  const req = (k: keyof Draft, msg = 'This field is required') => {
    if (!String(d[k] ?? '').trim()) e[k] = msg;
  };
  if (idx === 0) {
    req('fullName');
    req('age');
    req('grade', 'Select your grade');
    req('passportNumber');
    if (!d.email.trim()) e.email = 'This field is required';
    else if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Enter a valid email address';
    req('phone');
    req('telegram');
    if (!d.passportUploaded) e.passportUploaded = 'Upload your passport photo page';
  } else if (idx === 1) {
    req('englishTest', 'Select a proficiency test');
    if (!d.englishUploaded) e.englishUploaded = 'Upload your proficiency certificate';
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
          },
          activities: { extracurriculars: draft.extracurriculars, awards: draft.awards },
          essays: { whyCamp: draft.whyCamp, whySelect: draft.whySelect },
        },
      }).unwrap();
      setPhase('submitted');
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setSubmitError(
        status === 401
          ? 'Please sign in to submit your application.'
          : 'Something went wrong submitting your application. Please try again.',
      );
    }
  };

  /** Upload one document to the backend and store its returned path in the draft. */
  const uploadAndStore = async (file: File, kind: 'passport' | 'english' | 'sat') => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadDoc(fd).unwrap();
    if (kind === 'passport') up({ passportUploaded: true, passportPath: res.path });
    else if (kind === 'english') up({ englishUploaded: true, englishCertPath: res.path });
    else up({ satUploaded: true, satReportPath: res.path });
  };

  // advance only if the current section validates
  const next = () => {
    const errs = validateSection(section, draft);
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
      const errs = validateSection(section, draft);
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setSection(i);
    }
  };

  const programLabel = program === 'master' ? "Master's program" : "Bachelor's program";
  const typeLabel =
    applicantType === 'international' ? 'International applicant' : 'Local applicant (Uzbekistan)';

  /* ── Landing ─────────────────────────────────────────────── */
  if (phase === 'landing') {
    return (
      <Shell onExit={exit}>
        <div className={s.landingWrap}>
          <div className={s.landingLeft}>
            <span className={s.eyebrow}>◷ Applications open — 2026</span>
            <h1 className={s.heroTitle}>
              International Summer Camp <b>2026</b>
            </h1>
            <p className={s.heroSub}>
              A six-week academic experience for ambitious students. Build skills, connect
              with peers from 30+ countries, and take your future to the next level.
            </p>
            <div className={s.statsStrip}>
              <div><b>6</b> weeks</div>
              <span className={s.dot} />
              <div><b>30+</b> countries</div>
              <span className={s.dot} />
              <div><b>150</b> spots</div>
            </div>
            <div className={s.deadlineInline}>Apply by March 15, 2026 · Decisions by April 10</div>
          </div>

          <div className={s.landingCard}>
            <h2 className={s.cardHead}>Before you begin</h2>
            <p className={s.cardSub}>Two quick questions so we open the right application for you.</p>

            <div className={s.qLabel}>Which program?</div>
            <div className={s.optionGrid}>
              <Opt active={program === 'bachelor'} onClick={() => setProgram('bachelor')}
                title="Bachelor's" desc="High school / pre-undergraduate" />
              <Opt active={program === 'master'} onClick={() => setProgram('master')}
                title="Master's" desc="Undergraduate / pre-postgraduate" />
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
              Applications close on <b>March 15, 2026</b>. Our admissions team will review your
              application and you'll hear back by <b>April 10, 2026</b>. A confirmation has been
              sent to <b>{draft.email || 'your email'}</b>.
            </div>
            <div className={s.successActions}>
              <button className={s.btn} onClick={() => { setDraft(EMPTY); setSection(0); setPhase('landing'); }}>
                Start over
              </button>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={exit}>Back to events</button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Review ──────────────────────────────────────────────── */
  if (phase === 'review') {
    const rows: [string, string][] = [
      ['Program', programLabel],
      ['Applying from', typeLabel],
      ['Full name', draft.fullName || '—'],
      ['Age', draft.age || '—'],
      ['Grade / year', draft.grade || '—'],
      ['Passport number', draft.passportNumber || '—'],
      ['Email', draft.email || '—'],
      ['Phone', draft.phone || '—'],
      ['Telegram', draft.telegram || '—'],
      ['English test', [draft.englishTest, draft.englishScore].filter(Boolean).join(' · ') || '—'],
      ['SAT / standardized', draft.satScore || '—'],
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
              {SECTIONS.map((label, i) => {
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
              Deadline · March 15, 2026<br />Decisions by April 10
            </div>
          </aside>

          <div className={s.formCol}>
            {section === 0 && <PersonalSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} />}
            {section === 1 && <AcademicsSection draft={draft} up={up} errors={errors} onUpload={uploadAndStore} />}
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
            <button className={s.btnGhost}><Save size={15} /> Save draft</button>
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
function PersonalSection({ draft, up, errors, onUpload }: SectionProps) {
  return (
    <div className={s.section}>
      <Head num={1} title="Personal information" required />
      <Field label="Full name" req error={errors.fullName}>
        <input className={s.input} placeholder="As it appears on your passport"
          value={draft.fullName} onChange={(e) => up({ fullName: e.target.value })} />
      </Field>
      <div className={s.fieldRow}>
        <Field label="Age" req error={errors.age}>
          <input className={s.input} placeholder="e.g. 16" value={draft.age}
            onChange={(e) => up({ age: e.target.value })} />
        </Field>
        <Field label="Current grade / year" req error={errors.grade}>
          <select className={s.select} value={draft.grade} onChange={(e) => up({ grade: e.target.value })}>
            <option value="">Select grade</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Passport number" req error={errors.passportNumber}>
          <input className={s.input} placeholder="e.g. AB1234567" value={draft.passportNumber}
            onChange={(e) => up({ passportNumber: e.target.value })} />
        </Field>
      </div>

      <div className={s.subLabel}>Contact</div>
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
        <Dropzone uploaded={draft.passportUploaded} onFile={(f) => onUpload(f, 'passport')}
          title="Scan or photo of your passport's main page"
          hint="PDF, JPG, or PNG · max 5 MB · must show name, photo, and expiry date" />
      </Field>
    </div>
  );
}

function AcademicsSection({ draft, up, errors, onUpload }: SectionProps) {
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
        <Dropzone uploaded={draft.englishUploaded} onFile={(f) => onUpload(f, 'english')}
          title="Drag and drop your file here" hint="PDF, JPG, or PNG · max 5 MB" />
      </Field>
      <div className={s.fieldRow2}>
        <Field label="SAT or other standardized tests (optional)">
          <input className={s.input} placeholder="e.g. SAT 1480, AMC 10…" value={draft.satScore}
            onChange={(e) => up({ satScore: e.target.value })} />
        </Field>
        <Field label="Upload score reports (optional)">
          <Dropzone compact uploaded={draft.satUploaded} onFile={(f) => onUpload(f, 'sat')}
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
  onUpload: (file: File, kind: 'passport' | 'english' | 'sat') => Promise<void>;
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

function Dropzone({ uploaded, onFile, title, hint, compact }: {
  uploaded: boolean;
  onFile: (file: File) => Promise<void>;
  title: string;
  hint: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (uploaded) {
    return (
      <div className={s.uploaded}>
        <FileCheck2 size={16} /> File uploaded · ready to submit
      </div>
    );
  }
  return (
    <div className={`${s.dropzone} ${compact ? s.dropzoneCompact : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={async (e) => {
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
        }}
      />
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
