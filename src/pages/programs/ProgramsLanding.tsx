import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Target,
  FlaskConical,
  Briefcase,
  Clock,
  CircleDollarSign,
  GitBranch,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import styles from './ProgramsLanding.module.scss';

type Accent = 'flagship' | 'early' | 'research' | 'bootcamp' | 'masters';

interface Chip {
  icon: React.ReactNode;
  label: string;
}

interface Program {
  id: string;
  accent: Accent;
  flag: string;
  duration: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  /** Cover art in public/img. Falls back to the accent gradient when absent. */
  image?: string;
  chips: Chip[];
  statValue: string;
  statLabel: string;
  comingSoon?: boolean;
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
    flag: 'Flagship',
    duration: '12 months',
    eyebrow: 'Mentorship · Grade 10',
    title: 'Full Support Mentorship',
    description:
      'A 12-month strategic roadmap for Grade 10 students — SAT, a research project, a finished essay draft, and full application support, phased across the year.',
    href: '/programs/full-support',
    chips: [
      { icon: <Target size={13} />, label: 'Early SAT' },
      { icon: <FlaskConical size={13} />, label: 'Research project' },
      { icon: <FileText size={13} />, label: 'Essay by July' },
    ],
    statValue: '26+',
    statLabel: 'hours of 1:1 mentorship',
  },
  {
    id: 'admissions',
    accent: 'early',
    flag: 'Early Start',
    duration: '6 months',
    eyebrow: 'Early Admissions · Grade 8–9',
    title: 'Admissions Mentorship',
    description:
      'A two-phase head start for Grade 8–9 students — explore global universities, then build a university-ready portfolio project with a mentor.',
    href: '/programs/admissions-mentorship',
    image: '/img/admissions.jpeg',
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
    flag: 'Research',
    duration: '12 weeks',
    eyebrow: 'Academic Research · Grades 8–12',
    title: 'Research Program',
    description:
      'An intensive 12-week path from research question to a finished paper, one-on-one with an experienced academic mentor.',
    href: '/programs/research',
    image: '/img/research_program.jpeg',
    chips: [
      { icon: <Users size={13} />, label: '12 hrs 1:1' },
      { icon: <Layers size={13} />, label: '3 phases' },
      { icon: <FileText size={13} />, label: 'Final paper' },
    ],
    statValue: '1',
    statLabel: 'completed research paper',
  },
  {
    id: 'writing-bootcamp',
    accent: 'bootcamp',
    flag: 'Boot Camp',
    duration: 'Coming soon',
    eyebrow: 'Application Writing',
    title: 'Writing Boot Camp',
    description:
      'An intensive sprint to draft, refine, and polish your application essays with expert coaches. Full details coming soon.',
    href: '',
    image: '/img/writing_bootcamp.jpeg',
    comingSoon: true,
    chips: [
      { icon: <FileText size={13} />, label: 'Essay sprints' },
      { icon: <Users size={13} />, label: 'Expert review' },
    ],
    statValue: '',
    statLabel: '',
  },
  {
    id: 'masters-mba',
    accent: 'masters',
    flag: 'Graduate',
    duration: 'Coming soon',
    eyebrow: "Master's & MBA",
    title: "Master's & MBA Admissions",
    description:
      'Strategic guidance for graduate and MBA applicants — school selection, essays, and interview prep. Full details coming soon.',
    href: '',
    image: '/img/masters_mba.jpeg',
    comingSoon: true,
    chips: [
      { icon: <Target size={13} />, label: 'School list' },
      { icon: <Briefcase size={13} />, label: 'Interview prep' },
    ],
    statValue: '',
    statLabel: '',
  },
];

const ProgramsLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Programs - Top Coach';
  }, []);

  const activeCount = PROGRAMS.filter((p) => !p.comingSoon).length;
  const soonCount = PROGRAMS.length - activeCount;

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        {/* Editorial masthead */}
        <header className={styles.header}>
          <div className={styles.metaRow}>
            <span className={styles.metaLeft}>The Catalog / 2026</span>
            <span className={styles.metaRule} />
            <span className={styles.metaRight}>
              {activeCount} active
              {soonCount > 0 ? ` · ${soonCount} coming soon` : ''}
            </span>
          </div>

          <div className={styles.masthead}>
            <h1 className={styles.title}>
              Programs<span className={styles.period}>.</span>
            </h1>
          </div>
        </header>

        {/* Catalog grid */}
        <div className={styles.grid}>
          {PROGRAMS.map((program) => {
            const isSoon = !!program.comingSoon;
            const go = () => {
              if (!isSoon && program.href) navigate(program.href);
            };
            return (
              <article
                key={program.id}
                className={`${styles.card} ${styles[program.accent]} ${
                  isSoon ? styles.comingSoon : ''
                }`}
                onClick={go}
                role={isSoon ? undefined : 'button'}
                tabIndex={isSoon ? -1 : 0}
                aria-disabled={isSoon || undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') go();
                }}
              >
                <div
                  className={`${styles.cardVisual} ${
                    program.image ? styles.hasImage : ''
                  }`}
                >
                  {program.image && (
                    <img
                      className={styles.cover}
                      src={program.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <span className={styles.flag}>{program.flag}</span>
                  {isSoon ? (
                    <span className={styles.soonBadge}>Coming soon</span>
                  ) : (
                    <span className={styles.duration}>
                      <Calendar size={13} />
                      {program.duration}
                    </span>
                  )}
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
                    {isSoon ? (
                      <span className={styles.soonNote}>Details announced soon</span>
                    ) : (
                      <>
                        <span className={styles.stat}>
                          <strong>{program.statValue}</strong>
                          <em>{program.statLabel}</em>
                        </span>
                        <span className={styles.viewLink}>
                          View program <ArrowRight size={16} />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
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
