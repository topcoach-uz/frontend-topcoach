import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Row, Col, List, Badge, Space, Tag, Progress, Input, message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { ESSAY_ICONS, STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { useGetStudentEssaysQuery, useDeleteStudentEssayMutation } from '../../../app/services/student-hub/essayManagementApi';
import { baseUrl } from '../../../app/services/api/const';
import NewEssayPage from './NewEssayPage';
import './EssaysPage.scss';

const { TabPane } = Tabs;
const { Search } = Input;

const EssaysPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('my-essays');
  const [searchText, setSearchText] = useState('');
  const { dashboard, isLoading } = useStudentHub();
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const [deleteStudentEssay, { isLoading: isDeleting }] = useDeleteStudentEssayMutation();

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['my-essays', 'templates'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
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
    navigate(`/student-hub/essays/${essayId}/edit`);
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

  const handleDownloadEssay = async (essay: any) => {
    if (!essay.filePath) {
      message.error('No file available for download');
      return;
    }

    try {
      const token = localStorage.getItem('TOP_COACH_ACCESS_TOKEN') || sessionStorage.getItem('TOP_COACH_ACCESS_TOKEN');
      if (!token) {
        message.error('Authentication required');
        return;
      }

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
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download essay');
    }
  };

  const handleDeleteEssay = (essay: any) => {
    Modal.confirm({
      title: 'Delete Essay',
      content: `Are you sure you want to delete "${essay.title}"? This action cannot be undone.`,
      icon: <FontAwesomeIcon icon="exclamation-triangle" style={{ color: '#ff4d4f' }} />,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteStudentEssay(essay.id).unwrap();
          message.success('Essay deleted successfully');
        } catch (error) {
          console.error('Error deleting essay:', error);
          message.error('Failed to delete essay');
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

  const filteredEssays = essaysData.essays.filter(essay =>
    essay.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle different routes
  if (location.pathname === '/student-hub/essays/new') {
    return <NewEssayPage />;
  }

  const tabItems = [
    {
      key: 'my-essays',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={ESSAY_ICONS.ESSAYS} />
          <span>My Essays</span>
        </div>
      ),
      children: (
        <div className="essays-content">
          <div className="essays-header">
            <div className="essays-title">
              <h3>My Essays ({essaysData.essays.length})</h3>
              <p>Manage and track your essay writing progress</p>
            </div>
            <div className="essays-actions">
              <Input
                placeholder="Search essays by title..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                prefix={<FontAwesomeIcon icon="search" />}
                allowClear
              />
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}
                size="large"
                onClick={handleNewEssay}
              >
                New Essay
              </Button>
            </div>
          </div>


          <List
            dataSource={filteredEssays}
            renderItem={(essay) => (
              <List.Item className="essay-item">
                <Card className="essay-card">
                  <div className="essay-card-content">
                    <div className="essay-info">
                      <div className="essay-header">
                        <h4 className="essay-title">{essay.title}</h4>
                        <Tag color={getTypeColor(essay.essayType)}>
                          {essay.essayType?.replace('_', ' ').toUpperCase() || 'ESSAY'}
                        </Tag>
                      </div>
                      <div className="essay-meta">
                        {essay.fileName && (
                          <span className="file-info">
                            <FontAwesomeIcon icon="file-alt" style={{ color: '#8b0000' }} />
                            {essay.fileName}
                          </span>
                        )}
                        {essay.uploadedAt && (
                          <span className="upload-date">
                            <FontAwesomeIcon icon="calendar-alt" style={{ color: '#8b0000' }} />
                            Uploaded: {new Date(essay.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                        {essay.metadata?.purpose && (
                          <span className="purpose">
                            <FontAwesomeIcon icon="lightbulb" style={{ color: '#8b0000' }} />
                            {essay.metadata.purpose}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="essay-actions">
                      <div className="action-buttons">
                        <Button
                          type="primary"
                          icon={<FontAwesomeIcon icon="download" />}
                          onClick={() => handleDownloadEssay(essay)}
                        >
                          Download
                        </Button>
                        <Button
                          onClick={() => handleDeleteEssay(essay)}
                          loading={isDeleting}
                          style={{ 
                            marginTop: 8,
                            backgroundColor: '#8b0000',
                            borderColor: '#8b0000',
                            color: 'white'
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
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'templates',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={ESSAY_ICONS.TEMPLATES} />
          <span>Templates</span>
        </div>
      ),
      children: (
        <div className="templates-content">
          <div className="templates-header">
            <h3>Essay Templates</h3>
            <p>Use these templates to structure your essays</p>
          </div>
          <div className="placeholder-content">
            <p>Essay templates will be available soon.</p>
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
                          Use Template
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
    {
      key: 'ai-assistant',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={ESSAY_ICONS.AI} />
          <span>AI Assistant</span>
        </div>
      ),
      children: (
        <div className="ai-content">
          <div className="ai-header">
            <h3>AI Writing Assistant</h3>
            <p>Get AI-powered feedback and suggestions for your essays</p>
          </div>
          <div className="ai-placeholder">
            <div className="placeholder-content">
              <p>AI-powered essay feedback and suggestions will be available soon.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="essays-page">
      <div className="page-header">
        <h1 className="page-title">Essay Management</h1>
        <p className="page-subtitle">Write, edit, and perfect your college essays</p>
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