import React from 'react';
import { Card, Tabs, Empty } from 'antd';
import { useSearchParams } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import ProgramsPage from '../programs/ProgramsPage';
import './OpportunitiesPage.scss';

const OpportunitiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'scholarships';

  const tabItems = [
    {
      key: 'scholarships',
      label: (
        <span>
          <UnifiedIcon name="scholarships" size="sm" color="primary" style={{ marginRight: 8 }} />
          Scholarships
        </span>
      ),
      children: (
        <div className="opportunities-tab-content">
          <Empty
            description="No scholarships available at the moment"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ),
    },
    {
      key: 'programs',
      label: (
        <span>
          <UnifiedIcon name="programs" size="sm" color="primary" style={{ marginRight: 8 }} />
          Programs
        </span>
      ),
      children: <ProgramsPage />,
    },
    {
      key: 'events',
      label: (
        <span>
          <UnifiedIcon name="calendar" size="sm" color="primary" style={{ marginRight: 8 }} />
          Events & Camps
        </span>
      ),
      children: (
        <div className="opportunities-tab-content">
          <Empty
            description="No events available at the moment"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="opportunities-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
          Opportunities
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          Discover scholarships, programs, and events to enhance your college journey
        </p>
      </div>

      <Card>
        <Tabs
          activeKey={activeTabFromUrl}
          onChange={(key) => {
            setSearchParams({ tab: key });
          }}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default OpportunitiesPage;
