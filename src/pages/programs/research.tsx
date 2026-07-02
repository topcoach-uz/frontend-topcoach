import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  PenTool,
  Target,
  CheckCircle2,
  MessageCircle,
  Compass,
} from 'lucide-react';
import './research.scss';

const APPLY_URL = 'https://forms.gle/qTLqfZ9YcvZDqzx1A';

interface Phase {
  index: string;
  weeks: string;
  title: string;
  items: string[];
}

interface Benefit {
  num: string;
  title: string;
  text: string;
}

interface Faq {
  q: string;
  a: string;
}

const WHO_ITS_FOR = [
  { icon: <GraduationCap size={18} />, text: 'High school students in Grades 8–12.' },
  { icon: <BookOpen size={18} />, text: 'Interested in academic research and higher education.' },
  { icon: <Compass size={18} />, text: 'Future applicants to competitive international universities.' },
  { icon: <Award size={18} />, text: 'Looking to strengthen their academic portfolios.' },
];

const PHASES: Phase[] = [
  {
    index: '1',
    weeks: 'Weeks 1–4',
    title: 'Research Foundations',
    items: [
      'Introduction to academic research',
      'Choosing a research topic',
      'Research ethics & academic integrity',
      'Literature review & source evaluation',
      'Research question development',
    ],
  },
  {
    index: '2',
    weeks: 'Weeks 5–8',
    title: 'Research Development',
    items: [
      'Research methodology',
      'Data collection & analysis',
      'Academic writing techniques',
      'Argument development & evidence-based writing',
      'Weekly progress reviews with mentors',
    ],
  },
  {
    index: '3',
    weeks: 'Weeks 9–12',
    title: 'Research Paper Completion',
    items: [
      'Drafting the research paper',
      'Editing & revision process',
      'Citation & referencing standards',
      'Final presentation preparation',
      'Submission of final research project',
    ],
  },
];

const MENTORSHIP = [
  { icon: <Users size={16} />, text: '12 hours of one-on-one mentorship' },
  { icon: <MessageCircle size={16} />, text: 'Weekly meetings with an assigned mentor' },
  { icon: <PenTool size={16} />, text: 'Personalized feedback on your progress' },
  { icon: <Target size={16} />, text: 'Guidance on topic, methodology & writing' },
  { icon: <CheckCircle2 size={16} />, text: 'Continuous support throughout the program' },
];

const OUTCOMES = [
  'A completed academic research paper',
  'Advanced academic writing skills',
  'Research & analytical thinking experience',
  'A stronger university admissions portfolio',
  'Experience working with academic mentors',
];

const BENEFITS: Benefit[] = [
  {
    num: '01',
    title: 'University-level research skills',
    text: 'Learn how scholars actually identify problems, review literature, and build an argument.',
  },
  {
    num: '02',
    title: 'Critical & analytical thinking',
    text: 'Develop the reasoning abilities that competitive universities look for.',
  },
  {
    num: '03',
    title: 'A competitive academic profile',
    text: 'A finished, independent project that sets your application apart.',
  },
  {
    num: '04',
    title: 'Personalized mentorship',
    text: '12 hours of one-on-one guidance with an assigned academic mentor.',
  },
  {
    num: '05',
    title: 'A meaningful independent project',
    text: 'Investigate a question you genuinely care about, start to finish.',
  },
  {
    num: '06',
    title: 'Future scholarship readiness',
    text: 'Prepare for academic competitions and scholarship opportunities ahead.',
  },
];

const FAQS: Faq[] = [
  {
    q: 'Who is this program for?',
    a: 'High school students in Grades 8–12 interested in academic research and higher education — especially future applicants to competitive international universities who want to strengthen their portfolios.',
  },
  {
    q: 'How is the 12 weeks structured?',
    a: 'Three four-week phases, each gated by mentor-reviewed milestones: Research Foundations, Research Development, and Research Paper Completion. Each phase builds on the last.',
  },
  {
    q: 'How much mentorship is included?',
    a: '12 hours of one-on-one mentorship with an assigned academic mentor, plus weekly progress meetings and personalized feedback throughout the program.',
  },
  {
    q: 'What will I have at the end?',
    a: 'A completed academic research paper, advanced academic writing skills, real research experience, and a stronger university admissions portfolio.',
  },
  {
    q: 'Do I need a topic before I start?',
    a: 'No. The first phase is dedicated to exploring interests, choosing a topic, and developing a focused research question with your mentor.',
  },
];

const ResearchProgram: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'Research Program - Top Coach';
  }, []);

  const handleApply = () => window.open(APPLY_URL, '_blank');

  return (
    <main className="rp">
      <div className="rp__container">
        <button type="button" className="rp__back" onClick={() => navigate('/programs')}>
          ← All programs <span>/ Research Program</span>
        </button>

        {/* Hero */}
        <section className="rp__hero">
          <div className="rp__heroGrid" />
          <div className="rp__heroInner">
            <div className="rp__heroCopy">
              <span className="rp__heroEdition">Vol. 04 / #3 · Research</span>
              <span className="rp__heroKicker">12-week program · Grades 8–12</span>
              <h1 className="rp__heroTitle">
                The Research <em>Program.</em>
              </h1>
              <p className="rp__heroLede">
                An intensive twelve weeks from a blank page to a finished paper —
                learn to find a question, review the literature, investigate it,
                and write it up, one-on-one with an academic mentor.
              </p>
              <div className="rp__heroActions">
                <button
                  type="button"
                  className="rp__btn rp__btn--solid"
                  onClick={handleApply}
                >
                  Free consultation <ArrowRight size={16} />
                </button>
                <button type="button" className="rp__btn rp__btn--ghost">
                  Download syllabus
                </button>
              </div>
            </div>

            <div className="rp__glance">
              <div className="rp__glanceItem">
                <strong>12</strong>
                <span>weeks, three phases</span>
              </div>
              <div className="rp__glanceItem">
                <strong>12</strong>
                <span>hrs of 1:1 mentorship</span>
              </div>
              <div className="rp__glanceItem">
                <strong>1</strong>
                <span>completed paper</span>
              </div>
              <div className="rp__glanceItem">
                <strong>Wkly</strong>
                <span>progress reviews</span>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="rp__section">
          <span className="rp__sectionTag">§ 01 — Who it’s for</span>
          <h2 className="rp__sectionTitle">For students who want to dig deeper.</h2>
          <div className="rp__whoGrid">
            {WHO_ITS_FOR.map((w) => (
              <div key={w.text} className="rp__whoCard">
                <span className="rp__whoIcon">{w.icon}</span>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Program structure */}
        <section className="rp__section">
          <div className="rp__sectionHead">
            <div>
              <span className="rp__sectionTag">§ 02 — Program structure</span>
              <h2 className="rp__sectionTitle">
                Three phases. <em>One paper.</em>
              </h2>
            </div>
            <p className="rp__sectionAside">
              Each four-week phase builds on the last, gated by mentor-reviewed
              milestones.
            </p>
          </div>

          <div className="rp__phaseGrid">
            {PHASES.map((phase, i) => (
              <div
                key={phase.index}
                className={`rp__phase rp__phase--${i + 1}`}
              >
                <div className="rp__phaseTop">
                  <span className="rp__phaseNum">{phase.index}</span>
                  <span className="rp__phaseWeeks">{phase.weeks}</span>
                </div>
                <h3 className="rp__phaseTitle">{phase.title}</h3>
                <ul className="rp__phaseList">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Individual mentorship + outcomes */}
        <section className="rp__section">
          <span className="rp__sectionTag">§ 03 — Individual mentorship</span>
          <div className="rp__mentorGrid">
            <div className="rp__mentorCopy">
              <h2 className="rp__sectionTitle">
                A scholar in your corner, <em>every week.</em>
              </h2>
              <ul className="rp__mentorList">
                {MENTORSHIP.map((m) => (
                  <li key={m.text}>
                    <span className="rp__mentorIcon">{m.icon}</span>
                    {m.text}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rp__outcomes">
              <span className="rp__outcomesTag">Final outcomes</span>
              <h3 className="rp__outcomesTitle">By the end, you’ll have:</h3>
              <ul>
                {OUTCOMES.map((o) => (
                  <li key={o}>
                    <CheckCircle2 size={16} />
                    {o}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        {/* Benefits */}
        <section className="rp__section">
          <span className="rp__sectionTag">§ 04 — Program benefits</span>
          <div className="rp__benefitGrid">
            {BENEFITS.map((b) => (
              <div key={b.num} className="rp__benefit">
                <span className="rp__benefitNum">{b.num}</span>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="rp__section">
          <span className="rp__sectionTag">§ 05 — Frequently asked</span>
          <h2 className="rp__sectionTitle">Questions before you begin.</h2>
          <div className="rp__faq">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className={`rp__faqItem ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="rp__faqQ"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="rp__faqNum">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {faq.q}
                    <ChevronDown size={18} className="rp__faqChevron" />
                  </button>
                  {open && <p className="rp__faqA">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="rp__finalCta">
          <span className="rp__finalKicker">From question to paper</span>
          <h2 className="rp__finalTitle">
            Write the paper that <em>sets you apart.</em>
          </h2>
          <div className="rp__heroActions">
            <button
              type="button"
              className="rp__btn rp__btn--solid"
              onClick={handleApply}
            >
              Free consultation <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="rp__btn rp__btn--ghostLight"
              onClick={handleApply}
            >
              Talk to a mentor
            </button>
          </div>
          <span className="rp__finalDomain">TopCoachUni.com</span>
        </section>
      </div>
    </main>
  );
};

export default ResearchProgram;
