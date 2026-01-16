import React from 'react';
import { Button, Typography, Collapse } from 'antd';
import { 
  ArrowRightOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import './IntensiveMentorshipProgram.scss';

const { Title, Paragraph, Text } = Typography;

interface Phase {
  id: number;
  title: string;
  duration: string;
  points: string[];
}

const IntensiveMentorshipProgram: React.FC = () => {

  const phases: Phase[] = [
    {
      id: 1,
      title: 'The Foundation & SAT Spike',
      duration: 'Months 1-4',
      points: [
        'Intensive SAT preparation',
        'Finish testing early',
        'Portfolio audit & launch',
        'Summer program applications'
      ]
    },
    {
      id: 2,
      title: 'The Project',
      duration: 'Months 4-5',
      points: [
        'Choose specialized track',
        'Research paper mentorship',
        'Startup launch support',
        'Build major expertise'
      ]
    },
    {
      id: 3,
      title: 'The Professional Summer',
      duration: 'Months 6-8',
      points: [
        'Complete Personal Statement',
        'Multiple refinement rounds',
        'Corporate internship placement',
        'Professional recommendation letter'
      ]
    },
    {
      id: 4,
      title: 'Application Season',
      duration: 'Months 9-12',
      points: [
        'Maintain high GPA',
        'Finalize college list',
        'Complete all essays',
        'Final review & submission'
      ]
    }
  ];

  const faqItems = [
    {
      key: '1',
      label: 'Who is this program designed for?',
      children: 'This program is designed for Grade 10 students who are serious about securing admission to top-tier universities and want to get ahead early.'
    },
    {
      key: '2',
      label: 'What makes this program different?',
      children: 'We start early (Grade 10), include guaranteed corporate internship, and focus on building a "spike" - deep expertise in one area rather than shallow participation.'
    },
    {
      key: '3',
      label: 'How much time is required?',
      children: '8 hours of mentorship per month, plus independent work. Expect 10-15 hours per week for program activities.'
    },
    {
      key: '4',
      label: 'Are internships guaranteed?',
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
            <CalendarOutlined />
            <span>12-Month Program</span>
          </div>
          
          <Title level={1} className="hero__title">
            12-Month Intensive<br />
            <span>Mentorship Program</span>
          </Title>
          
          <Paragraph className="hero__description">
            A personalized strategic roadmap for Grade 10 students.<br />
            From SAT prep to application submission — we guide every step.
          </Paragraph>

          <Button 
            type="primary" 
            size="large"
            className="hero__cta"
            onClick={() => window.open('https://forms.gle/qTLqfZ9YcvZDqzx1A', '_blank')}
          >
            Apply Now <ArrowRightOutlined />
          </Button>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline">
        <div className="timeline__header">
          <Title level={2}>Program Phases</Title>
          <Paragraph>Your 12-month journey to top universities</Paragraph>
        </div>

        <div className="timeline__content">
          <div className="timeline__line" />
          
          {phases.map((phase, index) => (
            <div 
              key={phase.id} 
              className={`timeline__item ${index % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'}`}
            >
              <div className="timeline__marker">
                <span>{phase.id}</span>
              </div>
              
              <div className="timeline__connector" />
              
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
          ))}
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
            Apply Now <ArrowRightOutlined />
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
