import React, { useState, useRef } from 'react';
import { Button, Modal } from 'antd';
import { 
  PlayCircleOutlined, 
  CrownOutlined,
  BookOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import MainTitleDescription from 'src/components/mainTitleDesc';
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
          <MainTitleDescription
            title="Our Programs"
            description="Choose the program that best fits your academic goals and unlock your potential"
            mb={24}
          />
        </div>
      </section>

      {/* Programs Grid */}
      <section className="programs-grid-section">
        <div className="programs-container">
          {/* Admissions Program Card */}
          <Link to="/programs/admissions" className="program-card-link">
            <div className="program-card admissions-card">
              <div className="program-visual">
                <div className="preview-image">
                  <img src="/img/students.jpeg" alt="Admissions Program Preview" />
                  <div className="play-overlay" onClick={handleVideoPreviewClick}>
                    <PlayCircleOutlined />
                  </div>
                </div>
              </div>

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
          <Link to="/programs/sat" className="program-card-link">
            <div className="program-card sat-card">
            <div className="program-visual">
                <div className="preview-image">
                  <img src="/img/abdulaziz_sat.jpg" alt="SAT Prep Course Preview" />
                  {/* <div className="play-overlay" onClick={handleVideoPreviewClick}>
                    <PlayCircleOutlined />
                  </div> */}
                </div>
              </div>

              <div className="card-header">
                <div className="program-badge sat-badge">
                  <BookOutlined />
                  <span>SAT Prep</span>
                </div>
                <h2 className="program-title">SAT Prep Course</h2>
                <p className="program-description">
                  Master the SAT with our comprehensive preparation program. Get expert guidance, practice tests, and proven strategies to achieve your target score and boost your college application.
                </p>
            </div>

            <div className="program-actions">
              <Button 
                type="primary" 
                size="large"
                className="sat-apply-btn"
                block
              >
                Learn More
              </Button>
            </div>
          </div>
          </Link>
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