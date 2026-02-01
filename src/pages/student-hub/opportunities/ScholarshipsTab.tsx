import React, { useState, useCallback } from 'react';
import { Card, Empty, Spin, Button, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useGetScholarshipsQuery, useGetScholarshipByIdQuery } from '../../../app/services/student-hub/scholarshipOwlApi';
import type { ScholarshipOwlScholarship, ScholarshipOwlScholarshipDetail } from '../../../app/services/student-hub/scholarshipOwlApi';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import ScholarshipDetailModal from './ScholarshipDetailModal';
import './ScholarshipsTab.scss';

const { Text } = Typography;

const formatAmount = (amount: number, awards: number): string => {
  if (amount <= 0) return 'Amount varies';
  if (awards > 1) return `$${amount.toLocaleString()} × ${awards} award${awards > 1 ? 's' : ''}`;
  return `$${amount.toLocaleString()}`;
};

const formatDeadline = (deadline: string): string => {
  if (!deadline) return '';
  const d = dayjs(deadline);
  const now = dayjs();
  if (d.isBefore(now)) return `Closed ${d.format('MMM D, YYYY')}`;
  const days = d.diff(now, 'day');
  if (days <= 7) return `Due ${d.format('MMM D')} (${days} day${days !== 1 ? 's' : ''} left)`;
  return `Due ${d.format('MMM D, YYYY')}`;
};

const isExpired = (deadline: string, expiredAt: string | null): boolean => {
  if (expiredAt) return true;
  if (!deadline) return false;
  return dayjs(deadline).isBefore(dayjs());
};

const ScholarshipCard: React.FC<{
  scholarship: ScholarshipOwlScholarship;
  onViewDetails: (id: string) => void;
}> = ({ scholarship, onViewDetails }) => {
  const expired = isExpired(scholarship.deadline, scholarship.expiredAt);
  const amountStr = formatAmount(scholarship.amount, scholarship.awards);
  const deadlineStr = formatDeadline(scholarship.deadline);

  return (
    <Card
      className="scholarship-card"
      hoverable
      bordered
    >
      <div className="scholarship-card-inner">
        <div className="scholarship-card-icon">
          <UnifiedIcon name="scholarships" size="lg" color="primary" />
        </div>
        <div className="scholarship-card-body">
          <h3 className="scholarship-card-title">{scholarship.title}</h3>
          <div className="scholarship-card-meta">
            <Tag color={expired ? 'default' : 'green'} className="scholarship-amount">
              {amountStr}
            </Tag>
            {deadlineStr && (
              <span className="scholarship-deadline">
                <UnifiedIcon name="clock" size="xs" />
                {deadlineStr}
              </span>
            )}
          </div>
          {scholarship.description && (
            <p className="scholarship-card-description">
              {scholarship.description.length > 140
                ? `${scholarship.description.slice(0, 140).trim()}…`
                : scholarship.description}
            </p>
          )}
          <Button
            type="primary"
            size="middle"
            className="scholarship-card-cta"
            onClick={() => onViewDetails(scholarship.id)}
            disabled={expired}
          >
            View details & requirements
          </Button>
        </div>
      </div>
    </Card>
  );
};

const ScholarshipsTab: React.FC = () => {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const size = 12;

  const { data, isLoading, isError } = useGetScholarshipsQuery(
    { page, size },
    { skip: false }
  );

  const scholarships = data?.data ?? [];
  const hasNext = !!data?.next || (scholarships.length >= size && scholarships.length > 0);

  const handleViewDetails = useCallback((id: string) => setDetailId(id), []);
  const handleCloseDetail = useCallback(() => setDetailId(null), []);

  if (isLoading && scholarships.length === 0) {
    return (
      <div className="opportunities-tab-content scholarships-tab">
        <div className="scholarships-loading">
          <Spin size="large" />
          <p>Loading scholarships…</p>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && scholarships.length === 0)) {
    return (
      <div className="opportunities-tab-content scholarships-tab">
        <Empty
          description={
            isError
              ? 'Unable to load scholarships. Please try again later.'
              : 'No scholarships available at the moment.'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="opportunities-tab-content scholarships-tab">
      <div className="scholarships-header">
        <p className="scholarships-subtitle">
          Browse scholarships and see what’s required before you apply elsewhere
        </p>
      </div>

      <div className="scholarships-grid">
        {scholarships.map((s) => (
          <ScholarshipCard
            key={s.id}
            scholarship={s}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {hasNext && (
        <div className="scholarships-load-more">
          <Button
            onClick={() => setPage((p) => p + 1)}
            loading={isLoading}
            size="middle"
          >
            Load more
          </Button>
        </div>
      )}

      {detailId && (
        <ScholarshipDetailModal
          scholarshipId={detailId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default ScholarshipsTab;
