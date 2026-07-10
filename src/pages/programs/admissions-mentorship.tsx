import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Aos from 'aos';
import 'aos/dist/aos.css';
import { ArrowRight, ArrowDown, FlaskConical, Rocket, HeartHandshake } from 'lucide-react';
import styles from './admissions-mentorship.module.scss';

// Same booking destination the previous (now unlinked) admissions page uses.
const BOOKING_ROUTE = '/contact-form';

const specStrip = ['6 months', '2 phases', 'Sponsored SAT', '1 portfolio project', 'Online + offline'];

const audience = [
  {
    numeral: 'i',
    label: 'Grade 8–9',
    note: 'Two to three years of runway before applications open.',
  },
  {
    numeral: 'ii',
    label: 'IELTS 6.0+ / B2 English',
    note: 'Comfortable learning and working in English.',
  },
  {
    numeral: 'iii',
    label: 'University abroad',
    note: 'Genuinely planning to study internationally.',
  },
];

// Phase 01 — Exploration & Strategic Planning (Months 1–3 · 6 hrs / mo)
const foundations = [
  {
    key: 'A',
    title: 'Understanding International Education',
    body: 'A grounded introduction to global universities, academic systems, and the opportunities open to internationally-minded students.',
  },
  {
    key: 'B',
    title: 'Portfolio Assessment',
    body: 'An honest evaluation of current achievements, extracurriculars, and strengths — a clear map of where the student stands today.',
  },
  {
    key: 'C',
    title: 'Individual Development Roadmap',
    body: 'A personalized growth plan for academic and personal development, built around the student’s own goals and pace.',
  },
  {
    key: 'D',
    title: 'Applications to International Programs',
    body: 'Hands-on support applying to 3–4 summer schools, competitions, or international programs.',
  },
  {
    key: 'E',
    title: 'Academic & Career Path Selection',
    body: 'Guidance to identify suitable academic fields and future career directions early, before they narrow.',
  },
  {
    key: 'F',
    title: 'SAT Preparation',
    body: 'A 3-month SAT course, online or offline, fully sponsored by TopCoach and delivered by a partner organization.',
  },
];

// Phase 02 — Portfolio Project Development (Months 4–6 · 4 hrs / mo)
const pathways = [
  {
    id: 'research',
    accent: 'research' as const,
    number: '01',
    icon: <FlaskConical size={22} />,
    title: 'Research',
    body: 'Plan and conduct an academic research project or paper with a specialized mentor in the field.',
    outcome: 'A finished research paper',
  },
  {
    id: 'venture',
    accent: 'venture' as const,
    number: '02',
    icon: <Rocket size={22} />,
    title: 'Entrepreneurship',
    body: 'Shape a business idea into a workable plan and a first prototype — concept to something tangible.',
    outcome: 'A validated prototype',
  },
  {
    id: 'impact',
    accent: 'impact' as const,
    number: '03',
    icon: <HeartHandshake size={22} />,
    title: 'Impact Project',
    body: 'Design and run a social, educational, or technology-driven project that creates measurable impact.',
    outcome: 'A program that ran',
  },
];

const outcomes = [
  {
    n: '01',
    title: 'Early-start advantage',
    body: 'Beginning in Grade 8–9 buys 2–3 years to build a genuinely strong application profile.',
  },
  {
    n: '02',
    title: 'Personalized mentorship',
    body: 'One-on-one guidance tuned to the student’s own goals, strengths, and interests.',
  },
  {
    n: '03',
    title: 'Sponsored SAT prep',
    body: 'A fully funded 3-month SAT preparation course, covered by TopCoach.',
  },
  {
    n: '04',
    title: 'A finished project',
    body: 'A completed, university-ready portfolio project by the end of the program.',
  },
  {
    n: '05',
    title: 'A real admissions plan',
    body: 'A personalized roadmap for international university admissions.',
  },
  {
    n: '06',
    title: 'Global exposure',
    body: 'Support with summer programs, academic competitions, and international opportunities.',
  },
];

const AdmissionsMentorshipPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admissions Mentorship Program — Top Coach';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Aos.init({
      easing: 'ease-out-cubic',
      once: true,
      offset: 40,
      duration: 700,
      disable: reduce,
    });
    // Route is lazy-loaded; recompute positions after this page paints.
    const id = window.setTimeout(() => Aos.refresh(), 120);
    return () => window.clearTimeout(id);
  }, []);

  const book = () => navigate(BOOKING_ROUTE);
  const toRoadmap = () => {
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className={styles.page}>
      {/* ─── Hero — editorial cover ─── */}
      <section className={styles.hero}>
        <div className={styles.inner}>
          <p className={styles.kicker}>
            <span>Admissions Mentorship</span>
            <span className={styles.kickerDot} />
            <span>Early Start Track</span>
          </p>

          <h1 className={styles.heroTitle}>
            Six months to build the profile{' '}
            <span className={styles.heroMark}>top universities</span> notice.
          </h1>

          <p className={styles.heroLede}>
            A structured mentorship program for Grade 8–9 students — two phases, a sponsored
            SAT, and a finished portfolio project — turning an early start into a real
            admissions advantage.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.btnPrimary} onClick={book}>
              Book a free consultation <ArrowRight size={16} />
            </button>
            <button type="button" className={styles.btnGhost} onClick={toRoadmap}>
              See the 6-month plan <ArrowDown size={15} />
            </button>
          </div>
        </div>

        <div className={styles.specStrip}>
          <div className={styles.inner}>
            <ul className={styles.specList}>
              {specStrip.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className={styles.specTail}>For 2028–2029 admissions</span>
          </div>
        </div>
      </section>

      {/* ─── Who it's for — editorial two-column ─── */}
      <section className={styles.who}>
        <div className={styles.inner}>
          <div className={styles.whoGrid}>
            <div className={styles.whoLede} data-aos="fade-up">
              <span className={styles.eyebrow}>Who it’s for</span>
              <h2 className={styles.whoStatement}>
                Built for the student who starts before they have to.
              </h2>
              <p className={styles.whoNote}>
                The earlier the profile takes shape, the more range a student has when
                applications finally open.
              </p>
            </div>

            <ul className={styles.criteria}>
              {audience.map((c, i) => (
                <li key={c.numeral} data-aos="fade-up" data-aos-delay={i * 90}>
                  <span className={styles.criteriaNum}>{c.numeral}</span>
                  <div>
                    <h3 className={styles.criteriaLabel}>{c.label}</h3>
                    <p className={styles.criteriaNote}>{c.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Phase 01 — syllabus index on a rail ─── */}
      <section className={styles.phaseOne} id="roadmap">
        <div className={styles.inner}>
          <header className={styles.phaseHead} data-aos="fade-up">
            <div className={styles.phaseHeadTop}>
              <span className={styles.phaseTag}>Phase 01</span>
              <span className={styles.phaseMeta}>Months 1–3 · 6 hours of mentorship / month</span>
            </div>
            <h2 className={styles.phaseTitle}>Exploration &amp; Strategic Planning</h2>
            <p className={styles.phaseIntro}>
              Three months to understand the landscape, map the student honestly, and lock
              in the fundamentals.
            </p>
          </header>

          <ol className={styles.syllabus}>
            {foundations.map((item, i) => (
              <li key={item.key} className={styles.row} data-aos="fade-up" data-aos-delay={i * 60}>
                <span className={styles.rowKey}>{item.key}</span>
                <div className={styles.rowText}>
                  <h3 className={styles.rowTitle}>{item.title}</h3>
                  <p className={styles.rowBody}>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Phase 02 — pathway cards (the color moment) ─── */}
      <section className={styles.phaseTwo}>
        <div className={styles.inner}>
          <header className={styles.phaseHead} data-aos="fade-up">
            <div className={styles.phaseHeadTop}>
              <span className={styles.phaseTag}>Phase 02</span>
              <span className={styles.phaseMeta}>Months 4–6 · 4 hours online / month</span>
            </div>
            <h2 className={styles.phaseTitle}>Build one real project</h2>
            <p className={styles.phaseIntro}>
              The student chooses one pathway and works with a mentor matched to it. Every
              path ends in something real.
            </p>
          </header>

          <div className={styles.pathGrid}>
            {pathways.map((p, i) => (
              <article
                key={p.id}
                className={`${styles.pathCard} ${styles[`accent_${p.accent}`]}`}
                data-aos="fade-up"
                data-aos-delay={i * 110}
              >
                <div className={styles.pathCap}>
                  <span className={styles.pathIcon}>{p.icon}</span>
                  <span className={styles.pathNumber}>{p.number}</span>
                </div>
                <div className={styles.pathBody}>
                  <h3 className={styles.pathTitle}>{p.title}</h3>
                  <p className={styles.pathText}>{p.body}</p>
                  <div className={styles.pathOutcome}>
                    <span>Ends in</span>
                    {p.outcome}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Outcomes — spec-sheet ledger ─── */}
      <section className={styles.outcomes}>
        <div className={styles.inner}>
          <header className={styles.outcomesHead} data-aos="fade-up">
            <span className={styles.eyebrow}>The outcome</span>
            <h2 className={styles.outcomesTitle}>What the six months add up to</h2>
          </header>

          <div className={styles.ledger}>
            {outcomes.map((o, i) => (
              <div key={o.n} className={styles.ledgerRow} data-aos="fade-up" data-aos-delay={(i % 2) * 80}>
                <span className={styles.ledgerNum}>{o.n}</span>
                <h3 className={styles.ledgerTitle}>{o.title}</h3>
                <p className={styles.ledgerBody}>{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA — the single dark moment ─── */}
      <section className={styles.cta}>
        <div className={styles.inner}>
          <div className={styles.ctaBox} data-aos="fade-up">
            <span className={styles.ctaEyebrow}>Grade 8–9 · Early start</span>
            <h2 className={styles.ctaTitle}>Book a free consultation</h2>
            <p className={styles.ctaBody}>
              We’ll look at the student’s year, level, and goals — and show exactly how the
              program builds toward a top university.
            </p>
            <button type="button" className={styles.ctaBtn} onClick={book}>
              Book a free consultation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdmissionsMentorshipPage;
