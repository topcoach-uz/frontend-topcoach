import React, { useState } from 'react';
import { Card, Button, List, Upload, message, Row, Col, Tag, Space, Tabs, Input, Modal, Select, Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../../lib/i18n';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { 
  useGetDocumentsQuery, 
  useUploadDocumentMutation, 
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  DOCUMENT_CATEGORIES,
  DocumentType
} from '../../../app/services/student-hub/documentManagementApi';
import { useGetStudentJourneyDocumentsQuery } from '../../../app/services/student-hub/studentJourneyReadonlyApi';
import { baseUrl } from '../../../app/services/api/const';
import { StudentDocument } from '../../../app/services/student-hub/types';
import './DocumentsPage.scss';

const { Dragger } = Upload;
const { Option } = Select;

interface DocumentsPageProps {
  hideStats?: boolean;
  documentCount?: number;
  readOnly?: boolean;
  studentId?: string;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ hideStats = false, documentCount = 0, readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const isReadOnly = readOnly === true;
  
  // Helper function to get translated category labels
  const getTranslatedCategoryLabel = (type: string): string => {
    const categoryMap: { [key: string]: string } = {
      'transcript': t('studentHub.documents.categories.officialTranscripts'),
      'test_score': t('studentHub.documents.categories.testScores'),
      'recommendation': t('studentHub.documents.categories.lettersOfRecommendation'),
      'certificate': t('studentHub.documents.categories.awardsCertificates'),
      'resume': t('studentHub.documents.categories.resumeCv'),
      'portfolio': t('studentHub.documents.categories.portfolio'),
      'other': t('studentHub.documents.categories.otherDocuments'),
    };
    if (categoryMap[type]) {
      return categoryMap[type];
    }
    // Safely access DOCUMENT_CATEGORIES - only for types that exist
    const categoryKey = type as keyof typeof DOCUMENT_CATEGORIES;
    if (categoryKey in DOCUMENT_CATEGORIES) {
      return DOCUMENT_CATEGORIES[categoryKey]?.label || type;
    }
    return type;
  };
  
  // Helper function to get translated category descriptions
  const getTranslatedCategoryDescription = (type: string): string => {
    const descMap: { [key: string]: string } = {
      'transcript': t('studentHub.documents.categories.officialTranscriptsDesc'),
      'test_score': t('studentHub.documents.categories.testScoresDesc'),
      'recommendation': t('studentHub.documents.categories.lettersOfRecommendationDesc'),
      'certificate': t('studentHub.documents.categories.awardsCertificatesDesc'),
      'resume': t('studentHub.documents.categories.resumeCvDesc'),
      'portfolio': t('studentHub.documents.categories.portfolioDesc'),
      'other': t('studentHub.documents.categories.otherDocumentsDesc'),
    };
    if (descMap[type]) {
      return descMap[type];
    }
    // Safely access DOCUMENT_CATEGORIES - only for types that exist
    const categoryKey = type as keyof typeof DOCUMENT_CATEGORIES;
    if (categoryKey in DOCUMENT_CATEGORIES) {
      return DOCUMENT_CATEGORIES[categoryKey]?.description || '';
    }
    return '';
  };
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [fileList, setFileList] = useState<any[]>([]);

  // API hooks - use different API based on read-only mode
  // Normal mode - fetch current user's documents
  const { data: documentsResponse, isLoading: documentsLoading, refetch: refetchDocuments } = useGetDocumentsQuery(
    { 
      page: 1, 
      limit: 100,
      documentType: selectedCategory === 'all' ? undefined : selectedCategory
    },
    { skip: isReadOnly }
  );
  
  // Read-only mode - fetch student's documents via counselor API
  const { data: readOnlyDocumentsResponse, isLoading: readOnlyDocumentsLoading } = useGetStudentJourneyDocumentsQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  
  const [uploadDocument, { isLoading: uploadLoading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: deleteLoading }] = useDeleteDocumentMutation();
  const [downloadDocument] = useDownloadDocumentMutation();

  // Data processing - use merged data based on mode
  const allDocuments = isReadOnly 
    ? (readOnlyDocumentsResponse?.data || []) 
    : (documentsResponse?.data || []);
  const filteredDocuments = allDocuments.filter(doc =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Always use the actual document count from the data
  const totalDocumentCount = documentCount !== undefined && documentCount !== 0 ? documentCount : allDocuments.length;
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.documentType]) acc[doc.documentType] = [];
    acc[doc.documentType].push(doc);
    return acc;
  }, {} as Record<DocumentType, StudentDocument[]>);

  // Event handlers
  const handleUploadDocument = () => {
    setUploadModalVisible(true);
  };

  const handleUploadSubmit = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('documentType', selectedDocumentType);

      await uploadDocument(formData).unwrap();
      message.success('Document uploaded successfully!');
      setUploadModalVisible(false);
      setFileList([]);
      refetchDocuments();
    } catch (error) {
      message.error('Failed to upload document. Please try again.');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Modal.confirm({
      title: 'Delete Document',
      content: 'Are you sure you want to delete this document? This action cannot be undone.',
      icon: <UnifiedIcon name="alert-circle" size="sm" color="#ff4d4f" />,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDocument(documentId).unwrap();
          message.success('Document deleted successfully');
          refetchDocuments();
        } catch (error) {
          message.error('Failed to delete document');
        }
      },
    });
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      console.log('🎯 Frontend: Starting download for document ID:', documentId);
      
      // Find the document to get the original filename
      const doc = filteredDocuments.find(d => d.id === documentId);
      const fileName = doc?.fileName || `document-${documentId}.pdf`;
      
      // Use direct fetch instead of RTK Query to avoid parsing issues
      const token = localStorage.getItem('TOP_COACH_ACCESS_TOKEN') || sessionStorage.getItem('TOP_COACH_ACCESS_TOKEN') || '';
      console.log('🎯 Using token for download:', token ? 'Token present' : 'No token');
      console.log('🎯 Token value:', token);
      console.log('🎯 All localStorage keys:', Object.keys(localStorage));
      console.log('🎯 All sessionStorage keys:', Object.keys(sessionStorage));
      
      const response = await fetch(`${baseUrl}/document-management/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/octet-stream',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('🎯 Frontend: Blob received:', {
        size: blob.size,
        type: blob.type,
        fileName: fileName
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      message.success(t('studentHub.documents.downloadSuccess'));
    } catch (error) {
      console.error('🎯 Frontend: Download error:', error);
      message.error(t('studentHub.documents.downloadError'));
    }
  };

  const getStatusColor = (isVerified: boolean) => {
    return isVerified ? 'success' : 'processing';
  };

  const getStatusText = (isVerified: boolean) => {
    return isVerified ? t('studentHub.documents.verified') : t('studentHub.documents.pendingReview');
  };

  const formatFileSize = (bytes?: number | string) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    // Handle string conversion more robustly
    let numBytes: number;
    if (typeof bytes === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleanString = bytes.replace(/[^\d.]/g, '');
      numBytes = parseFloat(cleanString);
    } else {
      numBytes = bytes;
    }
    
    if (isNaN(numBytes) || numBytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    
    // Ensure i doesn't exceed array bounds
    const sizeIndex = Math.min(i, sizes.length - 1);
    const result = Math.round(numBytes / Math.pow(1024, sizeIndex) * 100) / 100 + ' ' + sizes[sizeIndex];
    return result;
  };

  const formatDate = (dateString: string) => {
    const localeMap: { [key: string]: string } = {
      en: 'en-US',
      ru: 'ru-RU',
      uz: 'uz-UZ',
      kk: 'ru-RU',
    };
    const lang = i18n.language || 'en';
    const mappedLocale = localeMap[lang] || 'en-US';
    return new Date(dateString).toLocaleDateString(mappedLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (documentsLoading) {
    return (
      <div className="documents-loading">
        <Spin size="large" />
        <p>{t('studentHub.documents.loading')}</p>
      </div>
    );
  }

  return (
    <div className="documents-page">
      {/* Compact Header */}
      <div className="documents-page-header">
        <div className="documents-page-header-left">
          <h1 className="documents-page-title">
            {t('studentHub.documents.title')} <span className="documents-page-count">({totalDocumentCount})</span>
          </h1>
          <p className="documents-page-subtitle">{t('studentHub.documents.subtitle')}</p>
        </div>
        <div className="documents-page-header-actions">
          <Input
            className="documents-search-input"
            placeholder={t('studentHub.documents.searchDocuments')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<UnifiedIcon name="search" size="sm" color="secondary" />}
            allowClear
          />
          <Button
            type="primary"
            className="documents-upload-btn"
            icon={<UnifiedIcon name="upload" size="sm" color="white" />}
            onClick={handleUploadDocument}
          >
            {t('studentHub.documents.uploadDocument')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="documents-main-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={[
            {
              key: 'overview',
              label: t('studentHub.documents.overview'),
              children: (
                <div className="documents-overview">
                  <Row gutter={[12, 12]}>
                    {Object.entries(DOCUMENT_CATEGORIES).map(([type, category]) => {
                      const categoryDocs = documentsByCategory[type as DocumentType] || [];
                      const isRequired = category.required;
                      return (
                        <Col xs={24} sm={12} md={12} lg={8} key={type}>
                          <div
                            className={`documents-category-card ${isRequired ? 'required' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedCategory(type as DocumentType);
                              setActiveTab('documents');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && (setSelectedCategory(type as DocumentType), setActiveTab('documents'))}
                          >
                            <div className="documents-category-icon">
                              <UnifiedIcon name={(category.icon as string) || 'file-text'} size="md" color="primary" />
                            </div>
                            <div className="documents-category-body">
                              <div className="documents-category-title">
                                {getTranslatedCategoryLabel(type)}
                                <Tag className="documents-category-count" color={isRequired ? 'blue' : 'default'}>
                                  {categoryDocs.length}
                                </Tag>
                              </div>
                              <p className="documents-category-desc">{getTranslatedCategoryDescription(type)}</p>
                              <Button
                                type="primary"
                                size="small"
                                className="documents-category-add-btn"
                                icon={<UnifiedIcon name="plus" size="xs" color="white" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocumentType(type as DocumentType);
                                  setUploadModalVisible(true);
                                }}
                              >
                                {t('studentHub.documents.addDocument')}
                              </Button>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )
            },
            {
              key: 'documents',
              label: t('studentHub.documents.allDocuments'),
              children: (
                <div className="documents-list">
                  <div className="documents-list-toolbar">
                    <Select
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      className="documents-list-filter"
                      placeholder={t('studentHub.documents.filterByCategory')}
                      options={[
                        { value: 'all', label: t('studentHub.documents.allCategories') },
                        ...Object.entries(DOCUMENT_CATEGORIES).map(([type, category]) => ({
                          value: type,
                          label: getTranslatedCategoryLabel(type),
                        })),
                      ]}
                    />
                  </div>

                  {filteredDocuments.length > 0 ? (
                    <List
                      dataSource={filteredDocuments}
                      className="documents-list-items"
                      renderItem={(document: StudentDocument) => {
                        const category = DOCUMENT_CATEGORIES[document.documentType as keyof typeof DOCUMENT_CATEGORIES];
                        return (
                          <List.Item className="documents-list-item">
                            <div className="documents-doc-row">
                              <div className="documents-doc-icon">
                                <UnifiedIcon name={(category?.icon as string) || 'file-text'} size="md" color="primary" />
                              </div>
                              <div className="documents-doc-info">
                                <span className="documents-doc-title">{document.fileName}</span>
                                <div className="documents-doc-meta">
                                  <Tag className="documents-doc-tag">{category?.label ?? document.documentType}</Tag>
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span>{formatDate(document.createdAt)}</span>
                                </div>
                              </div>
                              <Space size="small" className="documents-doc-actions">
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<UnifiedIcon name="download" size="sm" color="white" />}
                                  onClick={() => handleDownloadDocument(document.id)}
                                  className="documents-doc-download-btn"
                                >
                                  {t('studentHub.documents.download')}
                                </Button>
                                <Button
                                  className="btn-delete-crimson"
                                  size="small"
                                  icon={<UnifiedIcon name="trash-2" size="sm" color="white" />}
                                  onClick={() => handleDeleteDocument(document.id)}
                                  loading={deleteLoading}
                                >
                                  {t('studentHub.documents.delete')}
                                </Button>
                              </Space>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty
                      className="documents-empty"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('studentHub.documents.noDocuments') || 'No documents uploaded yet'}
                    >
                      <Button type="primary" icon={<UnifiedIcon name="upload" size="sm" color="white" />} onClick={handleUploadDocument}>
                        {t('studentHub.documents.uploadDocument')}
                      </Button>
                    </Empty>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload New Document"
        open={uploadModalVisible}
        onOk={handleUploadSubmit}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
        okText="Upload"
        cancelText="Cancel"
        confirmLoading={uploadLoading}
        width={700}
      >
        <div className="upload-modal-content">
          <div className="upload-form-item">
            <label style={{ marginBottom: '6px', display: 'block' }}>{t('studentHub.documents.documentType')}</label>
            <Select
              value={selectedDocumentType}
              onChange={setSelectedDocumentType}
              style={{ 
                width: '100%',
                marginBottom: '16px'
              }}
              placeholder={t('studentHub.documents.selectDocumentType')}
            >
              {Object.entries(DOCUMENT_CATEGORIES).map(([type, category]) => (
                <Option key={type} value={type}>
                  {getTranslatedCategoryLabel(type)}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="upload-form-item">
            <label>{t('studentHub.documents.selectFile')}</label>
            <Dragger
              name="file"
              multiple={false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="upload-dragger"
            >
              <p className="ant-upload-drag-icon">
                <UnifiedIcon name="upload" size="lg" color="primary" />
              </p>
              <p className="ant-upload-text">{t('studentHub.documents.uploadInstructions')}</p>
              <p className="ant-upload-hint">
                {t('studentHub.documents.uploadHint')}
              </p>
            </Dragger>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;