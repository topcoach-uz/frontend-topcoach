import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Lock,
  Target,
  Rocket,
  Briefcase,
} from 'lucide-react';
import styles from './ProgramsLanding.module.scss';

interface Chip {
  icon: React.ReactNode;
  label: string;
}

interface Program {
  id: string;
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
 * Adding a program is just another object here. Empty grid slots are
 * filled with "coming soon" placeholders below.
 */
const PROGRAMS: Program[] = [
  {
    id: 'full-support',
    edition: 'No. 01',
    flag: 'Flagship',
    duration: '12 months',
    eyebrow: 'Mentorship · Class of 2031',
    title: 'Full Support Mentorship',
    description:
      'A personal admissions desk for students applying to the world’s top universities — from SAT spike to submitted application.',
    href: '/programs/full-support',
    chips: [
      { icon: <Target size={13} />, label: 'SAT spike' },
      { icon: <Rocket size={13} />, label: 'Standout project' },
      { icon: <Briefcase size={13} />, label: 'Internship' },
    ],
    statValue: '24+',
    statLabel: 'hours of 1:1 mentorship',
  },
];

// Number of "coming soon" placeholders to render after the active programs.
const PLACEHOLDER_SLOTS = 2;

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
            <span className={styles.metaRight}>
              {activeCount} active · more in development
            </span>
          </div>

          <div className={styles.masthead}>
            <h1 className={styles.title}>
              Programs<span className={styles.period}>.</span>
            </h1>
            <p className={styles.lede}>
              Structured, mentor-led paths from where you are today to the day
              you hit submit. Each program is milestone-gated and built around a
              finish line.
            </p>
          </div>
        </header>

        {/* Catalog grid */}
        <div className={styles.grid}>
          {PROGRAMS.map((program) => (
            <article
              key={program.id}
              className={styles.card}
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

          {/* Coming-soon placeholders fill the rest of the grid */}
          {Array.from({ length: PLACEHOLDER_SLOTS }).map((_, i) => (
            <div key={`soon-${i}`} className={styles.soonCard}>
              <span className={styles.soonIcon}>
                <Lock size={20} />
              </span>
              <h3 className={styles.soonTitle}>Coming soon</h3>
              <p className={styles.soonCaption}>New program in development</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ProgramsLanding;
