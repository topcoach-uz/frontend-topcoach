import React from 'react';
import { Card, Tabs, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import ProgramsPage from '../programs/ProgramsPage';
import './OpportunitiesPage.scss';

const OpportunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'scholarships';

  const tabItems = [
    {
      key: 'scholarships',
      label: (
        <span>
          <UnifiedIcon name="scholarships" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('studentHub.opportunities.scholarships', 'Scholarships')}
        </span>
      ),
      children: (
        <div className="opportunities-tab-content">
          <Empty
            description={t('studentHub.opportunities.noScholarships', 'No scholarships available at the moment')}
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
          {t('studentHub.opportunities.programs', 'Programs')}
        </span>
      ),
      children: <ProgramsPage />,
    },
    {
      key: 'events',
      label: (
        <span>
          <UnifiedIcon name="calendar" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('studentHub.opportunities.eventsCamps', 'Events & Camps')}
        </span>
      ),
      children: (
        <div className="opportunities-tab-content">
          <Empty
            description={t('studentHub.opportunities.noEvents', 'No events available at the moment')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="opportunities-page student-hub-page">
      <div style={{ marginBottom: 24 }}>
        <h1 className="student-hub-page-title">{t('studentHub.opportunities.title', 'Opportunities')}</h1>
        <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
          {t('studentHub.opportunities.subtitle', 'Discover scholarships, programs, and events to enhance your college journey')}
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
