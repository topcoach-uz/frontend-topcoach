import React from 'react';
import DocumentsPage from 'src/pages/student-hub/documents/DocumentsPage';
import { StudentContext } from '../context/StudentContext';
import { useGetDocumentsQuery } from 'src/app/services/student-hub/documentManagementApi';
import './readonly-overlay.scss';
import './documents-readonly.scss';

interface StudentHubDocumentsProps {
  studentId: string;
}

const StudentHubDocuments: React.FC<StudentHubDocumentsProps> = ({ studentId }) => {
  const { data: documentsResponse } = useGetDocumentsQuery({ page: 1, limit: 100 });
  const documents = documentsResponse?.data || [];
  const documentsCount = documents.length;

  return (
    <StudentContext.Provider value={{ studentId, readOnly: true }}>
      <div className="readonly-wrapper documents-readonly-wrapper">
        <DocumentsPage hideStats={true} documentCount={documentsCount} />
        <div className="readonly-overlay" />
      </div>
    </StudentContext.Provider>
  );
};

export default StudentHubDocuments;

