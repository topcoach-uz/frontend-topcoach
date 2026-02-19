import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Select, Table, Tag, Button, Space, Progress, Spin, Alert, Dropdown, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './students.scss';

const { Search } = Input;
const { Option } = Select;

interface StudentData {
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null; // Keep for backward compatibility
  courseName: string | null; // Admissions or SAT
  amount: number | null;
  paymentStatus: string | null;
  status: string | null;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessGrantedAt: string | null;
  progressPercentage: number | null;
}

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOrganizationId, isSuperAdmin, isCounselor } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudentData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    if (selectedOrganizationId || isCounselor) {
      fetchData();
    }
  }, [selectedOrganizationId, isCounselor, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedOrganizationId) {
        params.append('organizationId', selectedOrganizationId);
      }
      if (searchText) {
        params.append('search', searchText);
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }
      
      const response = await api.request({
        path: `/school-counselor-dashboard?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      setData(response.data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC');
    } else {
      setSortBy('');
      setSortOrder('DESC');
    }
  };

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    let filtered = [...data];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => {
        if (statusFilter === 'active') {
          return student.status === 'completed' && student.paymentStatus === 'completed';
        } else if (statusFilter === 'inactive') {
          return student.status !== 'completed' || student.paymentStatus !== 'completed';
        } else if (statusFilter === 'completed') {
          return student.status === 'completed';
        } else if (statusFilter === 'pending') {
          return student.paymentStatus === 'pending' || student.status === 'pending';
        }
        return true;
      });
    }
    
    if (courseFilter !== 'all') {
      filtered = filtered.filter((student) => 
        (student.courseName && student.courseName === courseFilter) || 
        (!student.courseName && student.courseType === courseFilter)
      );
    }

    return filtered;
  }, [data, statusFilter, courseFilter]);

  const handleViewStudent = (studentId: string) => {
    navigate(`/school-counselor/students/${studentId}/my-journey`);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredStudents.map((student) => ({
      'Student Name': student.userName,
      'Email': student.userEmail,
      'Phone Number': student.telegramPhoneNumber || 'N/A',
      'Telegram Status': student.telegramStatus || 'N/A',
      'Course': student.courseName 
        ? (student.courseName === 'admissions' ? 'Admissions Program' : student.courseName === 'sat' ? 'SAT Prep Course' : student.courseName.toUpperCase())
        : student.courseType?.toUpperCase() || 'N/A',
      'Progress (%)': Math.round(student.progressPercentage || 0),
      'Enrolled At': student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A',
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Student Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone Number
      { wch: 15 }, // Telegram Status
      { wch: 12 }, // Course Type
      { wch: 12 }, // Progress
      { wch: 15 }, // Enrolled At
    ];
    ws['!cols'] = colWidths;

    // Generate Excel file
    const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Students Export', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare data for table
    const tableData = filteredStudents.map((student) => [
      student.userName,
      student.userEmail,
      student.telegramPhoneNumber || 'N/A',
      student.telegramStatus || 'N/A',
      student.courseName 
        ? (student.courseName === 'admissions' ? 'Admissions Program' : student.courseName === 'sat' ? 'SAT Prep Course' : student.courseName.toUpperCase())
        : student.courseType?.toUpperCase() || 'N/A',
      `${Math.round(student.progressPercentage || 0)}%`,
      student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A',
    ]);

    // Add table
    autoTable(doc, {
      head: [['Student Name', 'Email', 'Phone', 'Telegram Status', 'Course Type', 'Progress', 'Enrolled At']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 0, 0] }, // Dark red header
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Save PDF
    const fileName = `students_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: 'Export as Excel',
      icon: <FileExcelOutlined />,
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FilePdfOutlined />,
      onClick: exportToPDF,
    },
  ];

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      completed: 'green',
      pending: 'orange',
      failed: 'red',
      cancelled: 'default',
      rejected: 'red',
    };
    return colors[status || ''] || 'default';
  };

  const getTelegramStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      connected: 'green',
      pending: 'orange',
      failed: 'red',
    };
    return colors[status || ''] || 'default';
  };

  const columns: ColumnsType<StudentData> = [
    {
      title: t('schoolCounselor.students.student', 'Student'),
      key: 'student',
      width: 250,
      render: (_, record) => {
        // Count how many enrollments this student has
        const studentEnrollments = data.filter(d => d.userId === record.userId);
        const enrollmentCount = studentEnrollments.length;
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>
              {record.userName}
              {enrollmentCount > 1 && (
                <Tag color="blue" style={{ marginLeft: 8, fontSize: '11px' }}>
                  {enrollmentCount} courses
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{record.userEmail}</div>
          </div>
        );
      },
    },
    {
      title: t('schoolCounselor.students.telegramStatus', 'Telegram Status'),
      dataIndex: 'telegramStatus',
      key: 'telegramStatus',
      width: 150,
      render: (status: string | null) => (
        <Tag color={getTelegramStatusColor(status)}>
          {status?.toUpperCase() || 'N/A'}
        </Tag>
      ),
      filters: [
        { text: 'Connected', value: 'connected' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.telegramStatus === value,
    },
    {
      title: t('schoolCounselor.students.phoneNumber', 'Phone Number'),
      dataIndex: 'telegramPhoneNumber',
      key: 'telegramPhoneNumber',
      width: 150,
      render: (phone: string | null) => phone || 'N/A',
    },
    {
      title: t('schoolCounselor.students.course', 'Course'),
      dataIndex: 'courseName',
      key: 'courseName',
      width: 150,
      render: (courseName: string | null, record: StudentData) => {
        const course = courseName || record.courseType;
        if (!course) return 'N/A';
        
        // Map course names to display names
        const courseDisplay = course.toLowerCase() === 'admissions' 
          ? 'Admissions Program' 
          : course.toLowerCase() === 'sat' 
          ? 'SAT Prep Course' 
          : course.toUpperCase();
        const color = course.toLowerCase() === 'admissions' ? 'blue' : course.toLowerCase() === 'sat' ? 'purple' : 'default';
        return <Tag color={color}>{courseDisplay}</Tag>;
      },
      filters: [
        { text: 'Admissions Program', value: 'admissions' },
        { text: 'SAT Prep Course', value: 'sat' },
      ],
      onFilter: (value, record) => (record.courseName || record.courseType) === value,
    },
    {
      title: t('schoolCounselor.students.progress', 'Progress'),
      key: 'progress',
      width: 180,
      render: (_, record) => {
        if (record.progressPercentage === null) return 'N/A';
        const roundedProgress = Math.round(record.progressPercentage);
        return (
          <div style={{ minWidth: 160 }}>
            <Progress
              percent={roundedProgress}
              strokeColor={roundedProgress >= 80 ? '#52c41a' : roundedProgress >= 50 ? '#faad14' : '#ff4d4f'}
              size="small"
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {roundedProgress}% complete
            </div>
          </div>
        );
      },
      sorter: true,
    },
    {
      title: t('schoolCounselor.students.enrolledAt', 'Enrolled At'),
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      width: 150,
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: true,
    },
    {
      title: t('schoolCounselor.students.actions', 'Actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewStudent(record.userId)}
          style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
        >
          View
        </Button>
      ),
    },
  ];

  // Get unique course names for filter
  const allCourses = useMemo(() => {
    const courseSet = new Set<string>();
    data.forEach((student) => {
      if (student.courseName) {
        courseSet.add(student.courseName);
      } else if (student.courseType) {
        // Fallback to courseType for backward compatibility
        courseSet.add(student.courseType);
      }
    });
    return Array.from(courseSet);
  }, [data]);

  if (!isSuperAdmin && !isCounselor) {
    return (
      <Alert
        message="Access Denied"
        description="You need to be a counselor or SuperAdmin to access this page."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="school-counselor-students">
      <div className="students-header">
        <div>
          <h1>{t('schoolCounselor.students.title', 'Students')}</h1>
          <p className="page-subtitle">{t('schoolCounselor.students.subtitle', 'Manage and track your students\' progress')}</p>
        </div>
        <Space>
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<ExportOutlined />}>{t('schoolCounselor.students.export', 'Export')}</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <Space size="large" wrap>
          <Search
            placeholder={t('schoolCounselor.students.searchPlaceholder', 'Search students by name or email')}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            placeholder={t('schoolCounselor.students.filterByStatus', 'Filter by Status')}
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">{t('schoolCounselor.students.allStatus', 'All Status')}</Option>
            <Option value="active">{t('schoolCounselor.students.active', 'Active')}</Option>
            <Option value="inactive">{t('schoolCounselor.students.inactive', 'Inactive')}</Option>
            <Option value="completed">{t('schoolCounselor.students.completed', 'Completed')}</Option>
            <Option value="pending">{t('schoolCounselor.students.pending', 'Pending')}</Option>
          </Select>
          <Select
            placeholder={t('schoolCounselor.students.filterByCourse', 'Filter by Course')}
            style={{ width: 200 }}
            value={courseFilter}
            onChange={setCourseFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">{t('schoolCounselor.students.allCourses', 'All Courses')}</Option>
            {allCourses.map((course) => {
              const displayName = course === 'admissions' 
                ? 'Admissions Program' 
                : course === 'sat' 
                ? 'SAT Prep Course' 
                : course.toUpperCase();
              return (
                <Option key={course} value={course}>
                  {displayName}
                </Option>
              );
            })}
          </Select>
          <div className="results-count">
            {t('schoolCounselor.students.showing', 'Showing {{current}} of {{total}} students', { current: filteredStudents.length, total: data.length })}
          </div>
        </Space>
      </Card>

      {/* Students Table */}
      <Card className="students-table-card">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="userId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => t('schoolCounselor.students.totalStudents', 'Total {{total}} students', { total }),
              position: ['bottomRight'],
            }}
            scroll={{ x: 1400 }}
            onChange={handleTableChange}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default StudentsPage;
