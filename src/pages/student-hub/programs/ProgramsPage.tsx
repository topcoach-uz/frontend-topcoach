import React from 'react';
import { Card, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './ProgramsPage.scss';

const ProgramsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="programs-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
          Programs
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          Manage your admissions programs, workshops, and mentorship programs
        </p>
      </div>

      <Card>
        <Empty
          description="No programs enrolled at the moment"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default ProgramsPage;
