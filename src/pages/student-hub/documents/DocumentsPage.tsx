import React, { useState, useEffect } from 'react';
import { Card, Button, List, Upload, message, Row, Col, Tag, Space, Progress, Tabs, Input, Modal, Select, Statistic, Badge, Empty, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { 
  useGetDocumentsQuery, 
  useUploadDocumentMutation, 
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useGetDocumentStatsQuery,
  DOCUMENT_CATEGORIES,
  DocumentType
} from '../../../app/services/student-hub/documentManagementApi';
import { baseUrl } from '../../../app/services/api/const';
import { StudentDocument } from '../../../app/services/student-hub/types';
import './DocumentsPage.scss';

const { Dragger } = Upload;
const { Search } = Input;
const { Option } = Select;

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  
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
  const navigate = useNavigate();
  const { profile } = useStudentHub();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [fileList, setFileList] = useState<any[]>([]);

  // API hooks
  const { data: documentsResponse, isLoading: documentsLoading, refetch: refetchDocuments } = useGetDocumentsQuery({ 
    page: 1, 
    limit: 100,
    documentType: selectedCategory === 'all' ? undefined : selectedCategory
  });
  const { data: statsResponse, isLoading: statsLoading } = useGetDocumentStatsQuery();
  const [uploadDocument, { isLoading: uploadLoading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: deleteLoading }] = useDeleteDocumentMutation();
  const [downloadDocument] = useDownloadDocumentMutation();

  // Data processing
  const allDocuments = documentsResponse?.data || [];
  const filteredDocuments = allDocuments.filter(doc =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const stats = statsResponse?.data;
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
      icon: <FontAwesomeIcon icon="exclamation-triangle" style={{ color: '#ff4d4f' }} />,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (documentsLoading || statsLoading) {
    return (
      <div className="documents-loading">
        <Spin size="large" />
        <p>{t('studentHub.documents.loading')}</p>
      </div>
    );
  }

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('studentHub.documents.title')}</h1>
        <p className="page-subtitle">{t('studentHub.documents.subtitle')}</p>
        <div className="page-actions">
          <Input
            placeholder={t('studentHub.documents.searchDocuments')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            prefix={<FontAwesomeIcon icon="search" />}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<FontAwesomeIcon icon="plus" />} 
            onClick={handleUploadDocument}
            size="large"
          >
            {t('studentHub.documents.uploadDocument')}
          </Button>
        </div>
      </div>

      {/* Document Statistics */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={t('studentHub.documents.totalDocuments')}
              value={stats?.total || 0}
              prefix={<FontAwesomeIcon icon="file" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={t('studentHub.documents.storageUsed')}
              value={formatFileSize(stats?.totalSize || 0)}
              prefix={<FontAwesomeIcon icon="hdd" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card className="documents-main-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: t('studentHub.documents.overview'),
              children: (
                <div className="documents-overview">
                  <Row gutter={[24, 24]}>
                    {Object.entries(DOCUMENT_CATEGORIES).map(([type, category]) => {
                      const categoryDocs = documentsByCategory[type as DocumentType] || [];
                      const isRequired = category.required;
                      
                      return (
                        <Col xs={24} md={12} lg={8} key={type}>
                          <Card 
                            className={`category-card ${isRequired ? 'required' : ''}`}
                            hoverable
                            onClick={() => {
                              setSelectedCategory(type as DocumentType);
                              setActiveTab('documents');
                            }}
                          >
                            <div className="category-header">
                              <div className={`category-icon ${category.color}`}>
                                <FontAwesomeIcon icon={category.icon as any} />
                              </div>
                              <div className="category-info">
                                <h4 className="category-title">
                                  {getTranslatedCategoryLabel(type)}
                                </h4>
                                <p className="category-description">{getTranslatedCategoryDescription(type)}</p>
                              </div>
                            </div>
                            <div className="category-stats">
                              <div className="stat-item">
                                <span className="stat-label">{t('studentHub.documents.documents')}:</span>
                                <span className="stat-value">{categoryDocs.length}</span>
                              </div>
                            </div>
                            <div className="category-actions">
                              <Button 
                                type="primary" 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocumentType(type as DocumentType);
                                  setUploadModalVisible(true);
                                }}
                              >
                                <FontAwesomeIcon icon="plus" /> {t('studentHub.documents.addDocument')}
                              </Button>
                            </div>
                          </Card>
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
                  <div className="list-header">
                    <div className="list-filters">
                      <Select
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        style={{ width: 200 }}
                        placeholder={t('studentHub.documents.filterByCategory')}
                      >
                        <Option value="all">{t('studentHub.documents.allCategories')}</Option>
                        {Object.entries(DOCUMENT_CATEGORIES).map(([type, category]) => (
                          <Option key={type} value={type}>
                            {getTranslatedCategoryLabel(type)}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {filteredDocuments.length > 0 ? (
                    <List
                      dataSource={filteredDocuments}
                      renderItem={(document: StudentDocument) => {
                        const category = DOCUMENT_CATEGORIES[document.documentType as keyof typeof DOCUMENT_CATEGORIES];
                        return (
                          <List.Item className="document-item">
                            <Card className="document-card">
                              <Row gutter={[16, 16]} align="middle">
                                <Col xs={24} md={16}>
                                  <div className="document-info">
                                    <div className="document-header">
                                      <div className={`document-icon ${category.color}`}>
                                        <FontAwesomeIcon icon={category.icon as any} />
                                      </div>
                                      <div className="document-details">
                                        <h4 className="document-title">{document.fileName}</h4>
                                        <div className="document-meta">
                                          <Tag color={category.color}>{category.label}</Tag>
                                          <span className="document-size">{formatFileSize(document.fileSize)}</span>
                                          <span className="document-date">{formatDate(document.createdAt)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={24} md={8}>
                                  <div className="document-actions">
                                    <Space>
                                      <Button 
                                        icon={<FontAwesomeIcon icon="download" />}
                                        onClick={() => handleDownloadDocument(document.id)}
                                        size="small"
                                        style={{
                                          backgroundColor: '#8b0000',
                                          borderColor: '#8b0000',
                                          color: 'white',
                                          padding: '6px 12px',
                                          height: 'auto',
                                          minHeight: '32px'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#a00000';
                                          e.currentTarget.style.borderColor = '#a00000';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#8b0000';
                                          e.currentTarget.style.borderColor = '#8b0000';
                                        }}
                                      >
                                        {t('studentHub.documents.download')}
                                      </Button>
                                      <Button 
                                        onClick={() => handleDeleteDocument(document.id)}
                                        size="small"
                                        loading={deleteLoading}
                                        style={{
                                          backgroundColor: '#8b0000',
                                          borderColor: '#8b0000',
                                          color: 'white',
                                          padding: '6px 12px',
                                          height: 'auto',
                                          minHeight: '32px'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#a00000';
                                          e.currentTarget.style.borderColor = '#a00000';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#8b0000';
                                          e.currentTarget.style.borderColor = '#8b0000';
                                        }}
                                      >
                                        {t('studentHub.documents.delete')}
                                      </Button>
                                    </Space>
                                  </div>
                                </Col>
                              </Row>
                            </Card>
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No documents uploaded yet"
                    >
                      <Button type="primary" onClick={handleUploadDocument}>
                        Upload Your First Document
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
                <FontAwesomeIcon icon="cloud-upload-alt" />
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