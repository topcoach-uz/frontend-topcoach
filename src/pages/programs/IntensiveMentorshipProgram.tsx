import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Collapse } from 'antd';
import { ArrowRight, Calendar } from 'lucide-react';
import './IntensiveMentorshipProgram.scss';

const { Title, Paragraph, Text } = Typography;

interface Phase {
  id: number;
  title: string;
  duration: string;
  points: string[];
}

const IntensiveMentorshipProgram: React.FC = () => {
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const timelineTop = timelineRef.current.offsetTop;
      const timelineHeight = timelineRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate scroll progress through timeline (0 to 1)
      const timelineStart = timelineTop - windowHeight * 0.5;
      const timelineEnd = timelineTop + timelineHeight - windowHeight * 0.5;
      const progress = Math.max(0, Math.min(1, (scrollY - timelineStart) / Math.max(1, timelineEnd - timelineStart)));
      setScrollProgress(progress);

      // Check which phases are visible/completed
      const newCompleted = new Set<number>();
      
      phaseRefs.current.forEach((ref, index) => {
        if (!ref) return;
        
        const rect = ref.getBoundingClientRect();
        const viewportMiddle = windowHeight * 0.6; // Trigger slightly earlier for better UX
        
        // Phase is "completed" if it has passed 60% of viewport height
        // Also mark as completed if it's fully visible
        if (rect.top < viewportMiddle) {
          newCompleted.add(index + 1);
        }
      });

      setCompletedPhases(newCompleted);
    };

    // Use requestAnimationFrame for smoother performance
    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', optimizedScroll);
  }, []);

  const phases: Phase[] = [
    {
      id: 1,
      title: 'The Foundation & SAT Spike',
      duration: 'Months 1-4',
      points: [
        'Intensive SAT prep and early testing',
        '16+ hours of extracurricular & profile building',
        'Strategic summer program applications',
        'Foundation for academic excellence'
      ]
    },
    {
      id: 2,
      title: 'The Project',
      duration: 'Months 4-5',
      points: [
        'Specialized track selection',
        'Research paper or startup mentorship',
        'Build your standout project',
        'Develop deep academic interest'
      ]
    },
    {
      id: 3,
      title: 'The Professional Summer',
      duration: 'Months 6-8',
      points: [
        'Personal statement completion',
        'Multiple refinement rounds',
        'Corporate internship placement',
        'Professional recommendation letters'
      ]
    },
    {
      id: 4,
      title: 'Application Season',
      duration: 'Months 9-12',
      points: [
        'Finalize strategic college list',
        'Complete all application essays',
        '24+ hours of personalized mentorship',
        'Final review and submission'
      ]
    }
  ];

  const faqItems = [
    {
      key: '1',
      label: 'Who is this program designed for?',
      children: 'This program is designed for students applying for class of 2031 who are serious about securing admission to top-tier universities and want to get ahead early.'
    },
    {
      key: '2',
      label: 'What makes this program different?',
      children: 'We start early, include corporate internship, and focus on building a "spike" - deep expertise in one area rather than shallow participation.'
    },
    {
      key: '4',
      label: 'Are internships included?',
      children: 'Yes, we have secured contracts with partner organizations. All students will be placed in professional internships during Phase 3.'
    },
    {
      key: '5',
      label: 'What support is provided after the program?',
      children: 'Our mentors remain available during the admissions decision period and provide guidance on next steps.'
    }
  ];

  return (
    <div className="intensive-program">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__container">
          <div className="hero__badge">
            <Calendar size={16} />
            <span>12-Month Program</span>
          </div>
          
          <Title level={1} className="hero__title">
            12-Month Intensive<br />
            <span>Full Support Mentorship Program</span>
          </Title>
          
          <Paragraph className="hero__description">
            A personalized strategic roadmap for students applying for class of 2031.<br />
            From SAT prep to application submission, we guide every step.
          </Paragraph>

          <Button 
            type="primary" 
            size="large"
            className="hero__cta"
            onClick={() => window.open('https://forms.gle/qTLqfZ9YcvZDqzx1A', '_blank')}
          >
            Apply Now <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline" ref={timelineRef}>
        <div className="timeline__header">
          <Title level={2}>Program Phases</Title>
          <Paragraph>Your 12-month journey to top universities</Paragraph>
        </div>

        <div className="timeline__content">
          <div 
            className="timeline__line" 
            style={{ 
              background: `linear-gradient(180deg, var(--primary) 0%, var(--primary) ${scrollProgress * 100}%, #e0e0e0 ${scrollProgress * 100}%, #e0e0e0 100%)`
            }}
          />
          <div className="timeline__line-mobile" 
            style={{ 
              background: `linear-gradient(180deg, var(--primary) 0%, var(--primary) ${scrollProgress * 100}%, #e0e0e0 ${scrollProgress * 100}%, #e0e0e0 100%)`
            }}
          />
          
          {phases.map((phase, index) => {
            const isCompleted = completedPhases.has(phase.id);
            return (
              <div 
                key={phase.id} 
                ref={(el) => { phaseRefs.current[index] = el; }}
                className={`timeline__item ${index % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'} ${isCompleted ? 'timeline__item--completed' : ''}`}
              >
                <div className={`timeline__marker ${isCompleted ? 'timeline__marker--completed' : ''}`}>
                  <span>{phase.id}</span>
                </div>
              
                <div className="timeline__card">
                  <div className="timeline__card-header">
                    <Text className="timeline__duration">{phase.duration}</Text>
                    <Title level={4} className="timeline__card-title">{phase.title}</Title>
                  </div>
                  <ul className="timeline__points">
                    {phase.points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta__container">
          <Title level={2}>Ready to Start?</Title>
          <Paragraph>
            Take the first step toward your dream university
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={() => window.open('https://forms.gle/qTLqfZ9YcvZDqzx1A', '_blank')}
          >
            Apply Now <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="faq__container">
          <Title level={2}>Frequently Asked Questions</Title>
          <Collapse 
            items={faqItems}
            expandIconPosition="end"
            className="faq__collapse"
          />
        </div>
      </section>
    </div>
  );
};

export default IntensiveMentorshipProgram;
