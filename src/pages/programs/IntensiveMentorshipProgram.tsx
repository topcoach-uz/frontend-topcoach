import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  Trophy,
  Rocket,
} from 'lucide-react';
import './IntensiveMentorshipProgram.scss';

const APPLY_URL = 'https://forms.gle/qTLqfZ9YcvZDqzx1A';

interface Phase {
  index: string;
  weeks: string;
  title: string;
  items: string[];
}

interface Faq {
  q: string;
  a: string;
}

const WHO_ITS_FOR = [
  { icon: <GraduationCap size={18} />, text: 'Students applying for the class of 2031.' },
  { icon: <Trophy size={18} />, text: 'Serious about admission to top-tier universities.' },
  { icon: <Rocket size={18} />, text: 'Ready to get ahead and build a profile early.' },
];

const PHASES: Phase[] = [
  {
    index: '1',
    weeks: 'Months 1–4',
    title: 'The Foundation & SAT Spike',
    items: [
      'Intensive SAT prep and early testing',
      '16+ hours of extracurricular & profile building',
      'Strategic summer program applications',
      'Foundation for academic excellence',
    ],
  },
  {
    index: '2',
    weeks: 'Months 4–6',
    title: 'The Project',
    items: [
      'Specialized track selection',
      'Research paper or startup mentorship',
      'Build your standout project',
      'Develop deep academic interest',
    ],
  },
  {
    index: '3',
    weeks: 'Months 6–8',
    title: 'The Professional Summer',
    items: [
      'Personal statement completion',
      'Multiple refinement rounds',
      'Corporate internship placement',
      'Professional recommendation letters',
    ],
  },
  {
    index: '4',
    weeks: 'Months 9–12',
    title: 'Application Season',
    items: [
      'Finalize strategic college list',
      'Complete all application essays',
      '24+ hours of personalized mentorship',
      'Final review and submission',
    ],
  },
];

const FAQS: Faq[] = [
  {
    q: 'Who is this program designed for?',
    a: 'This program is designed for students applying for class of 2031 who are serious about securing admission to top-tier universities and want to get ahead early.',
  },
  {
    q: 'What makes this program different?',
    a: 'We start early, include a corporate internship, and focus on building a “spike” — deep expertise in one area rather than shallow participation — across a single 12-month, mentor-led roadmap.',
  },
  {
    q: 'Are internships included?',
    a: 'Yes. We have secured contracts with partner organizations, and every student is placed in a professional internship during the Professional Summer phase.',
  },
  {
    q: 'What support is provided after the program?',
    a: 'Our mentors remain available during the admissions decision period and provide guidance on next steps after you submit.',
  },
];

const IntensiveMentorshipProgram: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'Full Support Mentorship - Top Coach';
  }, []);

  const handleApply = () => window.open(APPLY_URL, '_blank');

  return (
    <main className="fs">
      <div className="fs__container">
        <button type="button" className="fs__back" onClick={() => navigate('/programs')}>
          ← All programs <span>/ Full Support Mentorship</span>
        </button>

        {/* Hero */}
        <section className="fs__hero">
          <div className="fs__heroGrid" />
          <span className="fs__heroStatus">
            <span className="fs__heroDot" />
            New · 2026 intake open
          </span>
          <div className="fs__heroInner">
            <div className="fs__heroCopy">
              <span className="fs__heroEdition">Vol. 04 / 01 · Flagship</span>
              <span className="fs__heroKicker">12-month intensive · Class of 2031</span>
              <h1 className="fs__heroTitle">
                Full Support <em>Mentorship.</em>
              </h1>
              <p className="fs__heroLede">
                A personalized strategic roadmap for students applying for the
                class of 2031. From SAT prep to application submission, we guide
                every step.
              </p>
              <div className="fs__heroActions">
                <button type="button" className="fs__btn fs__btn--solid" onClick={handleApply}>
                  Apply Now <ArrowRight size={16} />
                </button>
                <button type="button" className="fs__btn fs__btn--ghost">
                  Download syllabus
                </button>
              </div>
            </div>

            <div className="fs__glance">
              <span className="fs__glanceTag">At a glance</span>
              <div className="fs__glanceItems">
                <div className="fs__glanceItem">
                  <strong>12</strong>
                  <span>months, four phases</span>
                </div>
                <div className="fs__glanceItem">
                  <strong>24+</strong>
                  <span>hrs of 1:1 mentorship</span>
                </div>
                <div className="fs__glanceItem">
                  <strong>16+</strong>
                  <span>hrs profile building</span>
                </div>
                <div className="fs__glanceItem">
                  <strong>1</strong>
                  <span>corporate internship</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="fs__section">
          <span className="fs__sectionTag">§ 01 — Who it’s for</span>
          <h2 className="fs__sectionTitle">For the student who starts early.</h2>
          <div className="fs__whoGrid">
            {WHO_ITS_FOR.map((w) => (
              <div key={w.text} className="fs__whoCard">
                <span className="fs__whoIcon">{w.icon}</span>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Program phases */}
        <section className="fs__section">
          <div className="fs__sectionHead">
            <div>
              <span className="fs__sectionTag">§ 02 — Program phases</span>
              <h2 className="fs__sectionTitle">
                Your 12-month journey <em>to top universities.</em>
              </h2>
            </div>
            <p className="fs__sectionAside">
              Four phases, each building on the last — from SAT spike to submitted
              application.
            </p>
          </div>

          <div className="fs__phaseGrid">
            {PHASES.map((phase) => (
              <div key={phase.index} className="fs__phase">
                <div className="fs__phaseHeader">
                  <div className="fs__phaseHead">
                    <span className="fs__phaseNum">{phase.index}</span>
                    <h3 className="fs__phaseTitle">{phase.title}</h3>
                  </div>
                  <span className="fs__phaseWeeks">{phase.weeks}</span>
                </div>
                <ul className="fs__phaseList">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="fs__section">
          <span className="fs__sectionTag">§ 03 — Frequently asked</span>
          <h2 className="fs__sectionTitle">What students ask before they apply.</h2>
          <div className="fs__faq">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className={`fs__faqItem ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="fs__faqQ"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="fs__faqNum">{String(i + 1).padStart(2, '0')}</span>
                    {faq.q}
                    <ChevronDown size={18} className="fs__faqChevron" />
                  </button>
                  {open && <p className="fs__faqA">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="fs__finalCta">
          <span className="fs__finalKicker">Ready to begin</span>
          <h2 className="fs__finalTitle">
            Take the first step toward <em>your dream university.</em>
          </h2>
          <div className="fs__heroActions">
            <button type="button" className="fs__btn fs__btn--solid" onClick={handleApply}>
              Apply Now <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="fs__btn fs__btn--ghostLight"
              onClick={handleApply}
            >
              Talk to admissions
            </button>
          </div>
          <span className="fs__finalDomain">2026 intake now open</span>
        </section>
      </div>
    </main>
  );
};

export default IntensiveMentorshipProgram;
