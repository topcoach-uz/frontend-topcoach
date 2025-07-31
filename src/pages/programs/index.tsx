import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Tag, Avatar, Progress, Divider, Alert, Spin, message, Badge } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  StarOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  BookOutlined,
  TeamOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useTypedSelector } from 'src/app/store';
import { 
  useGetActivePricingQuery,
  useGetEnrollmentStatusQuery,
  useCreateEnrollmentMutation,
  CourseEnrollmentDto,
  ProgramPricingDto
} from 'src/app/services/courses';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import { useAppDispatch } from 'src/app/store';
import { show } from 'src/app/slices/profilePopupSlice';
import './index.scss';

// Local enums for course types and payment status
enum CourseTypeEnum {
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

enum CoursePaymentStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

interface Mentor {
  id: string;
  name: string;
  university: string;
  scholarship: string;
  image: string;
  module: string;
  achievements: string[];
  stats: {
    studentsMentored: string;
  };
}

interface CourseModule {
  title: string;
  description: string;
  topics: string[];
  duration: string;
}

interface PricingPlan {
  type: CourseTypeEnum;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

const mentors: Mentor[] = [
  {
    id: '1',
    name: 'Zafar Akhtamov',
    university: 'Babson College',
    scholarship: 'Full Ride $345,000',
    image: 'img/zafar_programs.jpeg',
    module: 'Foundations of Admissions & Supplemental Essays',
    achievements: [
      'FLEX alumni & UWC finalist stage participant',
      'Co-founder & Head leader of biggest non-profit \'Blagoe delo\' \'24',
      'Top 0.1% of applicants (1st in Uzbekistan)'
    ],
    stats: {
      studentsMentored: '20+',
    }
  },
  {
    id: '2',
    name: 'Viola Fur',
    university: 'Oxford & Yale Graduate',
    scholarship: 'Multiple Full Scholarships',
    image: '/img/viola_programs.jpeg',
    module: 'Essay Writing Excellence',
    achievements: [
      '8 years of experience in college admissions mentoring',
      'Mentored 40+ students successfully',
      'Offers from Oxford, Harvard, King\'s College, UCL, NYU, Toronto'
    ],
    stats: {
      studentsMentored: '40+',
    }
  },
  {
    id: '3',
    name: 'Azizbek Zaylobiddinov',
    university: 'Harvard University',
    scholarship: 'Full Ride $392,000',
    image: '/img/azizbek_programs.jpeg',
    module: 'Portfolio Building',
    achievements: [
      'Manager of "Ibrat Debate" - biggest social project in Uzbekistan',
      'Mentored 20+ students in building strong portfolios',
      'Students secured positions with MIT, Cambridge, GWU PhD candidates'
    ],
    stats: {
      studentsMentored: '50+',
    }
  }
];

const courseModules: CourseModule[] = [
  {
    title: 'Foundations of Admissions',
    description: 'Master the fundamentals of university admissions and understand what top universities truly look for in applicants.',
    topics: ['Understanding Admissions Criteria', 'Building Academic Profile', 'Extracurricular Strategy', 'Research Opportunities'],
    duration: '4 weeks'
  },
  {
    title: 'Building a Successful Portfolio',
    description: 'Create a compelling portfolio that showcases your achievements and demonstrates your potential to admissions committees.',
    topics: ['Portfolio Structure', 'Achievement Documentation', 'Leadership Examples', 'Innovation Projects'],
    duration: '3 weeks'
  },
  {
    title: 'Personal Statement Mastery',
    description: 'Write a personal statement that tells your unique story and stands out among thousands of applications.',
    topics: ['Story Development', 'Writing Techniques', 'Editing Process', 'Common Mistakes'],
    duration: '4 weeks'
  },
  {
    title: 'Supplemental Essays',
    description: 'Master the art of writing compelling supplemental essays tailored to each university\'s specific requirements.',
    topics: ['Essay Types', 'University-Specific Essays', 'Why This School', 'Why This Major'],
    duration: '3 weeks'
  }
];

const ProgramsPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, isAuthenticated } = useTypedSelector(state => state.auth);
  const [selectedPlan, setSelectedPlan] = useState<CourseTypeEnum | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const dispatch = useAppDispatch();

  // API hooks
  const { data: pricing, isLoading: pricingLoading } = useGetActivePricingQuery();
  const { data: enrollmentStatus, isLoading: statusLoading } = useGetEnrollmentStatusQuery(undefined, {
    skip: !isAuthenticated
  });
  const { data: telegramStatus } = useGetTelegramStatusQuery(undefined, {
    skip: !isAuthenticated
  });

  const [createEnrollment, { isLoading: creatingEnrollment }] = useCreateEnrollmentMutation();

  useEffect(() => {
    if (pricing) {
      console.log('Pricing data from API:', pricing);
      setPricingPlans([
        {
          type: CourseTypeEnum.STANDARD,
          price: pricing.standardPrice,
          currency: pricing.currency,
          features: [
            '4 core modules (Introduction, Portfolio, Personal Statement, Supplemental essays + Scholarship)',
            '25+ recorded video lessons by professional mentors',
            'Downloadable templates and sample documents (CV, PS, essays)',
            'Access to 3 live Zoom sessions (orientation + Q&A)',
            'Homework assignments',
            'Access to an exclusive Telegram community for networking',
            'Admission Checklist & Timeline for structured preparation'
          ]
        },
        {
          type: CourseTypeEnum.PREMIUM,
          price: pricing.premiumPrice,
          currency: pricing.currency,
          features: [
            'Everything in Standard',
            'Small group mentoring (6 students per co-mentor)',
            '2 individual 1x1 sessions monthly with a co-mentor',
            'Access to 9 live Zoom sessions',
            'Homework with written feedback',
            '1 Q&A session with a co-mentor in a month',
            'Priority chat support on Telegram',
            '3 Guest Speaker sessions',
            'Offline networking event'
          ],
          popular: true
        }
      ]);
    }
  }, [pricing]);

  // Only show loading for pricing data, not enrollment status
  if (pricingLoading) {
    return (
      <div className="programs-loading">
        <Spin size="large" />
        <p>Loading program information...</p>
      </div>
    );
  }

  const handleEnroll = async (planType: CourseTypeEnum) => {
    if (!isAuthenticated) {
      message.warning('Please log in to enroll in the course');
      window.location.href = '/auth/login';
      return;
    }

    // Check if user is connected to Telegram bot
    if (telegramStatus?.status !== 'connected') {
      dispatch(show());
      message.warning('Please connect your Telegram account to enroll in the course');
      return;
    }

    try {
      setSelectedPlan(planType);
      
      const plan = pricingPlans.find(p => p.type === planType);
      if (!plan) {
        message.error('Pricing plan not found');
        return;
      }

      console.log('Selected plan for enrollment:', plan);
      console.log('Plan price:', plan.price, 'Type:', typeof plan.price);

      // Create enrollment with proper number conversion
      const enrollment = await createEnrollment({
        courseType: planType,
        amount: Number(plan.price) // Convert to number to fix validation error
      }).unwrap();

      // Redirect to payment page
      const paymentUrl = `/payment?enrollmentId=${enrollment.id}&type=course&amount=${plan.price}`;
      console.log('Payment URL:', paymentUrl);
      window.location.href = paymentUrl;
      
    } catch (error: any) {
      console.error('Enrollment error:', error);
      message.error(error?.data?.message || 'Failed to enroll in course');
    }
  };

  const getStatusColor = (status: CoursePaymentStatusEnum) => {
    switch (status) {
      case CoursePaymentStatusEnum.COMPLETED:
        return 'success';
      case CoursePaymentStatusEnum.PENDING:
        return 'warning';
      case CoursePaymentStatusEnum.FAILED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Helper function to check if user is enrolled in specific plan
  const isEnrolledInPlan = (planType: CourseTypeEnum) => {
    const isEnrolled = enrollmentStatus?.enrollment?.courseType === planType;
    console.log(`Checking enrollment for ${planType}:`, isEnrolled, enrollmentStatus?.enrollment);
    return isEnrolled;
  };

  return (
    <div className="programs-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <CrownOutlined />
              <span>Premium University Admissions Course</span>
            </div>
            <h1 className="hero-title">
              TopCoach Admissions Program
              <span className="highlight"> with Elite Mentors</span>
            </h1>
            <p className="hero-subtitle">
              Join our comprehensive course designed by students who secured full scholarships to Harvard, 
              Babson, Oxford, and Yale. Get the insider knowledge that led to $737,000+ in scholarships.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <DollarOutlined />
                <div className="stat-content">
                  <span className="stat-value">$737K+</span>
                  <span className="stat-label">Scholarships Secured</span>
                </div>
              </div>
              <div className="stat">
                <TeamOutlined />
                <div className="stat-content">
                  <span className="stat-value">110+</span>
                  <span className="stat-label">Students Mentored</span>
                </div>
              </div>
              <div className="stat">
                <TrophyOutlined />
                <div className="stat-content">
                  <span className="stat-value">50+</span>
                  <span className="stat-label">Universities Admitted</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-illustration">
              <div className="premium-badge">
                <CrownOutlined />
                <span>Elite Program</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Status */}
      {enrollmentStatus?.isEnrolled && enrollmentStatus.enrollment && (
        <section className="enrollment-status">
          <Alert
            message={
              <div className="enrollment-message">
                <CheckCircleOutlined />
                <span>You're enrolled in the {enrollmentStatus.enrollment.courseType} plan!</span>
                <Tag color={getStatusColor(enrollmentStatus.enrollment.paymentStatus as CoursePaymentStatusEnum)}>
                  {enrollmentStatus.enrollment.paymentStatus.toUpperCase()}
                </Tag>
              </div>
            }
            description="Once we launch the programs, you will have full access to all course materials and sessions."
            type="success"
            showIcon={false}
            className="enrollment-alert"
          />
        </section>
      )}

      {/* Mentors Section */}
      <section className="mentors-section">
        <div className="section-header">
          <div className="header-content">
            <h2>Learn from Elite Mentors</h2>
            <p>Our mentors secured full scholarships to top universities and have helped students achieve similar success</p>
          </div>
        </div>
        <div className="mentors-grid">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="mentor-card" hoverable>
              <div className="mentor-header">
                <div className="mentor-avatar">
                  <Avatar size={80} src={mentor.image} />
                </div>
                <div className="mentor-info">
                  <h3>{mentor.name}</h3>
                  <div className="university-info">
                    <p className="university">{mentor.university}</p>
                    <p className="scholarship">{mentor.scholarship}</p>
                  </div>
                  <div className="module-info">
                    <BookOutlined />
                    <span>{mentor.module}</span>
                  </div>
                </div>
              </div>
              
              <div className="mentor-achievements">
                <h4>Key Achievements</h4>
                <ul>
                  {mentor.achievements.map((achievement, index) => (
                    <li key={index}>
                      <CheckCircleOutlined />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mentor-stats">
                <div className="stat-item">
                  <UserOutlined />
                  <div>
                    <span className="stat-number">{mentor.stats.studentsMentored}</span>
                    <span className="stat-label">Students Mentored</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Course Modules */}
      <section className="modules-section">
        <div className="section-header">
          <div className="header-content">
            <h2>Comprehensive Course Modules</h2>
            <p>Everything you need to know about university admissions, taught by successful applicants</p>
          </div>
        </div>
        <div className="modules-grid">
          {courseModules.map((module, index) => (
            <Card key={index} className="module-card" hoverable>
              <div className="module-header">
                <div className="module-info">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>
              </div>
              <div className="module-topics">
                <h4>What you'll learn:</h4>
                <ul>
                  {module.topics.map((topic, topicIndex) => (
                    <li key={topicIndex}>
                      <CheckCircleOutlined />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="module-duration">
                <ClockCircleOutlined />
                <span>{module.duration}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="different-section">
        <div className="section-header">
          <div className="header-content">
            <h2>What Makes Us Different</h2>
            <p>Why choose our program over others</p>
          </div>
        </div>
        <div className="different-grid">
          <div className="different-item">
            <div className="icon">
              <TrophyOutlined />
            </div>
            <h3>Proven Track Record</h3>
            <p>Our mentors secured full scholarships to Harvard, Babson, Oxford, and Yale</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <UserOutlined />
            </div>
            <h3>Elite Mentorship</h3>
            <p>Direct guidance from students who achieved top 0.1% status in admissions</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <StarOutlined />
            </div>
            <h3>Comprehensive Support</h3>
            <p>From application strategy to interview preparation, we cover it all</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <RocketOutlined />
            </div>
            <h3>Results-Driven</h3>
            <p>Focus on actionable strategies that lead to successful admissions</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-header">
          <div className="header-content">
            <h2>Choose Your Plan</h2>
            <p>Take the first step towards your dream university with our proven programs</p>
          </div>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.type} 
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              hoverable
            >
              {plan.popular && (
                <div className="popular-badge">
                  <StarOutlined />
                  Most Popular
                </div>
              )}
              <div className="pricing-header">
                <h3>{plan.type === CourseTypeEnum.STANDARD ? 'Standard' : 'Premium'} Package</h3>
                <div className="price">
                  <span className="currency">{plan.currency}</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">one-time</span>
                </div>
              </div>
              <div className="pricing-features">
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircleOutlined />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                type={plan.popular ? 'primary' : 'default'}
                size="large"
                block
                onClick={() => handleEnroll(plan.type)}
                loading={selectedPlan === plan.type && creatingEnrollment}
                disabled={isEnrolledInPlan(plan.type)}
                className="enroll-button"
              >
                {isEnrolledInPlan(plan.type) ? 'Already Enrolled' : `Enroll in ${plan.type === CourseTypeEnum.STANDARD ? 'Standard' : 'Premium'}`}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join hundreds of successful students who have achieved their dreams with our guidance</p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => document.querySelector('.pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            icon={<RocketOutlined />}
          >
            Get Started Today
          </Button>
        </div>
      </section>
      </div>
  );
};

export default ProgramsPage; 