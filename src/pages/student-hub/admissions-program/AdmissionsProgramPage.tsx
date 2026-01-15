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
  CrownOutlined,
  DownOutlined,
  UpOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useTypedSelector } from 'src/app/store';
import { 
  useGetActivePricingQuery,
  useGetEnrollmentStatusQuery,
  useCreateEnrollmentMutation,
  useGetUserProgressQuery,
  CourseEnrollmentDto,
  ProgramPricingDto
} from 'src/app/services/courses';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import { useAppDispatch } from 'src/app/store';
import { show } from 'src/app/slices/profilePopupSlice';
import { useNavigate, Link } from 'react-router-dom';
import { ReferralCodeDisplay } from 'src/components/referral/ReferralCodeDisplay';
import VideoPreviewSection from 'src/components/video-preview/VideoPreviewSection';
import './AdmissionsProgramPage.scss';

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

const AdmissionsProgramPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useTypedSelector(state => state.auth);
  const [selectedPlan, setSelectedPlan] = useState<CourseTypeEnum | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [showDetailedSections, setShowDetailedSections] = useState(false);
  const dispatch = useAppDispatch();

  // Helper function to get translated plan type
  const getTranslatedPlanType = (planType: string): string => {
    return planType === 'standard' ? t('pricing.standard') : t('pricing.premium');
  };

  // Helper function to get enrollment message key
  const getEnrollmentMessageKey = (planType: string): string => {
    return planType === 'standard' ? 'programs.enrollment.enrolledStandard' : 'programs.enrollment.enrolledPremium';
  };

  // Define mentors inside component where t function is available
  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'Zafar Akhtamov',
      university: 'Babson College',
      scholarship: 'Full Ride $345,000',
      image: '/img/zafar_programs.jpeg',
      module: t('programs.mentor.foundations'),
      achievements: [
        t('programs.mentor.flexAlumni'),
        t('programs.mentor.cofounder'),
        t('programs.mentor.topApplicant')
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
      module: t('programs.mentor.essayWriting'),
      achievements: [
        t('programs.mentor.experience'),
        t('programs.mentor.mentoredStudents'),
        t('programs.mentor.offers')
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
      module: t('programs.mentor.portfolioBuilding'),
      achievements: [
        t('programs.mentor.ibratDebate'),
        t('programs.mentor.portfolioStudents'),
        t('programs.mentor.phdCandidates')
      ],
      stats: {
        studentsMentored: '50+',
      }
    }
  ];

  const courseModules: CourseModule[] = [
    {
      title: t('programs.modules.foundations'),
      description: t('programs.modules.foundationsDesc'),
      topics: [t('programs.modules.admissionsCriteria'), t('programs.modules.academicProfile'), t('programs.modules.extracurricular'), t('programs.modules.research')],
      duration: '4 ' + t('programs.modules.weeks')
    },
    {
      title: t('programs.modules.portfolio'),
      description: t('programs.modules.portfolioDesc'),
      topics: [t('programs.modules.portfolioStructure'), t('programs.modules.achievementDoc'), t('programs.modules.leadership'), t('programs.modules.innovation')],
      duration: '3 ' + t('programs.modules.weeks')
    },
    {
      title: t('programs.modules.personalStatement'),
      description: t('programs.modules.personalStatementDesc'),
      topics: [t('programs.modules.storyDev'), t('programs.modules.writingTech'), t('programs.modules.editing'), t('programs.modules.mistakes')],
      duration: '4 ' + t('programs.modules.weeks')
    },
    {
      title: t('programs.modules.supplementalEssays'),
      description: t('programs.modules.supplementalEssaysDesc'),
      topics: [t('programs.modules.essayTypes'), t('programs.modules.universitySpecific'), t('programs.modules.whySchool'), t('programs.modules.whyMajor')],
      duration: '3 ' + t('programs.modules.weeks')
    }
  ];

  // API hooks
  const { data: pricing, isLoading: pricingLoading } = useGetActivePricingQuery();
  const { data: enrollmentStatus, isLoading: statusLoading } = useGetEnrollmentStatusQuery('admissions', {
    skip: !isAuthenticated
  });
  const { data: userProgress } = useGetUserProgressQuery('admissions', {
    skip: !isAuthenticated || !enrollmentStatus?.isEnrolled || !enrollmentStatus?.canAccessLearning
  });
  const { data: telegramStatus } = useGetTelegramStatusQuery(undefined, {
    skip: !isAuthenticated
  });

  const [createEnrollment, { isLoading: creatingEnrollment }] = useCreateEnrollmentMutation();

  useEffect(() => {
    if (pricing) {
      setPricingPlans([
        {
          type: CourseTypeEnum.STANDARD,
          price: pricing.standardPrice,
          currency: pricing.currency,
          features: [
            t('programs.pricing.standardFeatures'),
            t('programs.pricing.standardVideos'),
            t('programs.pricing.standardTemplates'),
            t('programs.pricing.standardSessions'),
            t('programs.pricing.standardHomework'),
            t('programs.pricing.standardTelegram'),
            t('programs.pricing.standardChecklist')
          ]
        },
        {
          type: CourseTypeEnum.PREMIUM,
          price: pricing.premiumPrice,
          currency: pricing.currency,
          features: [
            t('programs.pricing.premiumFeatures'),
            t('programs.pricing.premiumGroup'),
            t('programs.pricing.premiumSessions'),
            t('programs.pricing.premiumZoom'),
            t('programs.pricing.premiumHomework'),
            t('programs.pricing.premiumQA'),
            t('programs.pricing.premiumSupport'),
            t('programs.pricing.premiumSpeakers'),
            t('programs.pricing.premiumNetworking')
          ],
          popular: true
        }
      ]);
    }
  }, [pricing]);

  // Only show loading for pricing data, not enrollment status
  if (pricingLoading) {
    return (
      <div className="admissions-program-page">
        <div className="admissions-loading-content">
          <div className="loading-spinner-container">
            <Spin size="large" />
            <p>Loading program information...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleEnroll = async (planType: CourseTypeEnum) => {
    // Redirect to interest form instead of payment
    navigate('/contact-form');
    return;
  };

  const handleContinueLearning = () => {
    navigate('/learning?course=admissions');
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
    const isEnrolled = enrollmentStatus?.enrollment?.courseType === (planType === CourseTypeEnum.STANDARD ? 'standard' : 'premium');
    return isEnrolled;
  };

  return (
    <div className="admissions-program-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              {t('programs.hero.title')}
              <span className="program-word">{t('programs.hero.program')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('programs.hero.subtitle')} <br />
              {t('programs.hero.description')} <br /> 
              {t('programs.hero.cta')}
            </p>
            <div className="hero-stats">
              <div className="stat">
                <DollarOutlined />
                <div className="stat-content">
                  <span className="stat-value">$737K+</span>
                  <span className="stat-label">{t('programs.stats.scholarships')}</span>
                </div>
              </div>
              <div className="stat">
                <TeamOutlined />
                <div className="stat-content">
                  <span className="stat-value">110+</span>
                  <span className="stat-label">{t('programs.stats.students')}</span>
                </div>
              </div>
              <div className="stat">
                <TrophyOutlined />
                <div className="stat-content">
                  <span className="stat-value">50+</span>
                  <span className="stat-label">{t('programs.stats.universities')}</span>
                </div>
              </div>
            </div>
            <div className="hero-actions">
              <Button 
                type="primary" 
                size="large"
                onClick={() => navigate('/contact-form')}
                icon={<RocketOutlined />}
                className="apply-now-btn"
              >
                {t('programs.stats.applyNow')}
              </Button>
              <Link to="/contact-form">
                <Button 
                  size="large"
                  className="contact-us-btn"
                  icon={<MessageOutlined />}
                >
                  {t('programs.stats.contactUs')}
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <VideoPreviewSection onVideoClick={(video) => console.log('Video clicked:', video)} />
          </div>
        </div>
      </section>

      {/* Enrollment Status */}
      {enrollmentStatus?.isEnrolled && enrollmentStatus.enrollment && (
        <section className="enrollment-status">
          <Alert
            message={
              <div className="enrollment-message">
                {enrollmentStatus.canAccessLearning ? (
                  <>
                    <CheckCircleOutlined />
                    <span>{t(getEnrollmentMessageKey(enrollmentStatus.enrollment.courseType))}</span>
                  </>
                ) : (
                  <>
                    <ClockCircleOutlined />
                    <span>{t('programs.enrollment.pending')}</span>
                  </>
                )}
              </div>
            }
            description={
              enrollmentStatus.canAccessLearning 
                ? t('programs.enrollment.accessGranted')
                : t('programs.enrollment.pendingMessage')
            }
            type={enrollmentStatus.canAccessLearning ? "success" : "warning"}
            showIcon={false}
            className="enrollment-alert"
          />
          
          {/* Continue Learning Section - Only show when enrollment is approved */}
          {userProgress && enrollmentStatus.canAccessLearning && (
            <div className="continue-learning-section">
              <Card className="learning-card">
                <div className="learning-header">
                  <h3>{t('programs.enrollment.learningProgress')}</h3>
                  <p>{t('programs.enrollment.trackJourney')}</p>
                </div>
                
                <div className="learning-stats">
                  <div className="stat-item">
                    <div className="stat-number">{userProgress.completedLessons || 0}</div>
                    <div className="stat-label">{t('programs.enrollment.lessonsCompleted')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{userProgress.totalLessons || 0}</div>
                    <div className="stat-label">{t('programs.enrollment.totalLessons')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{Math.round(userProgress.overallProgress || 0)}%</div>
                    <div className="stat-label">{t('programs.enrollment.overallProgress')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{Math.round((userProgress.totalTimeWatched || 0) / 60)}m</div>
                    <div className="stat-label">{t('programs.enrollment.timeWatched')}</div>
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
                  {t('programs.enrollment.continueLearning')}
                </Button>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* Mentors Section */}
      <section className="mentors-section">
        {/* Background Image */}
        <img 
          src="/img/yale.jpeg" 
          alt={t('programs.stats.universityBackground')} 
          className="mentors-bg-image"
          onError={(e) => {
            console.error('Background image failed to load:', e);
            e.currentTarget.src = '/img/students.jpeg';
          }}
          onLoad={() => console.log('Background image loaded successfully')}
        />
        
        <div className="section-header">
          <div className="header-content">
            <h2>{t('programs.mentors.title')}</h2>
            <p>{t('programs.mentors.description')}</p>
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
                <h4>{t('programs.mentor.keyAchievements')}</h4>
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
                    <span className="stat-label">{t('programs.mentor.studentsMentored')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mentors-actions">
          <Button 
            type="default"
            size="large"
            onClick={() => setShowDetailedSections(!showDetailedSections)}
            icon={showDetailedSections ? <UpOutlined /> : <DownOutlined />}
            className="learn-more-btn"
          >
            {showDetailedSections ? t('pricing.showLess') : t('pricing.learnMore')}
          </Button>
        </div>
      </section>

      {/* Course Modules - Conditional */}
      {showDetailedSections && (
        <section className="modules-section">
        <div className="section-header">
          <div className="header-content">
            <h2>{t('pricing.comprehensiveCourseModules')}</h2>
            <p>{t('pricing.everythingYouNeed')}</p>
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
                <h4>{t('pricing.whatYoullLearn')}</h4>
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
      )}

      {/* What Makes Us Different - Conditional */}
      {showDetailedSections && (
        <section className="different-section">
        <div className="section-header">
          <div className="header-content">
            <h2>{t('pricing.whatMakesUsDifferent')}</h2>
            <p>{t('pricing.uniqueApproach')}</p>
          </div>
        </div>
        <div className="different-grid">
          <div className="different-item">
            <div className="icon">
              <StarOutlined />
            </div>
            <h3>{t('pricing.comprehensiveSupport')}</h3>
            <p>{t('pricing.fromApplicationStrategy')}</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <RocketOutlined />
            </div>
            <h3>{t('pricing.resultsDriven')}</h3>
            <p>{t('pricing.focusOnActionable')}</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <UserOutlined />
            </div>
            <h3>Expert Mentorship</h3>
            <p>Learn from successful graduates who have been through the same journey</p>
          </div>
          <div className="different-item">
            <div className="icon">
              <TrophyOutlined />
            </div>
            <h3>Proven Success</h3>
            <p>Track record of helping students get into top universities worldwide</p>
          </div>
        </div>
      </section>
      )}

      {/* Referral Code Display - Only show for enrolled users with approved status */}
      {enrollmentStatus?.enrollment && enrollmentStatus.canAccessLearning && (
        <section className="referral-section">
          <div className="container">
            <ReferralCodeDisplay />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>{t('pricing.readyToStart')}</h2>
          <p>{t('pricing.joinHundreds')}</p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/contact-form')}
            icon={<RocketOutlined />}
          >
            {t('pricing.getStartedToday')}
          </Button>
        </div>
      </section>
      </div>
  );
};

export default AdmissionsProgramPage;
