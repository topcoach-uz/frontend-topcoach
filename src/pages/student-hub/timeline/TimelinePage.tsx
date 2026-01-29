import React from 'react';
import { Card, Empty, Timeline as AntTimeline } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './TimelinePage.scss';

const TimelinePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="timeline-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
          Timeline
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          View your application journey and key milestones over time
        </p>
      </div>

      <Card>
        <Empty
          description="No timeline events yet. Start your journey by completing your profile!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default TimelinePage;
