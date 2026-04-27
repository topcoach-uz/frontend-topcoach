import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Space, 
  Popconfirm, 
  message, 
  Card, 
  Row, 
  Col, 
  Statistic,
  Progress,
  Switch,
  Tabs,
  Tag,
  Avatar,
  notification,
  Tooltip,
  List,
  Divider
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import { Plus, Pencil, Trash2, User, Clock, Video, FileText, PlayCircle, Info, BookOpen, Upload, Eye, Link, CheckCircle2 } from 'lucide-react';
import { Segmented } from 'antd';
import { useGetCourseStructureQuery } from 'src/app/services/courses';
import { ACCESS_TOKEN } from 'src/constants/storage';
import ResearchAdminTab from '../research/ResearchAdminTab';
import './index.scss';

const { TextArea } = Input;
const { Option } = Select;

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
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Expected JSON but got: ${contentType}`);
    }
    
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('Empty response body');
        return { data: [], total: 0, message: 'Empty response' };
      }
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
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
    
    const response = await fetch('/api/course-admin/courses/upload', {
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
  courseName?: 'admissions' | 'sat';
  mentor: {
    id: string;
    email: string;
    avatar?: string;
  };
  lessons: Lesson[];
  submodules?: Submodule[];
  _count?: {
    lessons: number;
  };
}

interface Submodule {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  orderIndex: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  submoduleId?: string;
  orderIndex: number;
  lessonType: 'video' | 'pdf' | 'live_session';
  contentUrl?: string;
  duration: number;
  isActive: boolean;
  isPremium: boolean;
  resources: Resource[];
  videoType?: 'regular' | 'vdocipher';
  vdocipherVideoId?: string;
  useVdoCipher?: boolean;
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

const CourseManagementAdmin: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingSubmodule, setEditingSubmodule] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedSubmodule, setSelectedSubmodule] = useState<any | null>(null);
  const [submoduleModalVisible, setSubmoduleModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('modules');
  const [courseName, setCourseName] = useState<'admissions' | 'sat' | 'research'>('admissions');
  const [lessonForm] = Form.useForm();
  
  const user = useGetCourseStructureQuery();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    if (!token) {
      notification.warning({
        message: 'Access Required',
        description: 'Please log in to access admin panel',
      });
      return;
    }
    
    // Research Prep uses its own RTK slice + dedicated authoring tab —
    // skip the legacy /course-admin/courses/modules call which doesn't
    // serve `courseName=research`.
    if (courseName === 'research') {
      setModules([]);
      return;
    }

    const loadModules = async () => {
      try {
        const url = `/course-admin/courses/modules?courseName=${courseName}`;
        const response = await courseApi.get(url);
        const modulesData = response.data || [];
        setModules(Array.isArray(modulesData) ? modulesData : []);
        console.log('Initial modules load:', modulesData);
      } catch (error) {
        console.error('Error in initial modules load:', error);
        notification.error({
          message: 'Error',
          description: `Failed to fetch modules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };

    loadModules();
  }, [user, courseName]);

  // Fetch modules and mentors
  useEffect(() => {
    if (courseName === 'research') return;
    const loadData = async () => {
      await fetchModules();
      await fetchMentors();
    };
    loadData();
  }, [courseName]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log('Fetching modules... Token exists:', !!token, 'courseName:', courseName);
      
      const url = `/course-admin/courses/modules?courseName=${courseName}`;
      console.log('Fetching from URL:', url);
      const response = await courseApi.get(url);
      
      console.log('Raw API response:', response);
      
      // Backend returns { data: modules, total: count, message: '...' }
      const modulesData = response.data || [];
      console.log('Modules data:', modulesData);
      console.log('Modules array check:', Array.isArray(modulesData));
      
      setModules(Array.isArray(modulesData) ? modulesData : []);
      
      // Log each module and its lessons
      if (Array.isArray(modulesData)) {
        modulesData.forEach((module, index) => {
          console.log(`Module ${index}:`, module.title, 'Lessons:', module.lessons?.length || 0);
          if (module.lessons) {
            module.lessons.forEach((lesson: any, lessonIndex: number) => {
              console.log(`  Lesson ${lessonIndex}:`, {
                title: lesson.title,
                lessonType: lesson.lessonType,
                contentUrl: lesson.contentUrl,
                useVdoCipher: lesson.useVdoCipher,
                vdocipherVideoId: lesson.vdocipherVideoId
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      notification.error({
        message: 'Error',
        description: `Failed to fetch modules: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setModules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await courseApi.get('/users/mentors');
      // Handle both { data: [...] } and direct array responses
      const mentorsData = Array.isArray(response) ? response : (response.data || response);
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: `Failed to fetch mentors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.error('Error fetching mentors:', error);
    }
  };

  // Module Management
  const handleCreateModule = async (values: any) => {
    try {
      if (editingModule) {
        await courseApi.put(`/course-admin/courses/modules/${editingModule.id}`, values);
        notification.success({
          message: 'Success',
          description: 'Module updated successfully',
        });
      } else {
        await courseApi.post('/course-admin/courses/modules', {
          ...values,
          mentorName: values.mentorName, // Send mentor name instead of mentorId
          courseName: courseName, // Include courseName
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
      await courseApi.delete(`/course-admin/courses/modules/${moduleId}`);
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
      // Ensure only one of moduleId or submoduleId is set (not both)
      const lessonData: any = {
        ...values,
        // Clear moduleId if submoduleId is provided
        moduleId: values.submoduleId ? undefined : values.moduleId,
        // Clear submoduleId if moduleId is provided
        submoduleId: values.moduleId ? undefined : values.submoduleId,
        // Handle VdoCipher fields for video lessons
        useVdoCipher: values.lessonType === 'video' && values.videoType === 'vdocipher',
        vdocipherVideoId: values.lessonType === 'video' && values.videoType === 'vdocipher' ? values.vdocipherVideoId : undefined,
        // Handle contentUrl for different lesson types
        contentUrl: values.lessonType === 'pdf' ? values.contentUrl : 
                   (values.lessonType === 'video' && values.videoType === 'regular') ? values.contentUrl : undefined,
      };
      
      // Remove undefined values to avoid sending them
      Object.keys(lessonData).forEach(key => {
        if (lessonData[key] === undefined || lessonData[key] === null || lessonData[key] === '') {
          delete lessonData[key];
        }
      });

      console.log('Saving lesson with data:', lessonData);

      if (editingLesson) {
        const response = await courseApi.put(`/course-admin/courses/lessons/${editingLesson.id}`, lessonData);
        console.log('Update response:', response);
        notification.success({
          message: 'Success',
          description: 'Lesson updated successfully',
        });
      } else {
        const response = await courseApi.post('/course-admin/courses/lessons', lessonData);
        console.log('Create response:', response);
        notification.success({
          message: 'Success',
          description: 'Lesson created successfully',
        });
      }
      lessonForm.resetFields();
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

  // Submodule Management
  const handleCreateSubmodule = async (values: any) => {
    try {
      const submoduleData = {
        ...values,
        moduleId: selectedModule?.id || values.moduleId,
      };

      if (editingSubmodule) {
        await courseApi.put(`/course-admin/courses/submodules/${editingSubmodule.id}`, submoduleData);
        notification.success({
          message: 'Success',
          description: 'Submodule updated successfully',
        });
      } else {
        await courseApi.post('/course-admin/courses/submodules', submoduleData);
        notification.success({
          message: 'Success',
          description: 'Submodule created successfully',
        });
      }
      setSubmoduleModalVisible(false);
      setEditingSubmodule(null);
      setSelectedModule(null);
      fetchModules();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save submodule',
      });
      console.error('Error saving submodule:', error);
    }
  };

  const handleDeleteSubmodule = async (submoduleId: string) => {
    try {
      await courseApi.delete(`/course-admin/courses/submodules/${submoduleId}`);
      notification.success({
        message: 'Success',
        description: 'Submodule deleted successfully',
      });
      fetchModules();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete submodule',
      });
      console.error('Error deleting submodule:', error);
    }
  };

  // Task Management
  const handleCreateTask = async (values: any) => {
    try {
      // Find the first correct answer index for backend compatibility
      const options = values.options || [];
      const correctIndices = options
        .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1);
      
      if (correctIndices.length === 0) {
        notification.error({
          message: 'Error',
          description: 'Please mark at least one option as correct',
        });
        return;
      }

      // Use the first correct answer index for backend
      const correctAnswerIndex = correctIndices[0];

      const taskData = {
        ...values,
        lessonId: selectedLesson?.id || values.lessonId,
        taskType: 'multiple_choice',
        options: options.map((opt: any) => ({ text: opt.text, isCorrect: opt.isCorrect })),
        correctAnswerIndex: correctAnswerIndex,
        points: values.points || 1,
      };

      if (editingTask) {
        await courseApi.put(`/course-admin/tasks/${editingTask.id}`, taskData);
        notification.success({
          message: 'Success',
          description: 'Task updated successfully',
        });
      } else {
        await courseApi.post('/course-admin/tasks', taskData);
        notification.success({
          message: 'Success',
          description: 'Task created successfully',
        });
      }
      setTaskModalVisible(false);
      setEditingTask(null);
      setSelectedLesson(null);
      fetchModules();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save task',
      });
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await courseApi.delete(`/course-admin/tasks/${taskId}`);
      notification.success({
        message: 'Success',
        description: 'Task deleted successfully',
      });
      fetchModules();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete task',
      });
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      console.log('Attempting to delete lesson:', lessonId);
      const result = await courseApi.delete(`/course-admin/courses/lessons/${lessonId}`);
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
        await courseApi.put(`/course-admin/courses/resources/${editingResource.id}`, values);
        notification.success({
          message: 'Success',
          description: 'Resource updated successfully',
        });
      } else {
        await courseApi.post('/course-admin/courses/resources', values);
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
      await courseApi.delete(`/course-admin/courses/resources/${resourceId}`);
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
  //     message.success({
  //       message: 'Success',
  //       description: 'Progress cleanup completed successfully',
  //     });
  //   } catch (error) {
  //     message.error({
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
            <Avatar size="small" src={record.mentor.avatar} icon={<User size={16} />} />
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
          <Clock size={16} /> {duration} min
        </span>
      ),
    },
    {
      title: 'Lessons',
      key: 'lessons',
      render: (_: any, record: Module) => {
        // Count lessons directly under module
        const moduleLessonsCount = (record.lessons || []).length;
        // Count lessons from submodules
        const submoduleLessonsCount = (record.submodules || []).reduce((total, submodule) => {
          return total + (submodule.lessons || []).length;
        }, 0);
        const totalLessons = moduleLessonsCount + submoduleLessonsCount;
        return (
          <Tag color="green">{totalLessons} lessons</Tag>
        );
      },
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
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedModule(record);
              setEditingSubmodule(null);
              setSubmoduleModalVisible(true);
            }}
          >
            Add Submodule
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
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
            icon={<Pencil size={16} />}
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
            <Button size="small" danger icon={<Trash2 size={16} />}>
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
      render: (text: string, record: Lesson & { moduleTitle?: string; submoduleTitle?: string }) => (
        <div>
          <div className="lesson-title">{text}</div>
          <div className="lesson-description">
            {record.description}
            {(record as any).submoduleTitle && (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Module: {(record as any).moduleTitle} → Submodule: {(record as any).submoduleTitle}
              </div>
            )}
            {!(record as any).submoduleTitle && (record as any).moduleTitle && (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Module: {(record as any).moduleTitle}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'lessonType',
      key: 'lessonType',
      render: (type: string) => {
        const icons = {
          video: <Video size={16} />,
          pdf: <FileText size={16} />,
          live_session: <PlayCircle size={16} />
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
          <Clock size={16} /> {duration} min
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
      title: 'Tasks',
      dataIndex: 'tasks',
      key: 'tasks',
      render: (tasks: any[]) => (
        <Tag color="blue">{(tasks || []).length} tasks</Tag>
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
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedLesson(record);
              setEditingTask(null);
              setTaskModalVisible(true);
            }}
          >
            Add Task
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
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
            icon={<Pencil size={16} />}
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
            <Button size="small" danger icon={<Trash2 size={16} />}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
        <h1>Course Content Management</h1>
        <p>Manage modules, lessons, and resources for your courses</p>
          </div>
          <Segmented
            options={[
              { label: 'Admissions', value: 'admissions' },
              { label: 'SAT', value: 'sat' },
              { label: 'Research Prep', value: 'research' },
            ]}
            value={courseName}
            onChange={(value) => setCourseName(value as 'admissions' | 'sat' | 'research')}
          />
        </div>
      </div>

      {/* Statistics — Admissions/SAT only. Research has its own stat strip
          inside ResearchAdminTab. */}
      {courseName !== 'research' && (
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Modules"
              value={stats.totalModules}
              prefix={<BookOpen size={16} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Lessons"
              value={stats.totalLessons}
              prefix={<Video size={16} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Modules"
              value={stats.activeModules}
              prefix={<BookOpen size={16} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Premium Modules"
              value={stats.premiumModules}
              prefix={<BookOpen size={16} />}
            />
          </Card>
        </Col>
      </Row>
      )}

      {/* File URL Helper */}
      {courseName !== 'research' && (
      <Card className="file-helper" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Info size={16} color="#1890ff" />
          <strong>File Upload Instructions:</strong>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>📁 <strong>For now:</strong> Upload files manually to your production server and use the direct URL.</p>
          <p>📂 <strong>Suggested path:</strong> <code>/public/course-content/videos/module-1/lesson-1.mp4</code></p>
          <p>🔗 <strong>URL format:</strong> <code>https://yourdomain.com/course-content/videos/module-1/lesson-1.mp4</code></p>
        </div>
      </Card>
      )}

      {/* Research Prep — fixed 8-week curriculum (different shape from
          Admissions/SAT, so it gets a dedicated authoring tab). */}
      {courseName === 'research' && <ResearchAdminTab />}

      {/* Main Content — Admissions / SAT module CRUD */}
      {courseName !== 'research' && (
      <Card className="main-content">
        <div className="content-header">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'modules',
                label: 'Modules',
                children: (
                  <>
              <div className="tab-header">
                <Space>
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
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
                  </>
                ),
              },
              {
                key: 'lessons',
                label: 'All Lessons',
                children: (
                  <>
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
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
                      dataSource={modules.flatMap(module => {
                        const moduleLessons = (module.lessons || []).map(lesson => ({ 
                          ...lesson, 
                          moduleTitle: module.title,
                          submoduleTitle: undefined
                        }));
                        const submoduleLessons = (module.submodules || []).flatMap(submodule => 
                          (submodule.lessons || []).map(lesson => ({ 
                            ...lesson, 
                            moduleTitle: module.title,
                            submoduleTitle: submodule.title
                          }))
                        );
                        return [...moduleLessons, ...submoduleLessons];
                      })}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
                  </>
                ),
              },
            ]}
          />
        </div>
      </Card>
      )}

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

          <Form.Item
            name="courseName"
            label="Course"
            rules={[{ required: true, message: 'Please select course' }]}
            initialValue={courseName}
          >
            <Select placeholder="Select course">
              <Option value="admissions">Admissions</Option>
              <Option value="sat">SAT</Option>
            </Select>
          </Form.Item>

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
          lessonForm.resetFields();
          setLessonModalVisible(false);
          setEditingLesson(null);
          setSelectedModule(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={lessonForm}
          layout="vertical"
          onFinish={handleCreateLesson}
          initialValues={
            editingLesson 
              ? {
                  ...editingLesson,
                  videoType: editingLesson.lessonType === 'video' ? (editingLesson.useVdoCipher ? 'vdocipher' : 'regular') : undefined,
                }
              : { 
                  moduleId: selectedModule?.id,
                  lessonType: 'video',
                  videoType: 'vdocipher'
                }
          }
          onValuesChange={(changedValues, allValues) => {
            // Clear submodule if module is selected
            if (changedValues.moduleId && allValues.submoduleId) {
              lessonForm.setFieldsValue({ submoduleId: undefined });
            }
            // Clear module if submodule is selected
            if (changedValues.submoduleId && allValues.moduleId) {
              lessonForm.setFieldsValue({ moduleId: undefined });
            }
          }}
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
                dependencies={['submoduleId']}
                rules={[
                  { 
                    validator: (_, value) => {
                      // Validation will be handled by onValuesChange
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Select 
                  placeholder="Select module (optional if submodule selected)"
                  allowClear
                >
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
                name="submoduleId"
                label="Submodule"
                dependencies={['moduleId']}
              >
                <Select 
                  placeholder="Select submodule (optional if module selected)"
                  allowClear
                >
                  {modules.flatMap(module => 
                    (module.submodules || []).map((submodule: any) => (
                      <Option key={submodule.id} value={submodule.id}>
                        {module.title} - {submodule.title}
                      </Option>
                    ))
                  )}
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

          {/* Video Configuration */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.lessonType !== currentValues.lessonType}
          >
            {({ getFieldValue }) => {
              const lessonType = getFieldValue('lessonType');
              
              if (lessonType === 'video') {
                return (
                  <>
                    <Form.Item
                      name="videoType"
                      label="Video Type"
                      rules={[{ required: true, message: 'Please select video type' }]}
                    >
                      <Select placeholder="Select video type">
                        <Option value="regular">Regular Video (URL/File)</Option>
                        <Option value="vdocipher">VdoCipher Secure Video</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => prevValues.videoType !== currentValues.videoType}
                    >
                      {({ getFieldValue }) => {
                        const videoType = getFieldValue('videoType');
                        
                        if (videoType === 'regular') {
                          return (
          <Form.Item 
            name="contentUrl" 
                              label="Video URL"
                              rules={[{ required: true, message: 'Please enter video URL' }]}
                              extra="Enter the direct URL to your video file (e.g., https://yourdomain.com/course-content/videos/lesson-1.mp4)"
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
                          );
                        }
                        
                        if (videoType === 'vdocipher') {
                          return (
                            <>
                              <Form.Item
                                name="vdocipherVideoId"
                                label="VdoCipher Video ID"
                                rules={[{ required: true, message: 'Please enter VdoCipher Video ID' }]}
                                extra="Enter your VdoCipher video ID (e.g., 1234567890abcdef)"
                              >
                                <Input placeholder="Enter VdoCipher Video ID" />
                              </Form.Item>
                              
                              <div style={{ 
                                backgroundColor: '#f6ffed', 
                                border: '1px solid #b7eb8f', 
                                borderRadius: '6px', 
                                padding: '12px', 
                                marginBottom: '16px' 
                              }}>
                                <h4 style={{ color: '#52c41a', margin: '0 0 8px 0' }}>🔒 VdoCipher Security Features</h4>
                              </div>
                            </>
                          );
                        }
                        
                        return null;
                      }}
                    </Form.Item>
                  </>
                );
              }
              
              if (lessonType === 'pdf') {
                return (
                  <Form.Item 
                    name="contentUrl" 
                    label="PDF URL"
                    rules={[{ required: true, message: 'Please enter PDF URL' }]}
                    extra="Enter the direct URL to your PDF file"
                  >
                    <Input 
                      placeholder="https://yourdomain.com/course-content/pdfs/lesson-1.pdf" 
                      addonBefore={
                        <Select defaultValue="https://" style={{ width: 80 }}>
                          <Option value="https://">https://</Option>
                          <Option value="http://">http://</Option>
                        </Select>
                      }
                    />
                  </Form.Item>
                );
              }
              
              return null;
            }}
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

      {/* Submodule Modal */}
      <Modal
        title={editingSubmodule ? 'Edit Submodule' : 'Create Submodule'}
        open={submoduleModalVisible}
        onCancel={() => {
          setSubmoduleModalVisible(false);
          setEditingSubmodule(null);
          setSelectedModule(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateSubmodule}
          initialValues={
            editingSubmodule 
              ? editingSubmodule
              : { 
                  moduleId: selectedModule?.id,
                  isActive: true
                }
          }
        >
          <Form.Item
            name="title"
            label="Submodule Title"
            rules={[{ required: true, message: 'Please enter submodule title' }]}
          >
            <Input placeholder="Enter submodule title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter submodule description" />
          </Form.Item>

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

          <Form.Item
            name="orderIndex"
            label="Order Index"
            rules={[{ required: true, message: 'Please enter order index' }]}
          >
            <InputNumber min={0} placeholder="Order" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" label="Active">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSubmodule ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setSubmoduleModalVisible(false);
                setEditingSubmodule(null);
                setSelectedModule(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={taskModalVisible}
        onCancel={() => {
          setTaskModalVisible(false);
          setEditingTask(null);
          setSelectedLesson(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          layout="vertical"
          onFinish={handleCreateTask}
          initialValues={
            editingTask 
              ? {
                  ...editingTask,
                  options: editingTask.options?.map((opt: any, idx: number) => {
                    const text = typeof opt === 'string' ? opt : (opt.text || opt);
                    const isCorrect = typeof opt === 'object' && opt.isCorrect !== undefined 
                      ? opt.isCorrect 
                      : (idx === (editingTask.correctAnswerIndex ?? 0));
                    return { text, isCorrect };
                  }) || []
                }
              : { 
                  lessonId: selectedLesson?.id,
                  taskType: 'multiple_choice',
                  points: 1,
                  isActive: true,
                  orderIndex: 0,
                  options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                  ],
                  correctAnswerIndex: 0,
                }
          }
        >
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: 'Please enter question' }]}
          >
            <TextArea rows={3} placeholder="Enter the question" />
          </Form.Item>

          <Form.Item
            name="lessonId"
            label="Lesson"
            rules={[{ required: true, message: 'Please select a lesson' }]}
          >
            <Select 
              placeholder="Select lesson"
              disabled={!!selectedLesson?.id}
            >
              {modules.flatMap(module => [
                ...(module.lessons || []).map((lesson: any) => (
                  <Option key={lesson.id} value={lesson.id}>
                    {module.title} - {lesson.title}
                  </Option>
                )),
                ...(module.submodules || []).flatMap((submodule: any) =>
                  (submodule.lessons || []).map((lesson: any) => (
                    <Option key={lesson.id} value={lesson.id}>
                      {module.title} / {submodule.title} - {lesson.title}
                    </Option>
                  ))
                )
              ])}
            </Select>
          </Form.Item>

          <Form.Item
            name="options"
            label="Answer Options"
            rules={[
              { required: true, message: 'Please add at least 2 options' },
              {
                validator: (_, value) => {
                  if (!value || value.length < 2) {
                    return Promise.reject(new Error('At least 2 options required'));
                  }
                  const correctCount = value.filter((opt: any) => opt.isCorrect).length;
                  if (correctCount === 0) {
                    return Promise.reject(new Error('At least one option must be marked as correct'));
                  }
                  if (correctCount > 2) {
                    return Promise.reject(new Error('Maximum 2 options can be marked as correct'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
                    Mark 1-2 options as correct by toggling the switch
                  </div>
                  {fields.map((field, index) => (
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                      return prevValues?.options?.[field.name]?.isCorrect !== currentValues?.options?.[field.name]?.isCorrect;
                    }}>
                      {({ getFieldValue }) => {
                        const isCorrect = getFieldValue(['options', field.name, 'isCorrect']);
                        return (
                          <div
                            key={field.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 12,
                              padding: '16px',
                              border: isCorrect ? '2px solid #52c41a' : '1px solid #d9d9d9',
                              borderRadius: '8px',
                              backgroundColor: isCorrect ? '#f6ffed' : '#fff',
                              transition: 'all 0.2s',
                              gap: '12px'
                            }}
                          >
                            <span style={{ 
                              fontWeight: 600, 
                              color: isCorrect ? '#52c41a' : '#666',
                              minWidth: '32px',
                              textAlign: 'center',
                              fontSize: '16px'
                            }}>
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <Form.Item
                              {...field}
                              name={[field.name, 'text']}
                              rules={[{ required: true, message: 'Option text required' }]}
                              style={{ flex: 1, margin: 0 }}
                            >
                              <Input 
                                placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                                style={{ 
                                  border: 'none', 
                                  boxShadow: 'none',
                                  fontSize: '14px'
                                }}
                              />
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                              return prevValues?.options?.[field.name]?.isCorrect !== currentValues?.options?.[field.name]?.isCorrect;
                            }}>
                              {({ getFieldValue, setFieldsValue }) => {
                                const currentIsCorrect = getFieldValue(['options', field.name, 'isCorrect']);
                                return (
                                  <div style={{ margin: 0 }}>
                                    <Button
                                      type={currentIsCorrect ? 'primary' : 'default'}
                                      icon={currentIsCorrect ? <CheckCircle2 size={16} /> : null}
                                      onClick={() => {
                                        const currentOptions = getFieldValue('options') || [];
                                        const updatedOptions = [...currentOptions];
                                        updatedOptions[field.name] = {
                                          ...updatedOptions[field.name],
                                          isCorrect: !currentIsCorrect
                                        };
                                        setFieldsValue({ options: updatedOptions });
                                      }}
                                      style={{
                                        minWidth: '130px',
                                        height: '38px',
                                        borderRadius: '8px',
                                        border: currentIsCorrect ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                        backgroundColor: currentIsCorrect ? '#52c41a' : '#fff',
                                        color: currentIsCorrect ? '#fff' : '#666',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: currentIsCorrect 
                                          ? '0 4px 12px rgba(82, 196, 26, 0.3)' 
                                          : '0 2px 4px rgba(0, 0, 0, 0.06)',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!currentIsCorrect) {
                                          e.currentTarget.style.borderColor = '#52c41a';
                                          e.currentTarget.style.color = '#52c41a';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!currentIsCorrect) {
                                          e.currentTarget.style.borderColor = '#d9d9d9';
                                          e.currentTarget.style.color = '#666';
                                        }
                                      }}
                                    >
                                      {currentIsCorrect ? (
                                        <>
                                          <CheckCircle2 size={16} />
                                          Correct
                                        </>
                                      ) : (
                                        'Mark Correct'
                                      )}
                                    </Button>
                                    <Form.Item
                                      {...field}
                                      name={[field.name, 'isCorrect']}
                                      hidden
                                    >
                                      <Input type="hidden" />
                                    </Form.Item>
                                  </div>
                                );
                              }}
                            </Form.Item>
                            {fields.length > 2 && (
                              <Button 
                                type="text" 
                                danger 
                                icon={<Trash2 size={16} />}
                                onClick={() => remove(field.name)}
                                style={{ marginLeft: 'auto' }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        );
                      }}
                    </Form.Item>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => add({ text: '', isCorrect: false })} 
                    block 
                    icon={<Plus size={16} />}
                    style={{ marginTop: 8 }}
                  >
                    Add Option
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="points"
                label="Points"
                rules={[{ required: true, message: 'Please enter points' }]}
              >
                <InputNumber min={1} placeholder="1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="orderIndex"
                label="Order Index"
                rules={[{ required: true, message: 'Please enter order index' }]}
              >
                <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="correctAnswerIndex"
            hidden
          >
            <InputNumber />
          </Form.Item>

          <Form.Item name="explanation" label="Explanation (shown after submission)">
            <TextArea rows={2} placeholder="Optional explanation for the correct answer" />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" label="Active">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTask ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setTaskModalVisible(false);
                setEditingTask(null);
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

export default CourseManagementAdmin; 