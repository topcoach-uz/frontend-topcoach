import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Row, Col, List, Badge, Space, Tag, Progress, Input, Select, message, Modal, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, BulbOutlined, FileSearchOutlined } from '@ant-design/icons';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ESSAY_ICONS, STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { useGetStudentEssaysQuery, useDeleteStudentEssayMutation } from '../../../app/services/student-hub/essayManagementApi';
import { baseUrl } from '../../../app/services/api/const';
import NewEssayPage from './NewEssayPage';
import WriteTab from './components/WriteTab';
import AIFeedbackTab from './components/AIFeedbackTab';
import './EssaysPage.scss';

const { Option } = Select;

const EssaysPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('write');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { dashboard, isLoading } = useStudentHub();
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const [deleteStudentEssay, { isLoading: isDeleting }] = useDeleteStudentEssayMutation();

  // Handle URL parameters for tab navigation and essay editing
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['write', 'my-essays', 'templates', 'ai-feedback'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Get essayId from URL for editing
  const essayIdFromUrl = searchParams.get('essayId');

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Clear essayId when switching tabs (except when explicitly editing)
    if (key !== 'write' || !searchParams.get('essayId')) {
      const newParams = new URLSearchParams();
      newParams.set('tab', key);
      setSearchParams(newParams);
    } else {
      setSearchParams({ tab: key });
    }
  };

  // Use real data from API
  const essaysData = {
    overview: {
      totalEssays: essaysResponse?.data?.length || 0,
      inProgress: essaysResponse?.data?.filter(e => e.status === 'draft').length || 0,
      completed: essaysResponse?.data?.filter(e => e.status === 'final').length || 0,
      submitted: essaysResponse?.data?.filter(e => e.status === 'submitted').length || 0,
      wordCount: essaysResponse?.data?.reduce((sum, e) => sum + (e.wordCount || 0), 0) || 0,
    },
    essays: essaysResponse?.data || [],
    templates: [
      {
        id: 1,
        title: 'Personal Statement Template',
        type: 'personal_statement',
        description: 'A comprehensive template for personal statements',
        wordCount: 650,
        difficulty: 'intermediate',
        downloads: 1250,
        rating: 4.8,
      },
      {
        id: 2,
        title: 'Why This School Essay',
        type: 'supplemental',
        description: 'Template for explaining why you want to attend a specific school',
        wordCount: 300,
        difficulty: 'beginner',
        downloads: 890,
        rating: 4.6,
      },
      {
        id: 3,
        title: 'Leadership Essay Template',
        type: 'supplemental',
        description: 'Structure for writing about leadership experiences',
        wordCount: 350,
        difficulty: 'intermediate',
        downloads: 650,
        rating: 4.7,
      },
    ],
    aiSessions: [], // TODO: Add AI sessions API
  };

  // Button click handlers
  const handleNewEssay = () => {
    navigate('/student-hub/essays/new');
  };

  const handleEditEssay = (essayId: string) => {
    // Navigate to Write tab with essayId
    setActiveTab('write');
    setSearchParams({ tab: 'write', essayId });
  };

  const handleViewFeedback = (essayId: string) => {
    navigate(`/student-hub/essays/${essayId}/feedback`);
  };

  const handleStartAISession = () => {
    navigate('/student-hub/essays/ai-session');
  };

  const handleViewAISession = (sessionId: string) => {
    navigate(`/student-hub/essays/ai-session/${sessionId}`);
  };

  const handleDownloadEssay = async (essay: any, format: 'word' | 'pdf' = 'word') => {
    try {
      const token = localStorage.getItem('TOP_COACH_ACCESS_TOKEN') || sessionStorage.getItem('TOP_COACH_ACCESS_TOKEN');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // If essay has filePath, download the original file
      if (essay.filePath) {
        const response = await fetch(`${baseUrl}/essay-management/essays/${essay.id}/download`, {
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
        const fileName = essay.fileName || essay.title || 'essay';
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        message.success('Essay downloaded successfully');
        return;
      }

      // Otherwise, generate Word or PDF from content
      const content = essay.content || '';
      if (!content) {
        message.error('No content available to download');
        return;
      }

      // Strip HTML tags for plain text
      const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

      if (format === 'word') {
        // Create a simple Word document (HTML format that Word can open)
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${essay.title || 'Essay'}</title>
</head>
<body>
  <h1>${essay.title || 'Essay'}</h1>
  <p><strong>Type:</strong> ${essay.essayType?.replace(/_/g, ' ') || 'Essay'}</p>
  ${essay.prompt ? `<p><strong>Prompt:</strong> ${essay.prompt}</p>` : ''}
  <hr>
  <div>${content}</div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const fileName = `${essay.title || 'essay'}.doc`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        message.success('Essay downloaded as Word document');
      } else if (format === 'pdf') {
        // For PDF, we'll use the browser's print functionality
        // Create a new window with the essay content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          message.error('Please allow popups to download PDF');
          return;
        }

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${essay.title || 'Essay'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    h1 { color: #8b0000; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h1>${essay.title || 'Essay'}</h1>
  <p><strong>Type:</strong> ${essay.essayType?.replace(/_/g, ' ') || 'Essay'}</p>
  ${essay.prompt ? `<p><strong>Prompt:</strong> ${essay.prompt}</p>` : ''}
  <hr>
  <div>${content}</div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>`);
        printWindow.document.close();
        
        message.success('Opening PDF print dialog...');
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download essay');
    }
  };

  const handleDeleteEssay = (essay: any) => {
    Modal.confirm({
      title: t('studentHub.essays.deleteEssay'),
      content: t('studentHub.essays.deleteConfirm', { title: essay.title }),
      icon: <FontAwesomeIcon icon="exclamation-triangle" style={{ color: '#ff4d4f' }} />,
      okText: t('studentHub.applications.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteStudentEssay(essay.id).unwrap();
          message.success(t('studentHub.essays.deleteSuccess'));
        } catch (error) {
          console.error('Error deleting essay:', error);
          message.error(t('studentHub.essays.deleteError'));
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'submitted':
        return 'processing';
      case 'in_progress':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'personal_statement':
        return 'blue';
      case 'supplemental':
        return 'green';
      case 'scholarship':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'red';
      default:
        return 'default';
    }
  };

  const filteredEssays = essaysData.essays.filter(essay => {
    const matchesSearch = essay.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || essay.status === statusFilter;
    const matchesType = typeFilter === 'all' || essay.essayType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle different routes
  if (location.pathname === '/student-hub/essays/new') {
    return <NewEssayPage />;
  }

  const tabItems = [
    {
      key: 'write',
      label: (
        <div className="tab-label">
          <EditOutlined />
          <span>Write</span>
        </div>
      ),
      children: (
        <WriteTab 
          key={essayIdFromUrl || 'new'} // Force re-render when essayId changes
          essayId={essayIdFromUrl || undefined}
          onEssayCreated={(essayId) => {
            message.success('Essay created! You can continue writing or view it in My Essays.');
            setActiveTab('my-essays');
            setSearchParams({ tab: 'my-essays' });
          }} 
        />
      ),
    },
    {
      key: 'ai-feedback',
      label: (
        <div className="tab-label">
          <BulbOutlined />
          <span>AI Feedback</span>
        </div>
      ),
      children: <AIFeedbackTab />,
    },
    {
      key: 'my-essays',
      label: (
        <div className="tab-label">
          <FileTextOutlined />
          <span>{t('studentHub.essays.myEssays')}</span>
        </div>
      ),
      children: (
        <div className="essays-content">
          <div className="essays-header">
            <div className="essays-title">
              <h3>{t('studentHub.essays.myEssays')} ({filteredEssays.length})</h3>
              <p>{t('studentHub.essays.manageTrack')}</p>
            </div>
            <div className="essays-actions">
              <Space size="middle" wrap>
                <Input
                  placeholder={t('studentHub.essays.searchEssays')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  prefix={<FontAwesomeIcon icon="search" />}
                  allowClear
                />
                <Select
                  placeholder="Filter by Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="review">Review</Select.Option>
                  <Select.Option value="revision">Revision</Select.Option>
                  <Select.Option value="final">Final</Select.Option>
                  <Select.Option value="submitted">Submitted</Select.Option>
                </Select>
                <Select
                  placeholder="Filter by Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 180 }}
                  allowClear
                >
                  <Select.Option value="all">All Types</Select.Option>
                  <Select.Option value="personal_statement">Personal Statement</Select.Option>
                  <Select.Option value="supplemental">Supplemental</Select.Option>
                  <Select.Option value="scholarship">Scholarship</Select.Option>
                  <Select.Option value="why_school">Why School</Select.Option>
                  <Select.Option value="why_major">Why Major</Select.Option>
                </Select>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="large"
                  onClick={() => {
                    // Clear essayId to start fresh
                    setActiveTab('write');
                    const newParams = new URLSearchParams();
                    newParams.set('tab', 'write');
                    setSearchParams(newParams); // This clears essayId
                  }}
                  style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                >
                  New Essay
                </Button>
              </Space>
            </div>
          </div>


          {filteredEssays.length === 0 ? (
            <Empty
              description={
                <div>
                  <p>No essays found.</p>
                  {searchText || statusFilter !== 'all' || typeFilter !== 'all' ? (
                    <Button 
                      type="link" 
                      onClick={() => {
                        setSearchText('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button 
                      type="primary"
                      onClick={() => {
                        // Clear essayId to start fresh
                        setActiveTab('write');
                        const newParams = new URLSearchParams();
                        newParams.set('tab', 'write');
                        setSearchParams(newParams); // This clears essayId
                      }}
                      style={{ marginTop: 16, backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                    >
                      Create Your First Essay
                    </Button>
                  )}
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredEssays}
              loading={essaysLoading}
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
              renderItem={(essay) => (
                <List.Item>
                  <Card 
                    className="essay-card"
                    hoverable
                    actions={[
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditEssay(essay.id)}
                      >
                        Edit
                      </Button>,
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show dropdown for Word/PDF choice
                          Modal.confirm({
                            title: 'Download Essay',
                            content: (
                              <div style={{ padding: '16px 0' }}>
                                <p>Choose download format:</p>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Button
                                    type="primary"
                                    block
                                    onClick={() => {
                                      Modal.destroyAll();
                                      handleDownloadEssay(essay, 'word');
                                    }}
                                    style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                                  >
                                    Download as Word (.doc)
                                  </Button>
                                  <Button
                                    block
                                    onClick={() => {
                                      Modal.destroyAll();
                                      handleDownloadEssay(essay, 'pdf');
                                    }}
                                  >
                                    Download as PDF
                                  </Button>
                                </Space>
                              </div>
                            ),
                            okButtonProps: { style: { display: 'none' } },
                            cancelButtonProps: { style: { display: 'none' } },
                            width: 400,
                          });
                        }}
                      >
                        Download
                      </Button>,
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteEssay(essay)}
                        loading={isDeleting}
                      >
                        Delete
                      </Button>,
                    ]}
                  >
                    <div className="essay-card-content">
                      <div className="essay-header">
                        <h4 className="essay-title">{essay.title}</h4>
                        <Space>
                          <Tag color={getTypeColor(essay.essayType)}>
                            {essay.essayType?.replace(/_/g, ' ').toUpperCase() || 'ESSAY'}
                          </Tag>
                          <Tag color={getStatusColor(essay.status)}>
                            {essay.status?.toUpperCase() || 'DRAFT'}
                          </Tag>
                        </Space>
                      </div>
                      
                      <div className="essay-meta">
                        <div className="meta-item">
                          <FileTextOutlined style={{ color: '#8b0000', marginRight: 4 }} />
                          <span>{essay.wordCount || 0} words</span>
                        </div>
                        {essay.uploadedAt && (
                          <div className="meta-item">
                            <span>{new Date(essay.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {essay.lastEditedAt && (
                          <div className="meta-item">
                            <span>Edited: {new Date(essay.lastEditedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {essay.prompt && (
                        <div className="essay-prompt">
                          <strong>Prompt:</strong>
                          <p>{essay.prompt.length > 150 ? `${essay.prompt.substring(0, 150)}...` : essay.prompt}</p>
                        </div>
                      )}

                      {essay.aiFeedback?.overallScore && (
                        <div className="essay-feedback-badge">
                          <Tag color={essay.aiFeedback.overallScore >= 7 ? 'success' : essay.aiFeedback.overallScore >= 5 ? 'warning' : 'error'}>
                            AI Score: {essay.aiFeedback.overallScore.toFixed(1)}/10
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      ),
    },
    {
      key: 'templates',
      label: (
        <div className="tab-label">
          <FileSearchOutlined />
          <span>{t('studentHub.essays.templates')}</span>
        </div>
      ),
      children: (
        <div className="templates-content">
          <div className="templates-header">
            <h3>{t('studentHub.essays.essayTemplates')}</h3>
            <p>{t('studentHub.essays.templatesDescription')}</p>
          </div>
          <div className="placeholder-content">
            <p>{t('studentHub.essays.templatesComingSoon')}</p>
          </div>
          {/* 
          <List
            dataSource={essaysData.templates}
            renderItem={(template) => (
              <List.Item className="template-item">
                <Card className="template-card">
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={16}>
                      <div className="template-info">
                        <h4 className="template-title">{template.title}</h4>
                        <p className="template-description">{template.description}</p>
                        <div className="template-meta">
                          <Tag color={getTypeColor(template.type)}>
                            {template.type.replace('_', ' ').toUpperCase()}
                          </Tag>
                          <Tag color={getDifficultyColor(template.difficulty)}>
                            {template.difficulty.toUpperCase()}
                          </Tag>
                          <span className="word-count">{template.wordCount} words</span>
                        </div>
                        <div className="template-stats">
                          <span className="downloads">
                            <FontAwesomeIcon icon="download" />
                            {template.downloads.toLocaleString()} downloads
                          </span>
                          <span className="rating">
                            <FontAwesomeIcon icon="star" />
                            {template.rating}/5
                          </span>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div className="template-actions">
                        <Button
                          type="primary"
                          icon={<FontAwesomeIcon icon={ACTION_ICONS.DOWNLOAD} />}
                          size="large"
                        >
                          {t('studentHub.essays.useTemplate')}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
          />
          */}
        </div>
      ),
    },
  ];

  return (
    <div className="essays-page">
      <div className="page-header">
        <h1 className="page-title">{t('studentHub.essays.title')}</h1>
        <p className="page-subtitle">{t('studentHub.essays.subtitle')}</p>
      </div>

      <Card className="essays-main-card">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="essays-tabs"
        />
      </Card>
    </div>
  );
};

export default EssaysPage;