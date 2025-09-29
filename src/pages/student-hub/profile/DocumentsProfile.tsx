import React from 'react';
import { Card } from 'antd';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { DOCUMENT_ICONS } from '../../../constants/icons';

interface DocumentsProfileProps {
  data: {
    completed: boolean;
    percentage: number;
    lastUpdated: string;
  };
}

const DocumentsProfile: React.FC<DocumentsProfileProps> = ({ data }) => {
  return (
    <div className="documents-profile">
      <Card title="Documents" className="section-card">
        <div className="coming-soon">
          <FontAwesomeIcon icon={DOCUMENT_ICONS.PDF} size="2xl" />
          <h3>Documents Management Coming Soon</h3>
          <p>This section will include document upload, management, and verification.</p>
        </div>
      </Card>
    </div>
  );
};

export default DocumentsProfile;