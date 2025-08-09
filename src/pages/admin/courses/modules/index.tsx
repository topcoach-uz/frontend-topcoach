import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  message,
  notification,
  Space,
  Tag,
  Popconfirm,
  Tabs,
  List,
  Avatar,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BookOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTypedSelector } from 'src/app/store';
import { ACCESS_TOKEN } from 'src/constants/storage';
import './index.scss';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// API client for course management
const courseApi = {
  get: async (url: string) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api${url}`, {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  },
  post: async (url: string, data: any) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  },
  put: async (url: string, data: any) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  },
  delete: async (url: string) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api${url}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    // Handle empty responses for DELETE requests
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    // Return success object for empty responses
    return { success: true };
  },
  upload: async (file: File) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/admin/courses/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  },
};

interface Module {
  id: string;
  title: string;
  description?: string;
  mentorId: string;
  mentorName?: string; // Add mentor name field
  orderIndex: number;
  estimatedDuration: number;
  moduleType: 'standard' | 'premium';
  isActive: boolean;
  mentor: {
    id: string;
    email: string;
    avatar?: string;
  };
  lessons: Lesson[];
  _count?: {
    lessons: number;
  };
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  orderIndex: number;
  lessonType: 'video' | 'pdf' | 'live_session';
  contentUrl?: string;
  duration: number;
  isActive: boolean;
  isPremium: boolean;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  lessonId: string;
  resourceType: 'pdf' | 'document' | 'link' | 'template';
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  isDownloadable: boolean;
  isPremium: boolean;
  orderIndex: number;
}

interface Mentor {
  id: string;
  email: string;
  avatar?: string;
}

const CourseModulesAdmin: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('modules');
  
  const user = useTypedSelector((state) => state.auth.profile);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    if (!token) {
      notification.warning({
        message: 'Access Required',
        description: 'Please log in to access admin panel',
      });
    }
  }, [user]);

  // Fetch modules and mentors
  useEffect(() => {
    fetchModules();
    fetchMentors();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await courseApi.get('/admin/courses/modules');
      
      // Handle both array and object responses
      const modulesData = response.data || response || [];
      setModules(Array.isArray(modulesData) ? modulesData : []);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch modules',
      });
      setModules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await courseApi.get('/users/mentors');
      setMentors(response.data || response);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch mentors',
      });
      console.error('Error fetching mentors:', error);
    }
  };

  // Module Management
  const handleCreateModule = async (values: any) => {
    try {
      if (editingModule) {
        await courseApi.put(`/admin/courses/modules/${editingModule.id}`, values);
        notification.success({
          message: 'Success',
          description: 'Module updated successfully',
        });
      } else {
        await courseApi.post('/admin/courses/modules', {
          ...values,
          mentorName: values.mentorName, // Send mentor name instead of mentorId
        });
        notification.success({
          message: 'Success',
          description: 'Module created successfully',
        });
      }
      setModuleModalVisible(false);
      setEditingModule(null);
      fetchModules(); // Refresh the list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save module',
      });
      console.error('Error saving module:', error);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await courseApi.delete(`/admin/courses/modules/${moduleId}`);
      notification.success({
        message: 'Success',
        description: 'Module deleted successfully',
      });
      fetchModules(); // Refresh the list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete module',
      });
      console.error('Error deleting module:', error);
    }
  };

  // Lesson Management
  const handleCreateLesson = async (values: any) => {
    try {
      if (editingLesson) {
        await courseApi.put(`/admin/courses/lessons/${editingLesson.id}`, values);
        notification.success({
          message: 'Success',
          description: 'Lesson updated successfully',
        });
      } else {
        await courseApi.post('/admin/courses/lessons', values);
        notification.success({
          message: 'Success',
          description: 'Lesson created successfully',
        });
      }
      setLessonModalVisible(false);
      setEditingLesson(null);
      setSelectedModule(null);
      fetchModules(); // Refresh the list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save lesson',
      });
      console.error('Error saving lesson:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      console.log('Attempting to delete lesson:', lessonId);
      const result = await courseApi.delete(`/admin/courses/lessons/${lessonId}`);
      console.log('Delete result:', result);
      notification.success({
        message: 'Success',
        description: 'Lesson deleted successfully',
      });
      fetchModules(); // Refresh the list
    } catch (error) {
      console.error('Error deleting lesson:', error);
      notification.error({
        message: 'Error',
        description: `Failed to delete lesson: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Resource Management
  const handleCreateResource = async (values: any) => {
    try {
      if (editingResource) {
        await courseApi.put(`/admin/courses/resources/${editingResource.id}`, values);
        notification.success({
          message: 'Success',
          description: 'Resource updated successfully',
        });
      } else {
        await courseApi.post('/admin/courses/resources', values);
        notification.success({
          message: 'Success',
          description: 'Resource created successfully',
        });
      }
      setResourceModalVisible(false);
      setEditingResource(null);
      setSelectedLesson(null);
      fetchModules(); // Refresh the list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save resource',
      });
      console.error('Error saving resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await courseApi.delete(`/admin/courses/resources/${resourceId}`);
      notification.success({
        message: 'Success',
        description: 'Resource deleted successfully',
      });
      fetchModules(); // Refresh the list
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete resource',
      });
      console.error('Error deleting resource:', error);
    }
  };

  // File Upload
  const handleFileUpload = async (file: File, type: 'lesson' | 'resource') => {
    try {
      const response = await courseApi.upload(file);
      return response.url || response.data?.url;
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to upload file',
      });
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Cleanup Progress
  // const handleCleanupProgress = async () => {
  //   try {
  //     await courseApi.post('/admin/courses/cleanup-progress', {});
  //     notification.success({
  //       message: 'Success',
  //       description: 'Progress cleanup completed successfully',
  //     });
  //   } catch (error) {
  //     notification.error({
  //       message: 'Error',
  //       description: 'Failed to cleanup progress',
  //     });
  //     console.error('Error cleaning up progress:', error);
  //   }
  // };

  // Module Columns
  const moduleColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Module) => (
        <div>
          <div className="module-title">{text}</div>
          <div className="module-mentor">
            <Avatar size="small" src={record.mentor.avatar} icon={<UserOutlined />} />
            <span>{record.mentorName || record.mentor.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'moduleType',
      key: 'moduleType',
      render: (type: string) => (
        <Tag color={type === 'premium' ? 'gold' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'estimatedDuration',
      key: 'estimatedDuration',
      render: (duration: number) => (
        <span>
          <ClockCircleOutlined /> {duration} min
        </span>
      ),
    },
    {
      title: 'Lessons',
      dataIndex: '_count',
      key: 'lessons',
      render: (count: any) => (
        <Tag color="green">{count?.lessons || 0} lessons</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Module) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedModule(record);
              setEditingLesson(null);
              setLessonModalVisible(true);
            }}
          >
            Add Lesson
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingModule(record);
              setModuleModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this module?"
            onConfirm={() => handleDeleteModule(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Lesson Columns
  const lessonColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Lesson) => (
        <div>
          <div className="lesson-title">{text}</div>
          <div className="lesson-description">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'lessonType',
      key: 'lessonType',
      render: (type: string) => {
        const icons = {
          video: <VideoCameraOutlined />,
          pdf: <FileTextOutlined />,
          live_session: <PlayCircleOutlined />
        };
        const colors = {
          video: 'red',
          pdf: 'blue',
          live_session: 'green'
        };
        return (
          <Tag color={colors[type as keyof typeof colors]} icon={icons[type as keyof typeof icons]}>
            {type.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <span>
          <ClockCircleOutlined /> {duration} min
        </span>
      ),
    },
    {
      title: 'Premium',
      dataIndex: 'isPremium',
      key: 'isPremium',
      render: (premium: boolean) => (
        <Tag color={premium ? 'gold' : 'default'}>
          {premium ? 'Premium' : 'Standard'}
        </Tag>
      ),
    },
    {
      title: 'Resources',
      dataIndex: 'resources',
      key: 'resources',
      render: (resources: Resource[]) => (
        <Tag color="red">{(resources || []).length} resources</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Lesson) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedLesson(record);
              setEditingResource(null);
              setResourceModalVisible(true);
            }}
          >
            Add Resource
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingLesson(record);
              setLessonModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this lesson?"
            onConfirm={() => handleDeleteLesson(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Statistics
  const stats = {
    totalModules: modules.length,
    totalLessons: modules.reduce((sum, module) => sum + (module._count?.lessons || 0), 0),
    activeModules: modules.filter(m => m.isActive).length,
    premiumModules: modules.filter(m => m.moduleType === 'premium').length,
  };

  return (
    <div className="course-modules-admin">
      <div className="admin-header">
        <h1>Course Content Management</h1>
        <p>Manage modules, lessons, and resources for your courses</p>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Modules"
              value={stats.totalModules}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Lessons"
              value={stats.totalLessons}
              prefix={<VideoCameraOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Modules"
              value={stats.activeModules}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Premium Modules"
              value={stats.premiumModules}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* File URL Helper */}
      <Card className="file-helper" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <strong>File Upload Instructions:</strong>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>📁 <strong>For now:</strong> Upload files manually to your production server and use the direct URL.</p>
          <p>📂 <strong>Suggested path:</strong> <code>/public/course-content/videos/module-1/lesson-1.mp4</code></p>
          <p>🔗 <strong>URL format:</strong> <code>https://yourdomain.com/course-content/videos/module-1/lesson-1.mp4</code></p>
        </div>
      </Card>

      {/* Main Content */}
      <Card className="main-content">
        <div className="content-header">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Modules" key="modules">
              <div className="tab-header">
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingModule(null);
                      setModuleModalVisible(true);
                    }}
                  >
                    Create Module
                  </Button>
                </Space>
              </div>
              <Table
                columns={moduleColumns}
                dataSource={modules}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
            <TabPane tab="All Lessons" key="lessons">
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedModule(null);
                    setEditingLesson(null);
                    setLessonModalVisible(true);
                  }}
                >
                  Create Lesson
                </Button>
              </div>
              <Table
                columns={lessonColumns}
                dataSource={modules.flatMap(module => 
                  module.lessons.map(lesson => ({ ...lesson, moduleTitle: module.title }))
                )}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </div>
      </Card>

      {/* Module Modal */}
      <Modal
        title={editingModule ? 'Edit Module' : 'Create Module'}
        open={moduleModalVisible}
        onCancel={() => {
          setModuleModalVisible(false);
          setEditingModule(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateModule}
          initialValues={editingModule || {}}
        >
          <Form.Item
            name="title"
            label="Module Title"
            rules={[{ required: true, message: 'Please enter module title' }]}
          >
            <Input placeholder="Enter module title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter module description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mentorName"
                label="Mentor Name"
                rules={[{ required: true, message: 'Please enter mentor name' }]}
              >
                <Input placeholder="Enter mentor full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="moduleType"
                label="Module Type"
                rules={[{ required: true, message: 'Please select module type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="standard">Standard</Option>
                  <Option value="premium">Premium</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderIndex"
                label="Order"
                rules={[{ required: true, message: 'Please enter order' }]}
              >
                <InputNumber min={1} placeholder="Order" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedDuration"
                label="Duration (minutes)"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <InputNumber min={1} placeholder="Duration" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" valuePropName="checked">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" style={{ marginRight: 8 }} />
              <span>Active</span>
            </div>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingModule ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setModuleModalVisible(false);
                setEditingModule(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Lesson Modal */}
      <Modal
        title={editingLesson ? 'Edit Lesson' : 'Create Lesson'}
        open={lessonModalVisible}
        onCancel={() => {
          setLessonModalVisible(false);
          setEditingLesson(null);
          setSelectedModule(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateLesson}
          initialValues={editingLesson || { moduleId: selectedModule?.id }}
        >
          <Form.Item
            name="title"
            label="Lesson Title"
            rules={[{ required: true, message: 'Please enter lesson title' }]}
          >
            <Input placeholder="Enter lesson title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter lesson description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="moduleId"
                label="Module"
                rules={[{ required: true, message: 'Please select a module' }]}
              >
                <Select placeholder="Select module">
                  {modules.map(module => (
                    <Option key={module.id} value={module.id}>
                      {module.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lessonType"
                label="Lesson Type"
                rules={[{ required: true, message: 'Please select lesson type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="video">Video</Option>
                  <Option value="pdf">PDF</Option>
                  <Option value="live_session">Live Session</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderIndex"
                label="Order"
                rules={[{ required: true, message: 'Please enter order' }]}
              >
                <InputNumber min={1} placeholder="Order" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Duration (minutes)"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <InputNumber min={1} placeholder="Duration" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="contentUrl" 
            label="Content URL"
            extra="Enter the direct URL to your video/PDF file (e.g., https://yourdomain.com/course-content/videos/lesson-1.mp4)"
          >
            <Input 
              placeholder="https://yourdomain.com/course-content/videos/lesson-1.mp4" 
              addonBefore={
                <Select defaultValue="https://" style={{ width: 80 }}>
                  <Option value="https://">https://</Option>
                  <Option value="http://">http://</Option>
                </Select>
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isPremium" valuePropName="checked">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  <span>Premium Content</span>
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" valuePropName="checked">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  <span>Active</span>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingLesson ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setLessonModalVisible(false);
                setEditingLesson(null);
                setSelectedModule(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Resource Modal */}
      <Modal
        title={editingResource ? 'Edit Resource' : 'Create Resource'}
        open={resourceModalVisible}
        onCancel={() => {
          setResourceModalVisible(false);
          setEditingResource(null);
          setSelectedLesson(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateResource}
          initialValues={editingResource || { lessonId: selectedLesson?.id }}
        >
          <Form.Item
            name="title"
            label="Resource Title"
            rules={[{ required: true, message: 'Please enter resource title' }]}
          >
            <Input placeholder="Enter resource title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter resource description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lessonId"
                label="Lesson"
                rules={[{ required: true, message: 'Please select a lesson' }]}
              >
                <Select placeholder="Select lesson">
                  {modules.flatMap(module => 
                    module.lessons.map(lesson => ({
                      ...lesson,
                      moduleTitle: module.title
                    }))
                  ).map(lesson => (
                    <Option key={lesson.id} value={lesson.id}>
                      {lesson.moduleTitle} - {lesson.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="resourceType"
                label="Resource Type"
                rules={[{ required: true, message: 'Please select resource type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="pdf">PDF</Option>
                  <Option value="document">Document</Option>
                  <Option value="link">Link</Option>
                  <Option value="template">Template</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fileUrl" label="File URL">
                <Input placeholder="Enter file URL" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="externalUrl" label="External URL">
                <Input placeholder="Enter external URL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderIndex"
                label="Order"
                rules={[{ required: true, message: 'Please enter order' }]}
              >
                <InputNumber min={1} placeholder="Order" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileSize" label="File Size (KB)">
                <InputNumber min={0} placeholder="File size" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isDownloadable" valuePropName="checked">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  <span>Downloadable</span>
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPremium" valuePropName="checked">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" style={{ marginRight: 8 }} />
                  <span>Premium Resource</span>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingResource ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setResourceModalVisible(false);
                setEditingResource(null);
                setSelectedLesson(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseModulesAdmin; 