import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './whatWeOffer.module.scss';

/**
 * Cards used to render icons/images next to the label.
 * UX request: show labels only (no icons/images).
 */
const cards = [
  {
    id: 'mentorship',
    label: 'PERSONALISED MENTORSHIP',
    icon: 'user-graduate' as const,
    image: '/img/what-we-offer-mentorship.png',
    title: '1:1 sessions with top mentors',
    description: 'Work one-on-one with mentors from Stanford, Harvard, MIT and other world-leading universities.',
    universities: ['Stanford', 'Harvard', 'MIT'],
    bullets: [
      'Weekly strategy and accountability',
      'Essay, profile, and SAT support',
      'Built around your goals and timeline',
    ],
  },
  {
    id: 'community',
    label: 'TOPCOACH COMMUNITY',
    icon: 'users' as const,
    image: '/img/what-we-offer-community.png',
    title: 'Learn with peers',
    description: 'Join a vibrant community of ambitious students and experienced mentors.',
    bullets: [
      'Live workshops and events',
      'Access to past admits and mentors',
      'Private community for questions & wins',
    ],
  },
  {
    id: 'schools',
    label: 'FOR SCHOOLS',
    icon: 'school' as const,
    image: '/img/what-we-offer-school.png',
    title: 'School-wide programs',
    description: 'Bring TopCoach mentorship to your entire school or institution.',
    bullets: [
      'School-wide mentorship programs',
      'Support for counselors and administrators',
      'Workshops & info sessions for families',
    ],
  },
];

export default function WhatWeOfferSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const sectionTop = -rect.top;
    const sectionHeight = section.offsetHeight - window.innerHeight;

    if (sectionTop < 0 || sectionHeight <= 0) {
      setActiveIndex(0);
      return;
    }

    const progress = Math.min(1, Math.max(0, sectionTop / sectionHeight));
    const idx = Math.min(cards.length - 1, Math.floor(progress * cards.length));
    setActiveIndex(idx);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.sticky}>
        <div className={styles.inner}>
          {/* Left: header text */}
          <div className={styles.left}>
            <p className={styles.kicker}>What we offer</p>
            <h2 className={styles.title}>
              A complete admissions ecosystem for students, mentors, schools, and parents.
            </h2>
            <p className={styles.subtitle}>
              Choose how you want to work with TopCoach — from 1:1 mentorship to full-school solutions.
            </p>

            {/* Progress dots */}
            <div className={styles.dots}>
              {cards.map((c, i) => (
                <span
                  key={c.id}
                  className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Right: card that swaps on scroll */}
          <div className={styles.right}>
            <div className={styles.cardContainer}>
              {cards.map((c, i) => (
                <article
                  key={c.id}
                  className={`${styles.card} ${i === activeIndex ? styles.cardVisible : ''}`}
                  data-card={c.id}
                >
                  <span className={styles.cardLabel}>{c.label}</span>
                  <h3 className={styles.cardTitle}>{c.title}</h3>
                  <p className={styles.cardDescription}>{c.description}</p>
                  {c.universities && (
                    <div className={styles.universities}>
                      {c.universities.map((u) => (
                        <span key={u} className={styles.universityBadge}>{u}</span>
                      ))}
                    </div>
                  )}
                  <ul className={styles.list}>
                    {c.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
