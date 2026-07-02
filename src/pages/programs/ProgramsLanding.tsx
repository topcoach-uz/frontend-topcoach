import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Target,
  Rocket,
  Briefcase,
  Clock,
  CircleDollarSign,
  GitBranch,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import styles from './ProgramsLanding.module.scss';

type Accent = 'flagship' | 'early' | 'research';

interface Chip {
  icon: React.ReactNode;
  label: string;
}

interface Program {
  id: string;
  accent: Accent;
  edition: string;
  flag: string;
  duration: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  chips: Chip[];
  statValue: string;
  statLabel: string;
}

/**
 * Active program catalog. Each entry renders as a flagship-style card.
 * Adding a program is just another object here. The `accent` controls the
 * coloured header treatment (maroon / navy / green).
 */
const PROGRAMS: Program[] = [
  {
    id: 'full-support',
    accent: 'flagship',
    edition: 'Vol. 04 / 01',
    flag: 'Flagship',
    duration: '12 months',
    eyebrow: 'Mentorship · Class of 2031',
    title: 'Full Support Mentorship',
    description:
      'A personalized strategic roadmap for students applying for the class of 2031 — from SAT prep to application submission.',
    href: '/programs/full-support',
    chips: [
      { icon: <Target size={13} />, label: 'SAT spike' },
      { icon: <Rocket size={13} />, label: 'Standout project' },
      { icon: <Briefcase size={13} />, label: 'Internship' },
    ],
    statValue: '24+',
    statLabel: 'hours of 1:1 mentorship',
  },
  {
    id: 'admissions',
    accent: 'early',
    edition: 'Vol. 04 / 02',
    flag: 'Early Start',
    duration: '6 months',
    eyebrow: 'Early Admissions · Grade 8–9',
    title: 'Admissions Program',
    description:
      'A two-phase head start for Grade 8–9 students — explore global universities, then build a university-ready portfolio project.',
    href: '/programs/admissions',
    chips: [
      { icon: <Clock size={13} />, label: '6 hrs / mo' },
      { icon: <CircleDollarSign size={13} />, label: 'Sponsored SAT' },
      { icon: <GitBranch size={13} />, label: '3 pathways' },
    ],
    statValue: '2–3 yrs',
    statLabel: 'profile head start',
  },
  {
    id: 'research',
    accent: 'research',
    edition: 'Vol. 04 / 03',
    flag: 'Research',
    duration: '12 weeks',
    eyebrow: 'Academic Research · Grades 8–12',
    title: 'Research Program',
    description:
      'An intensive 12-week path from research question to a finished paper, one-on-one with an experienced academic mentor.',
    href: '/programs/research',
    chips: [
      { icon: <Users size={13} />, label: '12 hrs 1:1' },
      { icon: <Layers size={13} />, label: '3 phases' },
      { icon: <FileText size={13} />, label: 'Final paper' },
    ],
    statValue: '1',
    statLabel: 'completed research paper',
  },
];

const ProgramsLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Programs - Top Coach';
  }, []);

  const activeCount = PROGRAMS.length;

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        {/* Editorial masthead */}
        <header className={styles.header}>
          <div className={styles.metaRow}>
            <span className={styles.metaLeft}>The Catalog / 2026</span>
            <span className={styles.metaRule} />
            <span className={styles.metaRight}>{activeCount} active programs</span>
          </div>

          <div className={styles.masthead}>
            <h1 className={styles.title}>
              Programs<span className={styles.period}>.</span>
            </h1>
          </div>
        </header>

        {/* Catalog grid */}
        <div className={styles.grid}>
          {PROGRAMS.map((program) => (
            <article
              key={program.id}
              className={`${styles.card} ${styles[program.accent]}`}
              onClick={() => navigate(program.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(program.href);
              }}
            >
              <div className={styles.cardVisual}>
                <span className={styles.flag}>{program.flag}</span>
                <span className={styles.duration}>
                  <Calendar size={13} />
                  {program.duration}
                </span>
                <span className={styles.edition}>{program.edition}</span>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.eyebrow}>{program.eyebrow}</span>
                <h2 className={styles.cardTitle}>{program.title}</h2>
                <p className={styles.cardDesc}>{program.description}</p>

                <div className={styles.chipRow}>
                  {program.chips.map((chip) => (
                    <span key={chip.label} className={styles.chip}>
                      {chip.icon}
                      {chip.label}
                    </span>
                  ))}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.stat}>
                    <strong>{program.statValue}</strong>
                    <em>{program.statLabel}</em>
                  </span>
                  <span className={styles.viewLink}>
                    View program <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Closing CTA — strategy call */}
        <aside className={styles.cta}>
          <div className={styles.ctaCopy}>
            <h3 className={styles.ctaTitle}>Not sure which path fits?</h3>
            <p className={styles.ctaText}>
              Book a free 20-minute strategy call. We’ll look at your year, your
              scores, and your target schools, and tell you honestly which
              program is right for you.
            </p>
          </div>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => navigate('/contact')}
          >
            Book a strategy call <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </main>
  );
};

export default ProgramsLanding;
