import React from 'react';
import { Button, Space, Card, Alert } from 'antd';
import { BookOutlined, VideoCameraOutlined, UserOutlined, SettingOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import './AdminNav.scss';

const AdminNav: React.FC = () => {
  const navigate = useNavigate();
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  
  // Debug: Log the user data to see what we're getting
  console.log('AdminNav - User data:', user);
  console.log('AdminNav - User managementRole:', user?.managementRole);
  console.log('AdminNav - User type:', typeof user?.managementRole);
  console.log('AdminNav - Is authenticated:', isAuthenticated);
  
  // Check for SuperAdmin role using the proper enum values
  const isSuperAdmin = user?.managementRole === 'Owner' || user?.managementRole === 'SuperAdmin';

  const adminLinks = [
    {
      title: 'Course Modules',
      description: 'Manage course content, lessons, and resources',
      icon: <BookOutlined />,
      path: '/admin/courses/modules',
      color: '#1890ff'
    }
  ];

  // If user is not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="admin-nav">
        <div className="admin-nav-header">
          <h2>Admin Panel</h2>
          <p>Please log in to access the admin panel</p>
        </div>
        
        <Alert
          message="Authentication Required"
          description="You need to be logged in to access the admin panel. Please log in first."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ maxWidth: 600, margin: '0 auto' }}
        />
      </div>
    );
  }

  // If user is not SuperAdmin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="admin-nav">
        <div className="admin-nav-header">
          <h2>Admin Panel</h2>
          <p>Access restricted to SuperAdmin users only</p>
        </div>
        
        <Alert
          message="Access Denied"
          description={`You need SuperAdmin privileges to access the admin panel. Your current role is: ${user?.managementRole || 'Unknown'}. Please contact your system administrator.`}
          type="error"
          showIcon
          icon={<LockOutlined />}
          style={{ maxWidth: 600, margin: '0 auto' }}
        />
      </div>
    );
  }

  return (
    <div className="admin-nav">
      <div className="admin-nav-header">
        <h2>Admin Panel</h2>
        <p>Quick access to administrative functions</p>
      </div>
      
      <div className="admin-nav-grid">
        {adminLinks.map((link, index) => (
          <Card
            key={index}
            className="admin-nav-card"
            hoverable
            onClick={() => navigate(link.path)}
          >
            <div className="admin-nav-card-content">
              <div 
                className="admin-nav-icon"
                style={{ backgroundColor: link.color }}
              >
                {link.icon}
              </div>
              <div className="admin-nav-text">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminNav; 