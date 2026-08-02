import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { AcPill } from 'src/pages/admin/console/components/AcPill';

export type ProgramManagementOrganizationsTabProps = {
  organizations: any[];
  organizationsLoading: boolean;
  /** Refetch org list; pass true to bypass caches on parent. */
  fetchOrganizations: (bypassCache?: boolean) => void | Promise<void>;
  fetchAvailableUsers: (search?: string) => void | Promise<void>;
  availableUsers: any[];
};

export default function ProgramManagementOrganizationsTab({
  organizations,
  organizationsLoading,
  fetchOrganizations,
  fetchAvailableUsers,
  availableUsers,
}: ProgramManagementOrganizationsTabProps) {
  const [createOrgModalVisible, setCreateOrgModalVisible] = useState(false);
  const [editOrgModalVisible, setEditOrgModalVisible] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [assignUserModalVisible, setAssignUserModalVisible] = useState(false);
  const [viewMembers, setViewMembers] = useState<{
    orgId: string;
    orgName: string;
    members: any[];
  } | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const navigate = useNavigate();

  // Drop blank optional fields so backend email/url validators don't reject
  // empty strings (@IsOptional only skips null/undefined, not '').
  const stripEmpty = (values: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    );

  // Turn a backend error (string | string[] | class-validator errors) into a
  // readable string — never pass raw objects to message.error (it crashes React).
  const apiErrorMessage = (error: any, fallback: string): string => {
    const m = error?.response?.data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) {
      const parts = m
        .map((item: any) =>
          typeof item === 'string'
            ? item
            : Object.values(item?.constraints || {}).join(', '),
        )
        .filter(Boolean);
      if (parts.length) return parts.join('; ');
    }
    return fallback;
  };

  const handleCreateOrganization = async (values: any) => {
    try {
      await api.request({
        path: '/admin/orgs',
        method: 'POST',
        secure: true,
        body: stripEmpty(values),
      });
      message.success('Organization created successfully');
      setCreateOrgModalVisible(false);
      createForm.resetFields();
      await fetchOrganizations(true);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      message.error(apiErrorMessage(error, 'Failed to create organization'));
    }
  };

  const openEditOrganization = (record: any) => {
    setEditingOrgId(record.id);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      contactEmail: record.contactEmail,
      contactPhone: record.contactPhone,
      address: record.address,
      city: record.city,
      state: record.state,
      country: record.country,
      postalCode: record.postalCode,
      website: record.website,
    });
    setEditOrgModalVisible(true);
  };

  const handleEditOrganization = async (values: any) => {
    if (!editingOrgId) return;
    try {
      await api.request({
        // Updates go through the console's org endpoint, not /admin/orgs.
        path: `/org/${editingOrgId}`,
        method: 'PATCH',
        secure: true,
        body: stripEmpty(values),
      });
      message.success('Organization updated successfully');
      setEditOrgModalVisible(false);
      editForm.resetFields();
      setEditingOrgId(null);
      await fetchOrganizations(true);
    } catch (error: any) {
      console.error('Error updating organization:', error);
      message.error(apiErrorMessage(error, 'Failed to update organization'));
    }
  };

  const handleAssignUser = async (values: any) => {
    if (!selectedOrg) return;
    try {
      await api.request({
        path: `/admin/orgs/${selectedOrg}/members`,
        method: 'POST',
        secure: true,
        body: {
          userId: values.userId,
          role: values.role,
        },
      });
      message.success('User assigned successfully');
      setAssignUserModalVisible(false);
      assignForm.resetFields();
      setSelectedOrg(null);
      await fetchOrganizations(true);
      await fetchAvailableUsers();
    } catch (error: any) {
      console.error('Error assigning user:', error);
      message.error(apiErrorMessage(error, 'Failed to assign user'));
    }
  };

  const handleRemoveUser = async (orgId: string, userId: string) => {
    try {
      await api.request({
        path: `/admin/orgs/${orgId}/members/${userId}`,
        method: 'DELETE',
        secure: true,
      });
      message.success('User removed from organization');
      await fetchOrganizations(true);
    } catch (error: any) {
      console.error('Error removing user:', error);
      message.error('Failed to remove user');
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    try {
      await api.request({
        path: `/admin/orgs/${orgId}`,
        method: 'DELETE',
        secure: true,
      });
      message.success(`Organization "${orgName}" deleted successfully`);
      await fetchOrganizations(true);
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      message.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  if (organizationsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 50,
          gap: 16,
          textAlign: 'center',
        }}
      >
        <Spin size="large" />
        <div>Loading school organizations…</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 0, marginBottom: 0 }}>
      <Card style={{ marginBottom: 0 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>School organizations</h2>
          <Button
            type="primary"
            onClick={() => {
              void fetchAvailableUsers();
              setCreateOrgModalVisible(true);
            }}
          >
            Create school organization
          </Button>
        </Space>

        <Table
          dataSource={organizations}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Contact Email',
              dataIndex: 'contactEmail',
              key: 'contactEmail',
            },
            {
              title: 'Contact Phone',
              dataIndex: 'contactPhone',
              key: 'contactPhone',
            },
            {
              title: 'Location',
              key: 'location',
              render: (_, record) => {
                const parts = [];
                if (record.address) {
                  parts.push(record.address);
                }
                if (record.city) {
                  parts.push(record.city);
                }
                if (record.state) {
                  parts.push(record.state);
                }
                if (record.country) {
                  parts.push(record.country);
                }
                return parts.length > 0 ? parts.join(', ') : 'N/A';
              },
            },
            {
              title: 'Members',
              dataIndex: 'memberCount',
              key: 'memberCount',
              render: (count) => count || 0,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => openEditOrganization(record)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedOrg(record.id);
                      void fetchAvailableUsers();
                      setAssignUserModalVisible(true);
                    }}
                  >
                    Assign User
                  </Button>
                  <Button
                    size="small"
                    onClick={async () => {
                      try {
                        // Returns the combined owner/counselor/student list
                        // directly — it is no longer nested under `.members`.
                        const response = await api.request({
                          path: `/admin/orgs/${record.id}/members`,
                          method: 'GET',
                          secure: true,
                        });
                        setViewMembers({
                          orgId: record.id,
                          orgName: record.name,
                          members: Array.isArray(response.data) ? response.data : [],
                        });
                      } catch (error: any) {
                        console.error('Error loading members:', error);
                        message.error(apiErrorMessage(error, 'Failed to load members'));
                      }
                    }}
                  >
                    View Members
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/counselor-console?org=${record.id}`)}
                  >
                    Open console
                  </Button>
                  <Popconfirm
                    title="Delete Organization"
                    description={`Are you sure you want to delete "${record.name}"? This will remove all counselors and students from this organization, and unlink all course enrollments. This action cannot be undone.`}
                    onConfirm={() => handleDeleteOrganization(record.id, record.name)}
                    okText="Yes, Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                  >
                    <Button size="small" danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>

      <Modal
        rootClassName="ac-dark-modal"
        classNames={{ mask: 'ac-dark-modal-mask' }}
        title={viewMembers ? `Members of ${viewMembers.orgName}` : 'Members'}
        open={!!viewMembers}
        width={800}
        footer={null}
        onCancel={() => setViewMembers(null)}
      >
        <Table
          dataSource={viewMembers?.members || []}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'userName', key: 'userName' },
            { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' },
            {
              title: 'Role',
              dataIndex: 'role',
              key: 'role',
              render: (role: string) => (
                <AcPill
                  variant={
                    role === 'owner' ? 'purple' : role === 'counselor' ? 'blue' : 'mint'
                  }
                >
                  {role}
                </AcPill>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_: any, member: any) => (
                <Popconfirm
                  title="Remove user from organization?"
                  onConfirm={() => {
                    handleRemoveUser(viewMembers!.orgId, member.userId);
                    setViewMembers(null);
                  }}
                >
                  <Button size="small" danger>
                    Remove
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        rootClassName="ac-dark-modal"
        classNames={{ mask: 'ac-dark-modal-mask' }}
        title="Create Organization"
        open={createOrgModalVisible}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateOrgModalVisible(false);
          createForm.resetFields();
        }}
      >
        <Form form={createForm} onFinish={handleCreateOrganization} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="ownerUserId"
            label="Owner"
            rules={[{ required: true, message: 'Please select an owner' }]}
            extra={
              <span style={{ color: 'rgba(255, 255, 255, 0.55)', display: 'block', marginTop: 8 }}>
                The owner is the school's admin — they manage counselors, settings, and billing.
              </span>
            }
          >
            <Select
              showSearch
              placeholder="Search by name or email"
              popupClassName="ac-dark-modal-select-dropdown"
              optionFilterProp="children"
              onSearch={(value) => void fetchAvailableUsers(value)}
              filterOption={false}
              notFoundContent={<span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Type a name or email to search</span>}
            >
              {availableUsers.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="contactPhone" label="Contact Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="postalCode" label="Postal Code">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input type="url" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        rootClassName="ac-dark-modal"
        classNames={{ mask: 'ac-dark-modal-mask' }}
        title="Edit Organization"
        open={editOrgModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditOrgModalVisible(false);
          editForm.resetFields();
          setEditingOrgId(null);
        }}
      >
        <Form form={editForm} onFinish={handleEditOrganization} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="contactPhone" label="Contact Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="postalCode" label="Postal Code">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input type="url" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        rootClassName="ac-dark-modal"
        classNames={{ mask: 'ac-dark-modal-mask' }}
        title="Assign User to Organization"
        open={assignUserModalVisible}
        onOk={() => assignForm.submit()}
        onCancel={() => {
          setAssignUserModalVisible(false);
          assignForm.resetFields();
          setSelectedOrg(null);
        }}
      >
        <Form form={assignForm} onFinish={handleAssignUser} layout="vertical">
          <Form.Item name="userId" label="User" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Search by name or email"
              popupClassName="ac-dark-modal-select-dropdown"
              optionFilterProp="children"
              onSearch={(value) => void fetchAvailableUsers(value)}
              filterOption={false}
              notFoundContent={<span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Type a name or email to search</span>}
            >
              {availableUsers.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="owner">Owner</Radio>
              <Radio value="counselor">Counselor</Radio>
              <Radio value="student">Student</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
