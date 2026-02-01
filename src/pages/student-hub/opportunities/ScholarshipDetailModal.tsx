import React from 'react';
import {
  Modal,
  Spin,
  Typography,
  Tag,
  Divider,
  List,
  Empty,
} from 'antd';
import dayjs from 'dayjs';
import { useGetScholarshipByIdQuery } from '../../../app/services/student-hub/scholarshipOwlApi';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './ScholarshipDetailModal.scss';

const { Title, Text, Paragraph } = Typography;

interface ScholarshipDetailModalProps {
  scholarshipId: string;
  onClose: () => void;
}

const formatAmount = (amount: number, awards: number): string => {
  if (amount <= 0) return 'Amount varies';
  if (awards > 1) return `$${amount.toLocaleString()} each (${awards} awards)`;
  return `$${amount.toLocaleString()}`;
};

const getFieldTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    text: 'Text',
    email: 'Email',
    phone: 'Phone',
    date: 'Date',
    option: 'Select option',
  };
  return map[type] ?? type;
};

const getRequirementTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    text: 'Essay / Written response',
    input: 'Short answer',
    link: 'Link (e.g. profile, portfolio)',
    file: 'File upload',
    image: 'Image upload',
  };
  return map[type] ?? type;
};

const ScholarshipDetailModal: React.FC<ScholarshipDetailModalProps> = ({
  scholarshipId,
  onClose,
}) => {
  const { data, isLoading } = useGetScholarshipByIdQuery(scholarshipId);

  const detail = data?.data ?? null;
  const success = data?.success ?? false;

  const expired =
    detail &&
    (detail.expiredAt || (detail.deadline && dayjs(detail.deadline).isBefore(dayjs())));

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={640}
      className="scholarship-detail-modal"
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      {isLoading && !detail ? (
        <div className="scholarship-detail-loading">
          <Spin size="large" />
          <p>Loading details…</p>
        </div>
      ) : !detail || !success ? (
        <Empty description="Could not load scholarship details" />
      ) : (
        <div className="scholarship-detail-content">
          <div className="scholarship-detail-header">
            <div className="scholarship-detail-icon">
              <UnifiedIcon name="scholarships" size="lg" color="primary" />
            </div>
            <div>
              <Title level={4} style={{ margin: '0 0 8px' }}>
                {detail.title}
              </Title>
              <div className="scholarship-detail-meta">
                <Tag color={expired ? 'default' : 'green'}>
                  {formatAmount(detail.amount, detail.awards)}
                </Tag>
                {detail.deadline && (
                  <Text type="secondary">
                    <UnifiedIcon name="clock" size="xs" style={{ marginRight: 4 }} />
                    {expired
                      ? `Closed ${dayjs(detail.deadline).format('MMM D, YYYY')}`
                      : `Due ${dayjs(detail.deadline).format('MMM D, YYYY')}`}
                  </Text>
                )}
              </div>
            </div>
          </div>

          {detail.description && (
            <>
              <Divider orientation="left" plain>
                <Text strong>Description</Text>
              </Divider>
              <Paragraph className="scholarship-detail-description">
                {detail.description}
              </Paragraph>
            </>
          )}

          {detail.fields && detail.fields.length > 0 && (
            <>
              <Divider orientation="left" plain>
                <Text strong>Information you’ll need</Text>
              </Divider>
              <p className="scholarship-detail-hint">
                This scholarship typically asks for the following:
              </p>
              <List
                size="small"
                dataSource={detail.fields}
                renderItem={({ field }) => (
                  <List.Item>
                    <span className="scholarship-detail-field">
                      <UnifiedIcon name="check-square" size="xs" />
                      {field.name}
                      <Tag bordered={false} className="field-type-tag">
                        {getFieldTypeLabel(field.type)}
                      </Tag>
                    </span>
                  </List.Item>
                )}
              />
            </>
          )}

          {detail.requirements && detail.requirements.length > 0 && (
            <>
              <Divider orientation="left" plain>
                <Text strong>Requirements</Text>
              </Divider>
              <p className="scholarship-detail-hint">
                You may need to submit:
              </p>
              <List
                size="small"
                dataSource={detail.requirements}
                renderItem={({ requirement }) => (
                  <List.Item>
                    <div className="scholarship-detail-requirement">
                      <span>
                        <UnifiedIcon name="file-text" size="xs" />
                        {requirement.title}
                        {requirement.optional && (
                          <Tag color="default" className="optional-tag">
                            Optional
                          </Tag>
                        )}
                      </span>
                      <Text type="secondary" className="req-type">
                        {getRequirementTypeLabel(requirement.type)}
                      </Text>
                      {requirement.description && (
                        <Paragraph
                          type="secondary"
                          className="req-description"
                          ellipsis={{ rows: 2, expandable: true }}
                        >
                          {requirement.description}
                        </Paragraph>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </>
          )}

          {(!detail.fields || detail.fields.length === 0) &&
            (!detail.requirements || detail.requirements.length === 0) && (
              <p className="scholarship-detail-no-requirements">
                <Text type="secondary">
                  Check the scholarship provider’s website for specific requirements.
                </Text>
              </p>
            )}
        </div>
      )}
    </Modal>
  );
};

export default ScholarshipDetailModal;
