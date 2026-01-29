import React from 'react';
import { Card, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './UniversityMatcherPage.scss';

const UniversityMatcherPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="university-matcher-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
          University Matcher
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          Discover universities based on your psychometric assessment results
        </p>
      </div>

      <Card>
        <Empty
          description="Complete your Major Match assessment to see university recommendations"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default UniversityMatcherPage;
