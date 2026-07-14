import React from 'react';
import DocumentsPage from 'src/pages/student-hub/documents/DocumentsPage';
import { useGetStudentJourneyDocumentsQuery } from 'src/app/services/student-hub/studentJourneyReadonlyApi';
import './readonly-overlay.scss';
import './documents-readonly.scss';

interface StudentHubDocumentsProps {
  studentId: string;
  studentName?: string;
}

const StudentHubDocuments: React.FC<StudentHubDocumentsProps> = ({ studentId, studentName }) => {
  // Fetch student's documents via counselor API
  const { data: documentsResponse } = useGetStudentJourneyDocumentsQuery(studentId);
  const documents = documentsResponse?.data || [];
  const documentsCount = documents.length;

  // Pass props directly to DocumentsPage - no context needed
  return (
    <div className="readonly-wrapper documents-readonly-wrapper">
      <DocumentsPage 
        hideStats={true} 
        documentCount={documentsCount} 
        readOnly={true} 
        studentId={studentId} 
      />
      <div className="readonly-overlay" />
    </div>
  );
};

export default StudentHubDocuments;

