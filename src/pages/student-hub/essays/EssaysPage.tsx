import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Row, Col, List, Badge, Space, Tag, Progress, Input, Select, message, Modal, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { EditOutlined, DownloadOutlined, FileTextOutlined, BulbOutlined, FileSearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { useGetStudentEssaysQuery, useDeleteStudentEssayMutation } from '../../../app/services/student-hub/essayManagementApi';
import { useGetStudentJourneyEssaysQuery } from '../../../app/services/student-hub/studentJourneyReadonlyApi';
import { baseUrl } from '../../../app/services/api/const';
import NewEssayPage from './NewEssayPage';
import WriteTab from './components/WriteTab';
import AIFeedbackTab from './components/AIFeedbackTab';
import './EssaysPage.scss';

const { Option } = Select;

// Set to false to show full essays functionality
const ESSAYS_COMING_SOON = true;

// Props interface for EssaysPage - supports both normal and read-only mode
export interface EssaysPageProps {
  readOnly?: boolean;
  studentId?: string;
}

const EssaysPage: React.FC<EssaysPageProps> = ({ readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  if (ESSAYS_COMING_SOON) {
    return (
      <div className="essays-page">
        <div className="page-header">
          <h1 className="page-title">{t('studentHub.essays.title')}</h1>
          <p className="page-subtitle">{t('studentHub.essays.subtitle')}</p>
        </div>
        <Card className="essays-main-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                  Coming Soon
                </div>
                <p style={{ color: '#666', margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                  We&apos;re building an essay hub that helps you brainstorm ideas based on your interests and target schools — so your essays stand out. Check back soon!
                </p>
              </div>
            }
          />
        </Card>
      </div>
    );
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('write');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { dashboard, isLoading } = useStudentHub();
  const isReadOnly = readOnly === true;
  
  // Normal mode - fetch current user's essays
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery(
    { page: 1, limit: 100 },
    { skip: isReadOnly }
  );
  
  // Read-only mode - fetch student's essays via counselor API
  const { data: readOnlyEssaysResponse, isLoading: readOnlyEssaysLoading } = useGetStudentJourneyEssaysQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  
  // Merge data based on mode - type as any[] for flexibility
  const finalEssaysData: any[] = isReadOnly 
    ? (readOnlyEssaysResponse?.data as any)?.essays || []
    : (essaysResponse?.data as any)?.essays || [];
  
  const [deleteStudentEssay, { isLoading: isDeleting }] = useDeleteStudentEssayMutation();

  // Handle URL parameters for tab navigation and essay editing
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['write', 'my-essays', 'ai-feedback'].includes(tabFromUrl)) {
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

  // Use real data from API - use merged data that handles both normal and read-only modes
  const essaysData = {
    overview: {
      totalEssays: finalEssaysData?.length || 0,
      inProgress: finalEssaysData?.filter((e: any) => e.status === 'draft').length || 0,
      completed: finalEssaysData?.filter((e: any) => e.status === 'final').length || 0,
      submitted: finalEssaysData?.filter((e: any) => e.status === 'submitted').length || 0,
      wordCount: finalEssaysData?.reduce((sum: number, e: any) => sum + (e.wordCount || 0), 0) || 0,
    },
    essays: finalEssaysData || [],
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
      icon: <ExclamationCircleOutlined style={{ color: '#8b0000' }} />,
      okText: t('studentHub.applications.delete'),
      okButtonProps: { 
        danger: true,
        style: { backgroundColor: '#8b0000', borderColor: '#8b0000' }
      },
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'personal_statement':
        return t('studentHub.essays.type.personalStatement');
      case 'supplemental':
        return t('studentHub.essays.type.supplemental');
      case 'scholarship':
        return t('studentHub.essays.type.scholarship');
      case 'why_school':
        return t('studentHub.essays.type.whySchool');
      case 'why_major':
        return t('studentHub.essays.type.whyMajor');
      default:
        return type?.replace(/_/g, ' ').toUpperCase() || t('studentHub.essays.type.essay');
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
          <span>{t('studentHub.essays.tab.write')}</span>
        </div>
      ),
      children: (
        <WriteTab 
          key={essayIdFromUrl || 'new'} // Force re-render when essayId changes
          essayId={essayIdFromUrl || undefined}
          onEssayCreated={(essayId) => {
            message.success(t('studentHub.essays.essayCreatedSuccess'));
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
          <span>{t('studentHub.essays.tab.aiFeedback')}</span>
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
              <Space size="middle" wrap align="center">
                <Input
                  placeholder={t('studentHub.essays.searchEssays')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  prefix={<UnifiedIcon name="search" size="sm" color="primary" />}
                  allowClear
                />
                <Select
                  placeholder={t('studentHub.essays.filterByStatus')}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150, height: '40px' }}
                  size="large"
                  allowClear
                >
                  <Select.Option value="all">{t('studentHub.essays.allStatus')}</Select.Option>
                  <Select.Option value="draft">{t('studentHub.essays.status.draft')}</Select.Option>
                  <Select.Option value="review">{t('studentHub.essays.status.review')}</Select.Option>
                  <Select.Option value="revision">{t('studentHub.essays.status.revision')}</Select.Option>
                  <Select.Option value="final">{t('studentHub.essays.status.final')}</Select.Option>
                  <Select.Option value="submitted">{t('studentHub.essays.status.submitted')}</Select.Option>
                </Select>
                <Select
                  placeholder={t('studentHub.essays.filterByType')}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 180, height: '40px' }}
                  size="large"
                  allowClear
                >
                  <Select.Option value="all">{t('studentHub.essays.allTypes')}</Select.Option>
                  <Select.Option value="personal_statement">{t('studentHub.essays.type.personalStatement')}</Select.Option>
                  <Select.Option value="supplemental">{t('studentHub.essays.type.supplemental')}</Select.Option>
                  <Select.Option value="scholarship">{t('studentHub.essays.type.scholarship')}</Select.Option>
                  <Select.Option value="why_school">{t('studentHub.essays.type.whySchool')}</Select.Option>
                  <Select.Option value="why_major">{t('studentHub.essays.type.whyMajor')}</Select.Option>
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
                  style={{ backgroundColor: '#8b0000', borderColor: '#8b0000', height: '40px' }}
                >
                  {t('studentHub.essays.newEssay')}
                </Button>
              </Space>
            </div>
          </div>


          {filteredEssays.length === 0 ? (
            <Empty
              description={
                <div>
                  <p>{t('studentHub.essays.noEssaysFound')}</p>
                  {searchText || statusFilter !== 'all' || typeFilter !== 'all' ? (
                    <Button 
                      type="link" 
                      onClick={() => {
                        setSearchText('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                    >
                      {t('studentHub.essays.clearFilters')}
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
                      {t('studentHub.essays.createFirstEssay')}
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
                        {t('studentHub.essays.edit')}
                      </Button>,
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show dropdown for Word/PDF choice
                          Modal.info({
                            title: t('studentHub.essays.downloadEssay'),
                            content: (
                              <div style={{ padding: '8px 0' }}>
                                <p style={{ marginBottom: 24, fontSize: '14px', color: '#666' }}>
                                  {t('studentHub.essays.chooseDownloadFormat')}
                                </p>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                  <Button
                                    type="primary"
                                    block
                                    size="large"
                                    onClick={() => {
                                      Modal.destroyAll();
                                      handleDownloadEssay(essay, 'word');
                                    }}
                                    style={{ backgroundColor: '#8b0000', borderColor: '#8b0000', height: '44px' }}
                                  >
                                    {t('studentHub.essays.downloadAsWord')}
                                  </Button>
                                  <Button
                                    block
                                    size="large"
                                    onClick={() => {
                                      Modal.destroyAll();
                                      handleDownloadEssay(essay, 'pdf');
                                    }}
                                    style={{ height: '44px' }}
                                  >
                                    {t('studentHub.essays.downloadAsPdf')}
                                  </Button>
                                </Space>
                                <div style={{ marginTop: 24, textAlign: 'right' }}>
                                  <Button 
                                    onClick={() => Modal.destroyAll()}
                                  >
                                    {t('common.cancel')}
                                  </Button>
                                </div>
                              </div>
                            ),
                            footer: null,
                            width: 450,
                            okButtonProps: { style: { display: 'none' } },
                          });
                        }}
                      >
                        {t('studentHub.essays.download')}
                      </Button>,
                      <Button
                        type="text"
                        className="btn-delete-crimson-link"
                        icon={<UnifiedIcon name="trash-2" size="sm" color="primary" />}
                        onClick={() => handleDeleteEssay(essay)}
                        loading={isDeleting}
                      >
                        {t('studentHub.essays.delete')}
                      </Button>,
                    ]}
                  >
                    <div className="essay-card-content">
                      <div className="essay-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <h4 className="essay-title" style={{ margin: 0, flex: 1 }}>{essay.title}</h4>
                          {essay.aiFeedback?.overallScore && (
                            <Tag 
                              color={essay.aiFeedback.overallScore >= 7 ? 'success' : essay.aiFeedback.overallScore >= 5 ? 'warning' : 'error'}
                              style={{ marginLeft: 8, flexShrink: 0 }}
                            >
                              {t('studentHub.essays.aiScore')}: {essay.aiFeedback.overallScore.toFixed(1)}/10
                            </Tag>
                          )}
                        </div>
                        <Space size="small">
                          <Tag color={getTypeColor(essay.essayType)}>
                            {getTypeLabel(essay.essayType)}
                          </Tag>
                        </Space>
                      </div>
                      
                      <div className="essay-meta">
                        <Space size="small" split={<span style={{ color: '#d9d9d9' }}>•</span>}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileTextOutlined style={{ color: '#8b0000', fontSize: 12 }} />
                            <span>{essay.wordCount || 0} {t('studentHub.essays.words')}</span>
                          </span>
                          {essay.lastEditedAt && (
                            <span>{t('studentHub.essays.edited')}: {new Date(essay.lastEditedAt).toLocaleDateString()}</span>
                          )}
                        </Space>
                      </div>

                      {essay.prompt && (
                        <div className="essay-prompt">
                          <strong>Prompt:</strong>
                          <p>{essay.prompt.length > 150 ? `${essay.prompt.substring(0, 150)}...` : essay.prompt}</p>
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
    // Templates tab - commented out for future development
    /*
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
        </div>
      ),
    },
    */
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