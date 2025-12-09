import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert, Empty, Button, Tag } from 'antd';
import { TeamOutlined, PlusOutlined, ArrowRightOutlined, UserOutlined, CalendarOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import dayjs from 'dayjs';
import './index.scss';

interface OrganizationWithDetails {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
  memberCount?: number;
  counselors?: Array<{
    userName: string;
    userEmail: string;
  }>;
}

const OrganizationSelector: React.FC = () => {
  const navigate = useNavigate();
  const { organizations, loading, setSelectedOrganizationId } = useOrganization();
  const [fetching, setFetching] = useState(false);
  const [organizationsWithDetails, setOrganizationsWithDetails] = useState<OrganizationWithDetails[]>([]);

  // Fetch detailed organization info with members
  useEffect(() => {
    if (organizations.length > 0 && !loading) {
      setFetching(true);
      Promise.all(
        organizations.map((org) =>
          api.request({
            path: `/organizations/${org.id}?includeMembers=true`,
            method: 'GET',
            secure: true,
          })
            .then((response) => {
              const orgData = response.data;
              const counselors = orgData.members?.filter((m: any) => m.role === 'counselor') || [];
              return {
                ...org,
                ...orgData,
                counselors: counselors.map((c: any) => ({
                  userName: c.userName || 'Unknown',
                  userEmail: c.userEmail || '',
                })),
              };
            })
            .catch(() => org) // Fallback to basic org data if fetch fails
        )
      )
        .then((orgsWithDetails) => {
          setOrganizationsWithDetails(orgsWithDetails);
        })
        .finally(() => {
          setFetching(false);
        });
    } else if (organizations.length === 0) {
      setOrganizationsWithDetails([]);
    }
  }, [organizations, loading]);

  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    // Navigate to dashboard after selecting organization
    navigate('/school-counselor');
  };

  if (loading || fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading organizations...</div>
      </div>
    );
  }

  if (organizations.length === 0 && !loading) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: 600 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p style={{ fontSize: '18px', marginBottom: 8 }}>No Organizations Found</p>
                <p style={{ color: '#666', marginBottom: 24 }}>
                  You need to create an organization first before you can view School Counselor dashboards.
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/topcoach-management?tab=organizations')}
                  size="large"
                >
                  Create Organization
                </Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="organization-selector">
      <div className="selector-header">
        <h1>Select Organization</h1>
        <p className="page-subtitle">Choose an organization to view its School Counselor dashboard</p>
      </div>

      <Row gutter={[24, 24]}>
        {organizationsWithDetails.map((org) => (
          <Col xs={24} sm={12} lg={8} key={org.id}>
            <Card
              hoverable
              className="org-card"
              onClick={() => handleSelectOrganization(org.id)}
              actions={[
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOrganization(org.id);
                  }}
                  className="view-dashboard-btn"
                >
                  View Dashboard
                </Button>
              ]}
            >
              <div className="org-card-content">
                <div className="org-icon">
                  <TeamOutlined style={{ fontSize: 48, color: '#8b0000' }} />
                </div>
                <h3>{org.name}</h3>
                {org.description && (
                  <p className="org-description">{org.description}</p>
                )}
                
                <div className="org-meta">
                  {org.createdAt && (
                    <div className="org-meta-item">
                      <CalendarOutlined className="org-meta-icon" />
                      <span>Created {dayjs(org.createdAt).format('MMM D, YYYY')}</span>
                    </div>
                  )}
                  
                  {org.memberCount !== undefined && (
                    <div className="org-meta-item">
                      <TeamOutlined className="org-meta-icon" />
                      <span>{org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                  )}
                  
                  {org.counselors && org.counselors.length > 0 && (
                    <div className="org-meta-item org-counselors">
                      <UserOutlined className="org-meta-icon" />
                      <div className="counselors-list">
                        <span className="counselors-label">
                          Counselor{org.counselors.length > 1 ? 's' : ''}:
                        </span>
                        <div className="counselors-tags">
                          {org.counselors.map((counselor, idx) => (
                            <Tag key={idx} color="blue">
                              {counselor.userName}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {org.contactEmail && (
                    <div className="org-meta-item">
                      <MailOutlined className="org-meta-icon" />
                      <span>{org.contactEmail}</span>
                    </div>
                  )}
                  
                  {org.contactPhone && (
                    <div className="org-meta-item">
                      <PhoneOutlined className="org-meta-icon" />
                      <span>{org.contactPhone}</span>
                    </div>
                  )}
                  
                  {(org.address || org.city || org.state || org.country) && (
                    <div className="org-meta-item">
                      <EnvironmentOutlined className="org-meta-icon" />
                      <span>{[org.address, org.city, org.state, org.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default OrganizationSelector;

