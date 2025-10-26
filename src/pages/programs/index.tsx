import React, { useState, useRef } from 'react';
import { Button, Modal } from 'antd';
import { 
  PlayCircleOutlined, 
  CrownOutlined,
  BookOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  StarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import VideoPreviewSection from 'src/components/video-preview/VideoPreviewSection';
import './index.scss';

const ProgramsPage: React.FC = () => {
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleVideoPreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoSrc('https://www.youtube.com/embed/uaC3wW4JIJA?autoplay=1&rel=0');
    setIsVideoModalVisible(true);
  };

  const handleModalClose = () => {
    setIsVideoModalVisible(false);
    // Stop the video by clearing the src
    setVideoSrc('');
  };

  return (
    <div className="programs-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h1 className="page-title">Our Programs</h1>
          <p className="page-subtitle">
            Choose the program that best fits your academic goals and unlock your potential
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="programs-grid-section">
        <div className="programs-container">
          {/* Admissions Program Card */}
          <Link to="/programs/admissions" className="program-card-link">
            <div className="program-card admissions-card">
              <div className="card-header">
                <div className="program-badge">
                  <CrownOutlined />
                  <span>Admission Program</span>
                </div>
                <h2 className="program-title">TopCoach Admissions Program</h2>
                <p className="program-description">
                  Transform your college journey with insider strategies! Join the program developed by mentors who secured full scholarships to Harvard, Yale, Oxford, and Babson, unlocking over $737,000 in funding.
                </p>
              </div>
              
              <div className="program-stats">
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

              <div className="program-visual">
                <div className="admissions-preview">
                  <div className="preview-image">
                    <img src="/img/students.jpeg" alt="Admissions Program Preview" />
                    <div className="play-overlay" onClick={handleVideoPreviewClick}>
                      <PlayCircleOutlined />
                    </div>
                  </div>
                  <div className="preview-info">
                    <h4>Watch Course Preview</h4>
                    <p>See how our admissions program can help you achieve your goals</p>
                  </div>
                </div>
              </div>

              <div className="program-actions">
                <Button 
                  type="primary" 
                  size="large"
                  className="apply-now-btn"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </Link>

          {/* SAT Course Card */}
          <div className="program-card sat-card coming-soon">
            <div className="card-header">
              <div className="program-badge sat-badge">
                <BookOutlined />
                <span>Coming Soon</span>
              </div>
              <h2 className="program-title">SAT Prep Course</h2>
              <p className="program-description">
                Master the SAT with our comprehensive preparation program. Get expert guidance, practice tests, and proven strategies to achieve your target score and boost your college application.
              </p>
            </div>
            
            <div className="program-stats">
              <div className="stat">
                <StarOutlined />
                <div className="stat-content">
                  <span className="stat-value">1500+</span>
                  <span className="stat-label">Average Score</span>
                </div>
              </div>
              <div className="stat">
                <UserOutlined />
                <div className="stat-content">
                  <span className="stat-value">200+</span>
                  <span className="stat-label">Students Helped</span>
                </div>
              </div>
              <div className="stat">
                <SafetyCertificateOutlined />
                <div className="stat-content">
                  <span className="stat-value">95%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>

            <div className="program-visual">
              <div className="sat-preview">
                <div className="preview-image">
                  <img src="/img/coming.jpg" alt="SAT Prep Course Preview" />
                  {/* <div className="play-overlay" onClick={handleVideoPreviewClick}>
                    <PlayCircleOutlined />
                  </div> */}
                </div>
                <div className="preview-info">
                  <h4>Watch Course Preview</h4>
                  <p>See how our SAT prep can help you achieve your goals</p>
                </div>
              </div>
            </div>

            <div className="program-actions">
              <Button 
                type="primary" 
                size="large"
                className="sat-apply-btn"
                // icon={<BookOutlined />}
                disabled
                block
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Preview Modal */}
      <Modal
        title="Course Preview"
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
              title="Course Preview"
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

export default ProgramsPage; 