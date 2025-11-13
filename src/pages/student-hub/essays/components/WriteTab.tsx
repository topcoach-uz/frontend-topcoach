import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Button, Select, Space, message, Alert, Spin, Row, Col, Divider } from 'antd';
import { BulbOutlined, EditOutlined, SaveOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import QuillEditor from './QuillEditor';
import { 
  useGenerateBrainstormingMutation, 
  useGenerateOutlineMutation,
  useCreateStudentEssayMutation,
  useAutoSaveEssayMutation,
  useUpdateStudentEssayMutation,
  useGetStudentEssayQuery,
} from '../../../../app/services/student-hub/essayManagementApi';
import { useStudentHub } from '../../../../hooks/useStudentHub';
import './WriteTab.scss';

const { TextArea } = Input;
const { Option } = Select;

interface WriteTabProps {
  onEssayCreated?: (essayId: string) => void;
  essayId?: string; // For editing existing essays
}

const WriteTab: React.FC<WriteTabProps> = ({ onEssayCreated, essayId }) => {
  const { t } = useTranslation();
  const { dashboard } = useStudentHub();
  const [topic, setTopic] = useState('');
  const [essayType, setEssayType] = useState('personal_statement');
  const [essayTitle, setEssayTitle] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [essayContent, setEssayContent] = useState('');
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [showBrainstorming, setShowBrainstorming] = useState(true);

  // Load essay if editing
  const { data: essayData, isLoading: isLoadingEssay, error: essayError } = useGetStudentEssayQuery(essayId || '', {
    skip: !essayId,
    refetchOnMountOrArgChange: true, // Force refetch when essayId changes
  });

  // Reset form when essayId changes or is cleared
  useEffect(() => {
    if (!essayId) {
      // Reset to new essay state
      setCurrentEssayId(null);
      setEssayTitle('');
      setEssayType('personal_statement');
      setEssayContent('');
      setTopic('');
      setBrainstormingData(null);
      setOutlineData(null);
      setSelectedIdea(null);
    }
  }, [essayId]);

  // Load essay data when editing
  useEffect(() => {
    console.log('🎯 Essay loading effect:', { 
      essayId, 
      hasData: !!essayData, 
      isLoading: isLoadingEssay,
      error: essayError,
      dataStructure: essayData ? Object.keys(essayData) : null,
      data: essayData 
    });

    if (essayData && essayId) {
      // essayData is ApiResponse<StudentEssay>, so access essayData.data
      const essay = essayData.data;
      
      if (essay && essay.id) {
        console.log('🎯 Loading essay for editing:', essay);
        setCurrentEssayId(essay.id);
        setEssayTitle(essay.title || '');
        setEssayType(essay.essayType || 'personal_statement');
        setEssayContent(essay.content || '');
        setTopic(essay.title || '');
      } else {
        console.warn('🎯 Essay data structure unexpected:', { essayData, extractedEssay: essay });
      }
    } else if (essayId && !isLoadingEssay && essayError) {
      console.error('🎯 Essay loading error:', essayError);
      message.error('Failed to load essay. Please try again.');
    } else if (essayId && !essayData && !isLoadingEssay && !essayError) {
      console.warn('🎯 Essay not found for ID:', essayId);
      message.warning('Essay not found');
    }
  }, [essayData, essayId, isLoadingEssay, essayError]);

  const [generateBrainstorming, { isLoading: isBrainstorming }] = useGenerateBrainstormingMutation();
  const [generateOutline, { isLoading: isGeneratingOutline }] = useGenerateOutlineMutation();
  const [createEssay, { isLoading: isCreating }] = useCreateStudentEssayMutation();
  const [updateEssay, { isLoading: isUpdating }] = useUpdateStudentEssayMutation();
  const [autoSaveEssay, { isLoading: isAutoSaving }] = useAutoSaveEssayMutation();

  const [brainstormingData, setBrainstormingData] = useState<any>(null);
  const [outlineData, setOutlineData] = useState<any>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const essayTypes = [
    { value: 'personal_statement', label: 'Personal Statement' },
    { value: 'supplemental', label: 'Supplemental Essay' },
    { value: 'scholarship', label: 'Scholarship Essay' },
    { value: 'why_school', label: 'Why School Essay' },
    { value: 'why_major', label: 'Why Major Essay' },
    { value: 'activity', label: 'Activity Essay' },
    { value: 'diversity', label: 'Diversity Essay' },
    { value: 'leadership', label: 'Leadership Essay' },
    { value: 'challenge', label: 'Challenge Essay' },
    { value: 'other', label: 'Other' },
  ];

  // Check profile completion
  useEffect(() => {
    if (dashboard?.dashboard?.profile) {
      const isComplete = dashboard.dashboard.profile.completionPercentage === 100;
      setProfileIncomplete(!isComplete);
    }
  }, [dashboard]);

  // Auto-save functionality
  useEffect(() => {
    if (currentEssayId && essayContent && essayContent.length > 0) {
      const timer = setTimeout(() => {
        autoSaveEssay({ id: currentEssayId, content: essayContent }).catch(() => {
          // Silent fail for auto-save
        });
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [essayContent, currentEssayId, autoSaveEssay]);

  const handleBrainstorm = async () => {
    if (!topic.trim()) {
      message.warning('Please enter a topic');
      return;
    }

    console.log('🎯 handleBrainstorm called with:', { topic: topic.trim(), essayType });

    try {
      const result = await generateBrainstorming({
        topic: topic.trim(),
        essayType,
        prompt: undefined, // No longer required
      }).unwrap();

      console.log('🎯 Brainstorming result:', result);

      // Handle both wrapped and direct response formats
      const brainstorming = result?.data || result;
      
      if (brainstorming) {
        setBrainstormingData(brainstorming);
        message.success('Brainstorming ideas generated!');
      } else {
        console.error('No brainstorming data in response:', result);
        message.warning('No ideas generated. Please try again.');
      }
    } catch (error: any) {
      console.error('🎯 Brainstorming error:', error);
      console.error('Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        originalStatus: error?.originalStatus,
      });
      
      if (error?.data?.message?.includes('profile must be 100% complete')) {
        setProfileIncomplete(true);
        message.error('Please complete your profile to use AI features');
      } else if (error?.data?.message) {
        message.error(error.data.message);
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error('Failed to generate brainstorming ideas. Please try again.');
      }
    }
  };

  const handleGenerateOutline = async () => {
    if (!brainstormingData || !selectedIdea) {
      message.warning('Please select an idea from brainstorming first');
      return;
    }

    try {
      const result = await generateOutline({
        topic: topic.trim(),
        essayType,
        selectedIdea,
      }).unwrap();

      if (result.data) {
        setOutlineData(result.data);
        message.success('Outline generated!');
      }
    } catch (error: any) {
      console.error('Outline generation error:', error);
      message.error(error?.data?.message || 'Failed to generate outline');
    }
  };

  const handleStartWriting = async () => {
    // Require at least one word in the editor
    const text = essayContent.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
      message.warning('Please write at least one word in the editor before creating the essay');
      return;
    }

    // Require title
    if (!essayTitle.trim()) {
      message.warning('Please enter an essay title');
      return;
    }

    console.log('🎯 handleStartWriting called with:', {
      title: essayTitle.trim(),
      essayType,
      contentLength: essayContent?.length || 0,
      wordCount: words.length,
    });

    try {
      const result = await createEssay({
        title: essayTitle.trim(),
        essayType: essayType as any,
        prompt: '', // No longer required
        content: essayContent || '',
      }).unwrap();

      console.log('🎯 Create essay result:', result);

      // result is ApiResponse<StudentEssay>, so access result.data
      const essay = result?.data;
      
      if (essay?.id) {
        setCurrentEssayId(essay.id);
        message.success('Essay created! Continue writing...');
        onEssayCreated?.(essay.id);
      } else {
        console.error('No essay ID in response:', result);
        message.warning('Essay created but ID not found. Please refresh the page.');
      }
    } catch (error: any) {
      console.error('🎯 Create essay error:', error);
      console.error('Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        originalStatus: error?.originalStatus,
      });
      
      if (error?.data?.message?.includes('profile must be 100% complete')) {
        setProfileIncomplete(true);
        message.error('Please complete your profile to create essays');
      } else if (error?.data?.message) {
        message.error(error.data.message);
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error('Failed to create essay. Please try again.');
      }
    }
  };

  const handleSaveEssay = async () => {
    if (!currentEssayId) {
      await handleStartWriting();
      return;
    }

    try {
      await updateEssay({
        id: currentEssayId,
        data: {
          title: essayTitle.trim() || topic.trim(),
          essayType: essayType as any,
          content: essayContent,
        },
      }).unwrap();
      message.success('Essay saved successfully!');
    } catch (error: any) {
      console.error('Save essay error:', error);
      message.error(error?.data?.message || 'Failed to save essay');
    }
  };

  // Quill editor modules configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  // Calculate word count from HTML content (strip HTML tags)
  const wordCount = useMemo(() => {
    if (!essayContent) return 0;
    const text = essayContent.replace(/<[^>]*>/g, '').trim();
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }, [essayContent]);

  if (profileIncomplete) {
    return (
      <div className="write-tab">
        <Alert
          type="warning"
          message="Profile Completion Required"
          description={
            <div>
              <p>Your profile must be 100% complete to use AI-powered essay writing features.</p>
              <p>Current completion: {dashboard?.dashboard?.profile?.completionPercentage || 0}%</p>
              <Button 
                type="primary" 
                onClick={() => window.location.href = '/student-hub/profile'}
                style={{ marginTop: 16 }}
              >
                Complete Your Profile
              </Button>
            </div>
          }
          showIcon
          style={{ marginBottom: 24 }}
        />
      </div>
    );
  }

  // Show loading state while fetching essay
  if (essayId && isLoadingEssay) {
    return (
      <div className="write-tab" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading essay..." />
      </div>
    );
  }

  return (
    <div className="write-tab">
      {/* Header with Essay Info */}
      <Card className="essay-info-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Essay Title <span style={{ color: 'red' }}>*</span>
              </label>
              <Input
                placeholder="Enter essay title"
                value={essayTitle}
                onChange={(e) => {
                  setEssayTitle(e.target.value);
                }}
                size="large"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Essay Type
              </label>
              <Select
                value={essayType}
                onChange={setEssayType}
                style={{ width: '100%' }}
                size="large"
              >
                {essayTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Side by Side Layout */}
      <Row gutter={[16, 16]} className="write-layout">
        {/* Left Column: Essay Editor */}
        <Col xs={24} lg={showBrainstorming ? 14 : 24} className="editor-column">
          <Card
            title={
              <Space>
                <EditOutlined style={{ color: '#8b0000' }} />
                <span>Write Your Essay</span>
              </Space>
            }
            className="editor-card"
            extra={
              <Space>
                {isAutoSaving && <span style={{ color: '#8b0000', fontSize: 12 }}>Saving...</span>}
                <span style={{ fontSize: 12 }}>Words: {wordCount}</span>
                {!showBrainstorming && (
                  <Button
                    type="text"
                    size="small"
                    icon={<BulbOutlined />}
                    onClick={() => setShowBrainstorming(true)}
                  >
                    Show AI
                  </Button>
                )}
              </Space>
            }
          >
            <QuillEditor
              value={essayContent}
              onChange={setEssayContent}
              placeholder="Start writing your essay here... You can use AI brainstorming for ideas, or write freely like a Word editor. Click 'Create Essay' when ready to save."
              modules={quillModules}
              readOnly={false}
              style={{ 
                minHeight: '500px',
                backgroundColor: '#fff',
                marginBottom: 20
              }}
            />

            <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!currentEssayId && (
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleStartWriting}
                    loading={isCreating}
                    disabled={wordCount === 0}
                    size="large"
                    style={{ 
                      backgroundColor: wordCount === 0 ? '#bfbfbf' : '#8b0000', 
                      borderColor: wordCount === 0 ? '#bfbfbf' : '#8b0000',
                      color: '#ffffff',
                      cursor: wordCount === 0 ? 'not-allowed' : 'pointer',
                      opacity: wordCount === 0 ? 0.6 : 1
                    }}
                  >
                    Create Essay
                  </Button>
                )}
              </div>
              {currentEssayId && (
                <Space>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleSaveEssay}
                    loading={isAutoSaving || isUpdating}
                    size="large"
                    style={{ backgroundColor: '#8b0000', borderColor: '#8b0000', color: '#fff' }}
                  >
                    Save Essay
                  </Button>
                </Space>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column: AI Brainstorming */}
        {showBrainstorming && (
          <Col xs={24} lg={10} className="brainstorming-column">
            <Card 
              title={
                <Space>
                  <BulbOutlined style={{ color: '#8b0000' }} />
                  <span>AI Brainstorming</span>
                </Space>
              }
              className="brainstorming-card"
              extra={
                <Button
                  type="text"
                  size="small"
                  onClick={() => setShowBrainstorming(false)}
                >
                  Hide
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Input
                  placeholder="Enter topic or question for brainstorming"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  size="large"
                  onPressEnter={handleBrainstorm}
                />

                <Button
                  type="primary"
                  icon={<BulbOutlined />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Generate Ideas button clicked');
                    handleBrainstorm();
                  }}
                  loading={isBrainstorming}
                  block
                  style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                >
                  Generate Ideas
                </Button>
              </Space>

              {/* Brainstorming Results */}
              {brainstormingData && (
                <div className="brainstorming-results" style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 12 }}>Ideas & Angles</h4>
                  <div className="ideas-list">
                    {brainstormingData.ideas?.map((idea: any, index: number) => (
                      <Card
                        key={index}
                        size="small"
                        className={`idea-card ${selectedIdea === idea ? 'selected' : ''}`}
                        onClick={() => setSelectedIdea(idea)}
                        hoverable
                        style={{ marginBottom: 8, cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 13 }}>
                          <strong style={{ color: '#8b0000' }}>{idea.title}</strong>
                          <p style={{ margin: '4px 0', fontSize: 12 }}>{idea.description}</p>
                          {idea.keyPoints && idea.keyPoints.length > 0 && (
                            <div style={{ fontSize: 11, color: '#666' }}>
                              <strong>Key Points:</strong>
                              <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                                {idea.keyPoints.slice(0, 3).map((point: string, i: number) => (
                                  <li key={i}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {selectedIdea && (
                    <Button
                      type="primary"
                      onClick={handleGenerateOutline}
                      loading={isGeneratingOutline}
                      block
                      size="small"
                      style={{ marginTop: 12, backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                    >
                      Generate Outline
                    </Button>
                  )}

                  {brainstormingData.hooks && brainstormingData.hooks.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ fontSize: 13, marginBottom: 8 }}>Hook Ideas</h4>
                      <ul style={{ fontSize: 12, paddingLeft: 20 }}>
                        {brainstormingData.hooks.slice(0, 3).map((hook: string, index: number) => (
                          <li key={index} style={{ marginBottom: 4 }}>{hook}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outline Display */}
                  {outlineData && (
                    <div className="outline-section" style={{ marginTop: 16, fontSize: 12 }}>
                      <h4 style={{ fontSize: 13, marginBottom: 8 }}>Generated Outline</h4>
                      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                        {outlineData.introduction && (
                          <div style={{ marginBottom: 8 }}>
                            <strong>Introduction:</strong>
                            {outlineData.introduction.hook && (
                              <div style={{ fontSize: 11, marginLeft: 8 }}>• {outlineData.introduction.hook}</div>
                            )}
                          </div>
                        )}
                        {outlineData.body && outlineData.body.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <strong>Body:</strong>
                            {outlineData.body.slice(0, 2).map((para: any) => (
                              <div key={para.paragraph} style={{ fontSize: 11, marginLeft: 8 }}>
                                • Para {para.paragraph}: {para.topic}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default WriteTab;

