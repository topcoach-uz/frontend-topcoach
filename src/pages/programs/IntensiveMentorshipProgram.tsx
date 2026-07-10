import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aos from 'aos';
import 'aos/dist/aos.css';
import { ArrowRight, ArrowLeft, ArrowDown, ChevronDown, Check } from 'lucide-react';
import styles from './IntensiveMentorshipProgram.module.scss';

const APPLY_URL = 'https://forms.gle/qTLqfZ9YcvZDqzx1A';

type Accent = 'sat' | 'research' | 'essay' | 'apps';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Gantt bands — start/end are inclusive 1-indexed months (Jan…Dec).
const TIMELINE: { label: string; start: number; end: number; accent: Accent }[] = [
  { label: 'Foundations & SAT', start: 1, end: 4, accent: 'sat' },
  { label: 'Research Program', start: 4, end: 6, accent: 'research' },
  { label: 'Summer Prep · Essays', start: 7, end: 8, accent: 'essay' },
  { label: 'Application Season', start: 8, end: 12, accent: 'apps' },
];

interface Chapter {
  num: string;
  range: string;
  accent: Accent;
  title: string;
  lead: string;
  stat: string;
  statLabel: string;
  points: string[];
}

const CHAPTERS: Chapter[] = [
  {
    num: '01',
    range: 'Months 1–3',
    accent: 'sat',
    title: 'Foundations & SAT',
    lead: 'Lock in a high SAT score early and start building the profile from day one.',
    stat: '6 hrs',
    statLabel: 'mentorship / month',
    points: [
      'Intensive SAT prep across Months 1–4 to secure a high score early',
      'Admissions Program modules — define your narrative, audit your portfolio for gaps',
      'Monthly 6 hours split: 2 hrs 1:1 strategy, 4 hrs on ECs & projects',
      'Apply to 3–4 international summer programs',
    ],
  },
  {
    num: '02',
    range: 'Months 4–6',
    accent: 'research',
    title: 'Research Program',
    lead: 'Turn curiosity into a finished research project you own end to end.',
    stat: '8 hrs',
    statLabel: '1:1 research mentorship',
    points: [
      '8-week program — from research fundamentals to a finished project',
      'Delve into your own academic area of interest',
      '8 hours of individual 1:1 mentorship',
      'A completed research project by the end of the phase',
    ],
  },
  {
    num: '03',
    range: 'Months 7–8',
    accent: 'essay',
    title: 'Summer Prep — Essays',
    lead: 'Write the Personal Statement while everyone else is still waiting.',
    stat: 'July',
    statLabel: 'draft finished',
    points: [
      'Essay Program (June–July): Personal Statement draft done by July',
      'Finish early, then refine across multiple rounds',
      'Built with foreign experts & admissions officers',
      'A full season ahead of peers who wait until Grade 12',
    ],
  },
  {
    num: '04',
    range: 'Months 8–12',
    accent: 'apps',
    title: 'Application Season',
    lead: 'Everything ready — now apply from strength, not from a scramble.',
    stat: 'Full',
    statLabel: 'application support',
    points: [
      'Core pieces done — SAT, research, and essay draft in hand',
      'Focus shifts to maintaining a strong GPA',
      'Finalize your college list with your mentor',
      'Supplemental essays, recommendations & final submission',
    ],
  },
];

const TRUTHS = [
  { label: 'Grade level', text: 'Grade 10, starting a full year ahead of the pack.' },
  { label: 'Ambition', text: 'Serious about admission to top-tier universities.' },
  { label: 'Mindset', text: 'Ready to build a real profile, not a checklist.' },
];

const DELIVERABLES = [
  { kicker: 'Locked by spring', title: 'A competitive SAT score' },
  { kicker: 'Yours, start to finish', title: 'A finished research project' },
  { kicker: 'Drafted by July', title: 'A polished Personal Statement' },
  { kicker: 'Essays · supplements · recs', title: 'A complete application' },
];

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: 'Who is this program designed for?',
    a: 'Grade 10 students who are serious about admission to top-tier universities and want a full 12-month head start on the process.',
  },
  {
    q: 'What makes this program different?',
    a: 'We finish the hard parts early — a high SAT score in the spring, a completed research project by summer, and a Personal Statement draft by July — so application season is about refinement, not scrambling.',
  },
  {
    q: 'How is the mentorship structured?',
    a: 'In Phase 1 you get 6 hours a month, split into 2 hours of 1:1 strategy and 4 hours of hands-on EC and project work. Phase 2 adds 8 hours of individual research mentorship, with continued 1:1 support through application season.',
  },
  {
    q: 'When does the essay work happen?',
    a: 'The essay program runs June–July, developed together with foreign experts and admissions officers, so your Personal Statement draft is ready by July with room for multiple rounds of refinement.',
  },
];

const IntensiveMentorshipProgram: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'Full Support Mentorship — Top Coach';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Aos.init({ easing: 'ease-out-cubic', once: true, offset: 40, duration: 700, disable: reduce });
    const id = window.setTimeout(() => Aos.refresh(), 120);
    return () => window.clearTimeout(id);
  }, []);

  const apply = () => window.open(APPLY_URL, '_blank');
  const toRoadmap = () =>
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main className={styles.page}>
      {/* ─── Hero — the 12-month gantt ─── */}
      <section className={styles.hero}>
        <div className={styles.inner}>
          <button type="button" className={styles.back} onClick={() => navigate('/programs')}>
            <ArrowLeft size={14} /> All programs
          </button>

          <p className={styles.kicker}>
            <span>Full Support</span>
            <span className={styles.dot} />
            <span>Flagship · Grade 10</span>
          </p>

          <h1 className={styles.heroTitle}>
            One year. Four phases. <br />
            A <span className={styles.mark}>finished application.</span>
          </h1>

          <p className={styles.heroLede}>
            A personalized 12-month roadmap for Grade 10 students — SAT, a research project, a
            Personal Statement draft, and full application support, sequenced so the hardest work
            is done before senior year even begins.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.btnPrimary} onClick={apply}>
              Apply now <ArrowRight size={16} />
            </button>
            <button type="button" className={styles.btnGhost} onClick={toRoadmap}>
              See the roadmap <ArrowDown size={15} />
            </button>
          </div>

          {/* Gantt */}
          <div className={styles.gantt}>
            <div className={styles.ganttAxis}>
              <span className={styles.ganttSpacer} />
              <div className={styles.ganttMonths}>
                {MONTHS.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>
            {TIMELINE.map((band, i) => {
              const left = ((band.start - 1) / 12) * 100;
              const width = ((band.end - band.start + 1) / 12) * 100;
              return (
                <div key={band.label} className={styles.ganttRow}>
                  <span className={styles.ganttLabel}>{band.label}</span>
                  <div className={styles.ganttTrack}>
                    <span
                      className={`${styles.ganttBar} ${styles[`bar_${band.accent}`]}`}
                      style={{ left: `${left}%`, width: `${width}%`, animationDelay: `${0.5 + i * 0.14}s` }}
                    >
                      <em>{`M${band.start}–${band.end}`}</em>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Roadmap — expanded chapters on a rail ─── */}
      <section className={styles.roadmap} id="roadmap">
        <div className={styles.inner}>
          <header className={styles.secHead} data-aos="fade-up">
            <span className={styles.eyebrow}>The roadmap</span>
            <h2 className={styles.secTitle}>Four phases, each set up by the last.</h2>
          </header>

          <div className={styles.chapters}>
            {CHAPTERS.map((c, i) => (
              <article
                key={c.num}
                className={`${styles.chapter} ${styles[`edge_${c.accent}`]}`}
                data-aos="fade-up"
                data-aos-delay={i * 60}
              >
                <div className={styles.chapterAside}>
                  <span className={`${styles.chapterNum} ${styles[`num_${c.accent}`]}`}>{c.num}</span>
                  <span className={styles.chapterRange}>{c.range}</span>
                  <div className={styles.chapterStat}>
                    <strong>{c.stat}</strong>
                    <span>{c.statLabel}</span>
                  </div>
                </div>
                <div className={styles.chapterMain}>
                  <h3 className={styles.chapterTitle}>{c.title}</h3>
                  <p className={styles.chapterLead}>{c.lead}</p>
                  <ul className={styles.chapterList}>
                    {c.points.map((p) => (
                      <li key={p}>
                        <Check size={15} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who it's for — 3 truths band ─── */}
      <section className={styles.truths}>
        <div className={styles.inner}>
          <span className={styles.eyebrow} data-aos="fade-up">
            Who it’s for
          </span>
          <div className={styles.truthGrid}>
            {TRUTHS.map((t, i) => (
              <div key={t.label} className={styles.truth} data-aos="fade-up" data-aos-delay={i * 90}>
                <span className={styles.truthLabel}>{t.label}</span>
                <p className={styles.truthText}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Deliverables — outline cards ─── */}
      <section className={styles.deliver}>
        <div className={styles.inner}>
          <header className={styles.secHead} data-aos="fade-up">
            <span className={styles.eyebrow}>By the end</span>
            <h2 className={styles.secTitle}>What you walk away holding.</h2>
          </header>
          <div className={styles.deliverGrid}>
            {DELIVERABLES.map((d, i) => (
              <div key={d.title} className={styles.deliverCard} data-aos="fade-up" data-aos-delay={i * 80}>
                <span className={styles.deliverIndex}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.deliverKicker}>{d.kicker}</span>
                <h3 className={styles.deliverTitle}>{d.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className={styles.faq}>
        <div className={styles.inner}>
          <header className={styles.secHead} data-aos="fade-up">
            <span className={styles.eyebrow}>Before you apply</span>
            <h2 className={styles.secTitle}>Questions students ask.</h2>
          </header>
          <div className={styles.faqList} data-aos="fade-up">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
                  <button type="button" className={styles.faqQ} onClick={() => setOpenFaq(open ? null : i)}>
                    <span className={styles.faqNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.faqText}>{faq.q}</span>
                    <ChevronDown size={18} className={styles.faqChevron} />
                  </button>
                  <div className={styles.faqAWrap} hidden={!open}>
                    <p className={styles.faqA}>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA — dark moment ─── */}
      <section className={styles.cta}>
        <div className={styles.inner}>
          <div className={styles.ctaBox} data-aos="fade-up">
            <span className={styles.ctaEyebrow}>2026 intake open · Grade 10</span>
            <h2 className={styles.ctaTitle}>Start the year that changes the application.</h2>
            <p className={styles.ctaBody}>
              Twelve months, fully mentored, ending in a submitted application you’re proud of.
            </p>
            <button type="button" className={styles.ctaBtn} onClick={apply}>
              Apply now <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default IntensiveMentorshipProgram;
