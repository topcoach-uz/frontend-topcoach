import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Modal, Alert, message, Spin, Progress, Avatar } from 'antd';
import { 
  BookOutlined,
  CheckCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  RocketOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useAppDispatch } from 'src/app/store';
import { show } from 'src/app/slices/profilePopupSlice';
import { 
  useGetActivePricingQuery,
  useGetEnrollmentStatusQuery,
  useCreateEnrollmentMutation,
  useGetUserProgressQuery,
} from 'src/app/services/courses';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import './sat.scss';

const SatPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile, isAuthenticated } = useTypedSelector(state => state.auth);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // API hooks
  const { data: pricing, isLoading: pricingLoading } = useGetActivePricingQuery('sat', {
    skip: !isAuthenticated,
  });
  // Get enrollment status for SAT course specifically
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useGetEnrollmentStatusQuery('sat', {
    skip: !isAuthenticated,
  });
  
  const satEnrollmentStatus = enrollmentStatus;
  const { data: userProgress } = useGetUserProgressQuery('sat', {
    skip: !isAuthenticated || !enrollmentStatus?.canAccessLearning,
  });
  const { data: telegramStatus } = useGetTelegramStatusQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createEnrollment] = useCreateEnrollmentMutation();

  useEffect(() => {
    document.title = 'SAT Prep Course - Top Coach';
  }, []);

  const handleVideoPreviewClick = () => {
    setVideoSrc('https://www.youtube.com/embed/uaC3wW4JIJA?autoplay=1&rel=0');
    setIsVideoModalVisible(true);
  };

  const handleModalClose = () => {
    setIsVideoModalVisible(false);
    setVideoSrc('');
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      message.info('Please log in to enroll in the course');
      navigate('/auth/signin');
      return;
    }

    // Check if user is connected to Telegram bot (only for students)
    if (profile?.profile?.role === 'Student' && telegramStatus?.status !== 'connected') {
      dispatch(show());
      message.warning('Please connect your Telegram account to enroll in the course');
      return;
    }

    try {
      setIsEnrolling(true);
      
      if (!pricing) {
        message.error('Pricing information not available');
        return;
      }

      // SAT has single tier - always use standardPrice
      // Convert to number to ensure it's not a string (PostgreSQL decimal can return as string)
      const amount = typeof pricing.standardPrice === 'string' 
        ? parseFloat(pricing.standardPrice) 
        : Number(pricing.standardPrice);
      
      const enrollment = await createEnrollment({
        courseType: 'standard',
        courseName: 'sat',
        amount: amount,
      }).unwrap();

      // Redirect to payment page with enrollment details
      const paymentUrl = `/payment?enrollmentId=${enrollment.id}&type=course&amount=${amount}`;
      window.location.href = paymentUrl;

    } catch (error: any) {
      console.error('Enrollment error:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create enrollment. Please try again.';
      message.error(errorMessage);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleContinueLearning = () => {
    navigate('/learning?course=sat');
  };

  const features = [
    {
      icon: <FileTextOutlined />,
      title: 'Comprehensive Practice Tests',
      description: 'Full-length practice tests with detailed score reports and performance analytics'
    },
    {
      icon: <BookOutlined />,
      title: 'Expert-Led Instruction',
      description: 'Learn from instructors who scored 1550+ and have helped hundreds of students succeed'
    },
    {
      icon: <ThunderboltOutlined />,
      title: 'Proven Test Strategies',
      description: 'Master time management, elimination techniques, and question-solving approaches'
    },
    {
      icon: <RocketOutlined />,
      title: 'Structured Learning Path',
      description: 'Video lessons followed by practice questions per lesson to reinforce understanding'
    }
  ];

  const curriculum = [
    {
      section: 'SAT English',
      icon: <FileTextOutlined />,
      description: 'Master reading comprehension, grammar, and writing skills',
      modules: [
        {
          name: 'SAT Grammar',
          lessons: [
            'Pronoun Agreement',
            'Subject-Verb Agreement',
            'Possessive Nouns & Pronouns',
            'Conjunctions',
            'Parallel Structure',
            'Logical Comparison',
            'Verb Tenses',
            'Redundancy',
            'Concision',
            'Mid-Grammar Review',
            'Modifiers',
            'Punctuation',
            'Additional Punctuations',
            'Run-ons',
            'End-of-Sentence Punctuation',
            'Transition Words',
            'Advanced Transitions',
            'Transition Sentences',
            'Intro-Conclusions',
            'Rhetorical Synthesis'
          ]
        },
        {
          name: 'SAT Reading',
          lessons: [
            'Reading Overview',
            'Central Ideas',
            'Details',
            'Overall Structure',
            'Main Purpose',
            'Part-to-Whole Purpose',
            'Words in Context',
            'Cross-Text Connections',
            'Text-based Evidence',
            'Graph-based Evidence',
            'Inferences',
            'Text-based Evidence [hard]',
            'Graph-based Evidence [hard]',
            'Inferences [hard]',
            'Active Reading Strategies',
            'Time Management & Guessing Answers',
            'Book Recommendations'
          ]
        }
      ],
      features: ['Video lessons', 'Practice questions per lesson', 'Practice exams', 'Mock exams']
    },
    {
      section: 'SAT Math',
      icon: <BarChartOutlined />,
      description: 'Comprehensive math coverage from basics to advanced topics',
      modules: [
        {
          name: 'Pre Algebra',
          lessons: [
            'Exponents & Radicals',
            'Quadratic Functions',
            'Exponential Functions',
            'Nonlinear Graphs',
            'Manipulating Functions',
            'Nonlinear Function Word Problems'
          ]
        },
        {
          name: 'SAT Algebra',
          lessons: [
            'Exponents & Radicals',
            'Quadratic Functions',
            'Exponential Functions',
            'Nonlinear Graphs',
            'Manipulating Functions',
            'Nonlinear Function Word Problems'
          ]
        },
        {
          name: 'Real-Life Math',
          lessons: [
            'Rates & Ratios',
            'Percentages 1',
            'Percentages 2',
            'Measurements',
            'Unit Conversion',
            'Linear vs Exponential Growth'
          ]
        },
        {
          name: 'SAT Statistics',
          lessons: [
            'Data Distribution (basic)',
            'Data Distribution (hard)',
            'Scatterplots',
            'Table Data',
            'Probability',
            'Additional Statistics Graphs',
            'Survey Data Collections',
            'Experiment Data Collections',
            'Data Inferences'
          ]
        },
        {
          name: 'SAT Geometry',
          lessons: [
            'Lines & Angles',
            'Similarity & Congruence',
            'Area & Volume',
            'Circle Theory',
            'Circle Equations',
            'Degrees & Radians',
            'Trigonometry',
            'Unit Circle'
          ]
        },
        {
          name: 'Desmos for SAT',
          lessons: [
            'Desmos for Algebra',
            'Desmos for Statistics',
            'Desmos for Geometry'
          ]
        },
        {
          name: 'Math Practise Test',
          lessons: [
            'Exponents & Radicals',
            'Quadratic Functions',
            'Exponential Functions',
            'Nonlinear Graphs',
            'Manipulating Functions',
            'Nonlinear Function Word Problems'
          ]
        }
      ],
      features: ['Video lessons', 'Practice questions per lesson', 'Practice exams', 'Mock exams']
    }
  ];

  const mentors = [
    {
      id: '1',
      name: 'Abdulaziz Sharopov',
      university: 'Northwestern University in Qatar',
      scholarship: 'Full-Ride $260,000',
      image: '/img/abdulaziz_sat.jpg', // User will update this path
      achievements: [
        'Full Scholarship Graduate of Tashkent International School',
        'SAT Coach since 2020 with 2800+ Students',
        '146 Students studying abroad with Full Scholarships'
      ],
      stats: {
        studentsMentored: '2800+',
      }
    }
  ];

  const testimonials = [
    {
      name: 'Sardor M.',
      score: '1520',
      improvement: '+180 points',
      text: 'The personalized study plan and expert strategies helped me improve my score significantly. Highly recommend!'
    },
    {
      name: 'Malika N.',
      score: '1480',
      improvement: '+150 points',
      text: 'The practice tests and detailed feedback were game-changers. I felt confident and prepared on test day.'
    },
    {
      name: 'Jasur M.',
      score: '1550',
      improvement: '+200 points',
      text: 'The instructors were amazing and the small group sessions made learning engaging and effective.'
    }
  ];

  return (
    <div className="sat-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Master the SAT
              <span className="program-word">Prep Course</span>
            </h1>
            <p className="hero-subtitle">
              Master every possible question that can appear on the SAT English & Math sections. 
              You'll learn the overall exam structure as well as tips & secrets for answering questions quickly AND effectively.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <FileTextOutlined />
                <div className="stat-content">
                  <span className="stat-value">3000+</span>
                  <span className="stat-label">Practice Questions</span>
                </div>
              </div>
              <div className="stat">
                <TeamOutlined />
                <div className="stat-content">
                  <span className="stat-value">200+</span>
                  <span className="stat-label">Students with SAT 1400+</span>
                </div>
              </div>
              <div className="stat">
                <TrophyOutlined />
                <div className="stat-content">
                  <span className="stat-value">1590</span>
                  <span className="stat-label">Scores up to 1590</span>
                </div>
              </div>
            </div>
            <div className="hero-actions">
              {isAuthenticated && satEnrollmentStatus?.canAccessLearning ? (
                <Button 
                  type="primary" 
                  size="large"
                  className="apply-now-btn"
                  icon={<PlayCircleOutlined />}
                  onClick={handleContinueLearning}
                >
                  Continue Learning
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  className="apply-now-btn"
                  icon={<RocketOutlined />}
                  onClick={isAuthenticated ? handleEnroll : () => navigate('/auth/signup')}
                  loading={isEnrolling}
                >
                  {isAuthenticated ? 'Enroll Now' : 'Start Your Journey'}
                </Button>
              )}
              <Button 
                size="large"
                className="contact-us-btn"
                icon={<PlayCircleOutlined />}
                onClick={handleVideoPreviewClick}
              >
                Watch Preview
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <img src="/img/abdulaziz_sat.jpg" alt="SAT Prep Course" />
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Status & Learning Progress - Right after hero */}
      {isAuthenticated && satEnrollmentStatus?.isEnrolled && satEnrollmentStatus.enrollment && (
        <section className="enrollment-status">
          <div className="container">
            {satEnrollmentStatus.isEnrolled && !satEnrollmentStatus.canAccessLearning && (
              <Alert
                message="Enrollment Pending Approval"
                description="Your enrollment is pending approval. Our administrator will review and contact you within 12 hours."
                type="warning"
                showIcon
                className="enrollment-alert"
              />
            )}
            
            {satEnrollmentStatus.canAccessLearning && userProgress && (
              <div className="continue-learning-section">
                <Card className="learning-card">
                  <div className="learning-header">
                    <h3>Your Learning Progress</h3>
                    <p>Track your journey through the SAT Prep Course</p>
                  </div>
                  
                  <div className="learning-stats">
                    <div className="stat-item">
                      <div className="stat-number">{userProgress.completedLessons || 0}</div>
                      <div className="stat-label">Lessons Completed</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{userProgress.totalLessons || 0}</div>
                      <div className="stat-label">Total Lessons</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{Math.round(userProgress.overallProgress || 0)}%</div>
                      <div className="stat-label">Overall Progress</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{Math.round((userProgress.totalTimeWatched || 0) / 60)}m</div>
                      <div className="stat-label">Time Watched</div>
                    </div>
                  </div>
                  
                  <div className="progress-bar-container">
                    <Progress 
                      percent={Math.round(userProgress.overallProgress || 0)} 
                      strokeColor="#8b0000"
                      trailColor="#f0f0f0"
                    />
                  </div>
                  
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={handleContinueLearning}
                    icon={<PlayCircleOutlined />}
                    className="continue-learning-btn"
                  >
                    Continue Learning
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="sat-features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Our SAT Prep Program?</h2>
            <p>Comprehensive preparation designed to maximize your score potential</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card" hoverable>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section className="mentors-section">
        {/* Background Image */}
        <img 
          src="/img/yale.jpeg" 
          alt="University Background" 
          className="mentors-bg-image"
          onError={(e) => {
            console.error('Background image failed to load:', e);
            e.currentTarget.src = '/img/students.jpeg';
          }}
        />
        
        <div className="section-header">
          <div className="header-content">
            <h2>Meet Your Instructor</h2>
            <p>Learn from an expert who has helped thousands of students achieve their target SAT scores</p>
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

      {/* Curriculum Section */}
      <section className="sat-curriculum">
        <div className="container">
          <div className="section-header">
            <h2>Complete SAT Curriculum</h2>
            <p>Structured learning path with video lessons, practice questions, and mock exams. Each lesson includes a video followed by a set of questions to reinforce your understanding.</p>
          </div>
          <div className="curriculum-grid">
            {curriculum.map((section, index) => (
              <div key={index} className="curriculum-card">
                <div className="curriculum-card-content">
                  <div className="curriculum-icon-section">
                    <h3 className="curriculum-title">{section.section}</h3>
                    <p className="curriculum-description">{section.description}</p>
                  </div>
                  <div className="curriculum-modules-wrapper">
                    <div className="modules-grid">
                      {section.modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="curriculum-module">
                          <h4 className="module-title">{module.name}</h4>
                        </div>
                      ))}
                    </div>
                    <div className="curriculum-features">
                      {section.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="feature-badge">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="sat-testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>Real results from students who completed our SAT prep program</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-score">
                    <TrophyOutlined />
                    <div>
                      <div className="score-value">{testimonial.score}</div>
                      <div className="score-improvement">{testimonial.improvement}</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <StarOutlined key={i} />
                    ))}
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">— {testimonial.name}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      {/* {isAuthenticated && !satEnrollmentStatus?.isEnrolled && (
        <section className="pricing-section">
          <div className="section-header">
            <div className="header-content">
              <h2>SAT Prep Course Pricing</h2>
              <p>One comprehensive tier with everything you need to succeed</p>
            </div>
          </div>
          {pricingLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : pricing ? (
            <div className="pricing-grid">
              <Card className="pricing-card" hoverable>
                <div className="pricing-header">
                  <h3>SAT Prep Course</h3>
                  <div className="price">
                    <span className="currency">{pricing.currency}</span>
                    <span className="amount">{pricing.standardPrice}</span>
                    <span className="period">One Time</span>
                  </div>
                </div>
                <div className="pricing-features">
                  <ul>
                    <li><CheckCircleOutlined /> Complete SAT curriculum</li>
                    <li><CheckCircleOutlined /> Video lessons with expert instructors</li>
                    <li><CheckCircleOutlined /> Practice questions per lesson to reinforce understanding</li>
                    <li><CheckCircleOutlined /> Full-length practice tests</li>
                    <li><CheckCircleOutlined /> Mock exams with detailed feedback</li>
                    <li><CheckCircleOutlined /> Progress tracking and analytics</li>
                  </ul>
                </div>
                <Button
                  type="default"
                  size="large"
                  block
                  onClick={handleEnroll}
                  loading={isEnrolling}
                  className="enroll-button"
                >
                  Enroll Now
                </Button>
              </Card>
            </div>
          ) : null}
        </section>
      )} */}

      {/* CTA Section */}
      {(!isAuthenticated || !satEnrollmentStatus?.isEnrolled) && (
        <section className="sat-cta">
          <div className="cta-content">
            <h2>Ready to Achieve Your Target Score?</h2>
            <p>Join hundreds of students who have improved their SAT scores with our proven program</p>
            <div className="cta-stats">
              <div className="cta-stat">
                <div className="cta-stat-value">3000+</div>
                <div className="cta-stat-label">Practice Questions</div>
              </div>
              <div className="cta-stat">
                <div className="cta-stat-value">200+</div>
                <div className="cta-stat-label">Students with SAT 1400+</div>
              </div>
              <div className="cta-stat">
                <div className="cta-stat-value">1590</div>
                <div className="cta-stat-label">Scores up to 1590</div>
              </div>
            </div>
            <Button 
              type="primary" 
              size="large"
              className="cta-button-large"
              onClick={isAuthenticated ? handleEnroll : () => navigate('/auth/signup')}
              loading={isEnrolling}
            >
              {isAuthenticated ? 'Enroll Now' : 'Start Your Journey'}
            </Button>
          </div>
        </section>
      )}

      {/* Video Preview Modal */}
      <Modal
        title="SAT Prep Course Preview"
        open={isVideoModalVisible}
        onCancel={handleModalClose}
        afterClose={handleModalClose}
        footer={null}
        width={900}
        centered
        destroyOnClose={true}
      >
        <div className="video-modal-content">
          {videoSrc && (
            <iframe
              ref={iframeRef}
              width="100%"
              height="500"
              src={videoSrc}
              title="SAT Prep Course Preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SatPage;

