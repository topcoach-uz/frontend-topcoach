import styles from './full-support-leads.module.scss';
import { TrophyOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';

const APPLY_FORM_URL = 'https://forms.gle/1cf3CShA4P8HQeFo8';

const phases = [
  {
    number: '01',
    title: 'Foundation & SAT',
    timeline: 'Months 1 – 4',
    color: 'red' as const,
    items: [
      'SAT Preparation (Jan – Apr): Achieve a high score early; finish before Grade 11',
      'Admissions & Portfolio: Personal narrative + profile gap analysis',
      'Mentorship: 6 hrs/month — 2 hrs 1:1 strategy, 4 hrs EC project execution',
      'Summer Programs: Apply to 3–4 international programs',
    ],
  },
  {
    number: '02',
    title: 'The Project',
    timeline: 'Months 5 – 6',
    color: 'amber' as const,
    items: [
      'Research — write an academic paper in your field',
      'Startup — launch a business or community initiative',
      'PM Project — lead an impactful community program',
    ],
    note: 'Goal: Demonstrate leadership, impact, and innovation aligned with your intended major.',
  },
  {
    number: '03',
    title: 'Professional Summer',
    timeline: 'Jun – Aug',
    color: 'red' as const,
    items: [
      'Essay Program (Jun – Jul): Personal Statement draft by July; multiple revisions with Ivy League admits',
      'Corporate Internship (Jul – Aug): Partner company placement + professional Letter of Recommendation',
    ],
  },
  {
    number: '04',
    title: 'Application Season',
    timeline: 'Aug – Jan',
    color: 'dark' as const,
    items: [
      'Maintain a strong GPA throughout the semester',
      'Strengthen your "Spike" project with measurable results',
      'Finalize your university list with mentor guidance',
      'Full application support — PS, supplements, recommendations, platforms',
    ],
  },
];

export default function FullSupportLeadsPage() {
  return (
    <div className={styles.page}>

      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>IELTS 7+ Required</span>
            <h1 className={styles.heroTitle}>
              A 12-Month Admission Mentorship to Get You Into a{' '}
              <span className={styles.heroAccent}>Top&nbsp;100</span> University
            </h1>
            <p className={styles.heroSubtitle}>
              Structured expert guidance from SAT prep through final applications — built for students who are serious about standing out.
            </p>
            <a
              href={APPLY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroCta}
            >
              Apply Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          <div className={styles.heroImageWrap}>
            <img
              src="/img/leads.jpeg"
              alt="Work with mentors at Top universities worldwide"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      {/* ─── Phases ─── */}
      <section className={styles.phasesSection}>
        <div className={styles.inner}>
          <div className={styles.sectionLabel}>PROGRAM ROADMAP</div>
          <h2 className={styles.sectionTitle}>Your Step-by-Step Journey</h2>

          <div className={styles.phasesGrid}>
            {phases.map((phase) => (
              <div key={phase.number} className={`${styles.phaseCard} ${styles[`phase_${phase.color}`]}`}>
                <div className={styles.phaseTop}>
                  <span className={styles.phaseNumber}>{phase.number}</span>
                  <span className={styles.phaseTimeline}>{phase.timeline}</span>
                </div>
                <h3 className={styles.phaseTitle}>{phase.title}</h3>
                <ul className={styles.phaseList}>
                  {phase.items.map((item) => (
                    <li key={item}>
                      <span className={styles.checkIcon} aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {phase.note && (
                  <p className={styles.phaseNote}>{phase.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Info Grid ─── */}
      <section className={styles.infoSection}>
        <div className={styles.inner}>
          <div className={styles.infoGrid}>

            {/* Program Includes */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <div className={`${styles.infoIcon} ${styles.infoIconRed}`}>
                  <TrophyOutlined />
                </div>
                <h3 className={styles.infoCardTitle}>Program Includes</h3>
              </div>
              <ul className={styles.infoList}>
                <li><span aria-hidden>✓</span> EC & Admissions Mentor — <strong>16+ hours</strong></li>
                <li><span aria-hidden>✓</span> Essay Group Mentor</li>
                <li><span aria-hidden>✓</span> Individual Writing Mentor (Senior & Expert) — <strong>24+ hours</strong></li>
                <li><span aria-hidden>✓</span> Research Mentor</li>
                <li><span aria-hidden>✓</span> Full SAT Mentored Program</li>
              </ul>
            </div>

            {/* Who Is This For */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
                  <TeamOutlined />
                </div>
                <h3 className={styles.infoCardTitle}>Who Is This For?</h3>
              </div>
              <ul className={styles.infoList}>
                <li><span aria-hidden>✓</span> Students aiming for <strong>Top 100 universities</strong></li>
                <li><span aria-hidden>✓</span> Those seeking structured, expert guidance</li>
                <li><span aria-hidden>✓</span> Students ready for a <strong>1-year commitment</strong></li>
                <li><span aria-hidden>✓</span> Applicants who want to genuinely stand out</li>
                <li><span aria-hidden>✓</span> Students with <strong>IELTS 7+</strong></li>
              </ul>
            </div>

            {/* Important */}
            <div className={`${styles.infoCard} ${styles.infoCardWarning}`}>
              <div className={styles.infoCardHeader}>
                <div className={`${styles.infoIcon} ${styles.infoIconAmber}`}>
                  <WarningOutlined />
                </div>
                <h3 className={styles.infoCardTitle}>Important</h3>
              </div>
              <p className={styles.infoCardBody}>
                This program is <strong>selective</strong>. Submitting the form does not guarantee acceptance. All applications are carefully reviewed by our admissions team.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className={styles.ctaSection}>
        <div className={styles.inner}>
          <div className={styles.ctaBox}>
            <p className={styles.ctaEyebrow}>Limited spots available</p>
            <h2 className={styles.ctaTitle}>Ready to Start Your Journey?</h2>
            <p className={styles.ctaBody}>
              Apply now and take the first step toward your dream university.
            </p>
            <a
              href={APPLY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              Apply Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
