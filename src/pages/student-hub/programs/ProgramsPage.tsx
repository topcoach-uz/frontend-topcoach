import React from 'react';
import { Card, Empty, Button, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import './ProgramsPage.scss';

const PROGRAMS = [
  {
    id: 'admissions',
    title: 'TopCoach Admissions Program',
    description: 'Comprehensive admissions guidance with mentorship, essay support, and strategic application planning for top universities.',
    link: '/programs/admissions',
    image: '/img/students.jpeg', // Same hero image as admissions landing page
  },
];

const ProgramsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="programs-page">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          Discover and enroll in admissions programs, workshops, and mentorship
        </p>
      </div>

      <div className="programs-page-cards">
        {PROGRAMS.map((program) => (
          <Card
            key={program.id}
            className="program-card"
            hoverable
          >
            <Link to={program.link} className="program-card-link">
              <Row gutter={24} align="middle">
                <Col flex="none">
                  <div className="program-card-image-wrap">
                    <img
                      src={program.image}
                      alt={program.title}
                      className="program-card-image"
                    />
                  </div>
                </Col>
                <Col flex="auto">
                  <h3 className="program-card-title">{program.title}</h3>
                  <p className="program-card-description">{program.description}</p>
                  <Button
                    type="primary"
                    size="middle"
                    style={{ marginTop: 8 }}
                    icon={<ArrowRightOutlined />}
                  >
                    View Program
                  </Button>
                </Col>
              </Row>
            </Link>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 12, fontWeight: 600 }}>Your Enrolled Programs</h4>
        <Empty
          description="No programs enrolled at the moment"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default ProgramsPage;
