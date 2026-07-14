import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Select, Table, Tabs, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AtSign,
  Building2,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
} from 'lucide-react';
import dayjs from 'dayjs';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcAvatar } from '../components/CcAvatar';
import TableSkeleton from 'src/components/loading/TableSkeleton';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import {
  useGetStaffQuery,
  useRemoveStaffMutation,
  type OrgStaffMember,
  type OrgStaffStatus,
} from 'src/app/services/orgAdminApi';
import {
  useAddOrgMemberMutation,
  useCreateInvitationMutation,
  useSearchOrgUsersQuery,
  type OrgMembershipRole,
} from 'src/app/services/counselorConsoleApi';
import './StaffPage.scss';

type AddMode = 'email' | 'existing';

const ROLE_LABEL: Record<OrgMembershipRole, string> = {
  owner: 'Owner',
  counselor: 'Counselor',
  student: 'Student',
};

const ROLE_PILL: Record<OrgMembershipRole, CcPillVariant> = {
  owner: 'accent',
  counselor: 'info',
  student: 'neutral',
};

const STATUS_PILL: Record<OrgStaffStatus, { tone: CcPillVariant; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  invited: { tone: 'info', label: 'Invited' },
  archived: { tone: 'neutral', label: 'Archived' },
};

export default function CounselorConsoleStaffPage() {
  const { orgId, org, role } = useCounselorConsole();

  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const authProfile = useTypedSelector((state) => state.auth.profile);
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData || authProfile;
  const currentUserId = (currentUser as { id?: string } | undefined)?.id;

  const { data, isLoading, isFetching, isError, refetch } = useGetStaffQuery(
    orgId as string,
    { skip: !orgId || role !== 'owner' },
  );
  const [removeStaff, { isLoading: removing }] = useRemoveStaffMutation();

  // ── Add-counselor modal ──
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('email');
  const [emailForm] = Form.useForm<{ email: string }>();

  // Existing-user search (debounced, min 2 chars)
  const [userQuery, setUserQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(userQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  const { data: userResults, isFetching: searching } = useSearchOrgUsersQuery(
    { orgId: orgId as string, q: debouncedQuery },
    { skip: !orgId || !addOpen || debouncedQuery.length < 2 },
  );

  const userOptions = useMemo(
    () =>
      (userResults ?? []).map((u) => ({
        value: u.id,
        label: u.name,
        email: u.email,
      })),
    [userResults],
  );

  const [createInvitation, { isLoading: inviting }] = useCreateInvitationMutation();
  const [addOrgMember, { isLoading: adding }] = useAddOrgMemberMutation();

  const openAdd = () => {
    setAddMode('email');
    emailForm.resetFields();
    setUserQuery('');
    setDebouncedQuery('');
    setSelectedUserId(undefined);
    setAddOpen(true);
  };

  const submitEmail = async () => {
    if (!orgId) return;
    let values: { email: string };
    try {
      values = await emailForm.validateFields();
    } catch {
      return; // inline validation errors
    }
    try {
      await createInvitation({
        orgId,
        email: values.email.trim(),
        role: 'counselor',
      }).unwrap();
      message.success(`Counselor invitation sent to ${values.email.trim()}`);
      setAddOpen(false);
      refetch();
    } catch (err: any) {
      const reason =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        'Could not send the invitation. Please try again.';
      message.error(String(reason));
    }
  };

  const submitExisting = async () => {
    if (!orgId || !selectedUserId) return;
    const picked = userOptions.find((u) => u.value === selectedUserId);
    try {
      await addOrgMember({
        orgId,
        userId: selectedUserId,
        role: 'counselor',
      }).unwrap();
      message.success(
        `${picked?.label ?? 'User'} added as a counselor`,
      );
      setAddOpen(false);
      refetch();
    } catch (err: any) {
      const reason =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        'Could not add this user. Please try again.';
      message.error(String(reason));
    }
  };

  const submitAdd = () => (addMode === 'email' ? submitEmail() : submitExisting());

  const items = data?.items ?? [];

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-staff-head">
        <div>
          <div className="cc-page-eyebrow">
            <span className="cc-page-eyebrow-accent">Administration</span>
            {org ? <span>· {org.name}</span> : null}
          </div>
          <h1 className="cc-page-title">Staff</h1>
          <p className="cc-page-lead">
            The counselors and owners with access to this organization. Invite new
            counselors or remove access as your team changes.
          </p>
        </div>
        {orgId && role === 'owner' ? (
          <div className="cc-staff-head-actions">
            <Button
              className="cc-staff-primary"
              type="primary"
              onClick={openAdd}
            >
              <UserPlus size={15} /> Add counselor
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-staff">
        {header}
        <div className="cc-placeholder">
          <Building2 size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Select an organization</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to manage its staff.
          </div>
        </div>
      </div>
    );
  }

  // ── Owner-only gate ──
  if (role !== 'owner') {
    return (
      <div className="cc-staff">
        {header}
        <div className="cc-placeholder">
          <Lock size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Owners only</div>
          <div className="cc-placeholder-text">
            Staff management is restricted to organization owners. Contact an owner
            of {org?.name ?? 'this organization'} if you need access changed.
          </div>
        </div>
      </div>
    );
  }

  const handleRemove = (s: OrgStaffMember) => {
    if (!orgId) return;
    Modal.confirm({
      title: `Remove ${s.name}?`,
      content: (
        <span>
          {s.name} will lose access to <b>{org?.name ?? 'this organization'}</b>{' '}
          immediately. Their students and data stay with the organization. You can
          re-invite them later.
        </span>
      ),
      okText: 'Remove access',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await removeStaff({ orgId, userId: s.userId }).unwrap();
          message.success(`${s.name} removed`);
          refetch();
        } catch {
          message.error('Could not remove this staff member. Please try again.');
        }
      },
    });
  };

  const columns: ColumnsType<OrgStaffMember> = [
    {
      title: 'Member',
      key: 'name',
      render: (_, s) => (
        <div className="cc-staff-member">
          <CcAvatar
            name={s.name}
            src={s.avatarUrl}
            className="cc-staff-avatar"
          />
          <div className="cc-staff-member-meta">
            <div className="cc-staff-member-name">{s.name}</div>
            <div className="cc-staff-member-email">{s.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 140,
      render: (_, s) => (
        <CcPill variant={ROLE_PILL[s.role] ?? 'neutral'}>
          {ROLE_LABEL[s.role] ?? s.role}
        </CcPill>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, s) => {
        const p = STATUS_PILL[s.status] ?? { tone: 'neutral' as CcPillVariant, label: s.status };
        return <CcPill variant={p.tone}>{p.label}</CcPill>;
      },
    },
    {
      title: 'Joined',
      key: 'joinedAt',
      width: 150,
      render: (_, s) =>
        s.joinedAt ? (
          <span className="cc-staff-date" title={dayjs(s.joinedAt).format('lll')}>
            {dayjs(s.joinedAt).format('MMM D, YYYY')}
          </span>
        ) : (
          <span className="cc-staff-muted">—</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, s) => {
        const isSelf = !!currentUserId && s.userId === currentUserId;
        const isOwner = s.role === 'owner';
        const disabled = isSelf || isOwner;
        const title = isOwner
          ? 'Owners cannot be removed here'
          : isSelf
            ? 'You cannot remove yourself'
            : undefined;
        return (
          <Button
            className="cc-staff-remove"
            size="small"
            danger
            disabled={disabled}
            title={title}
            onClick={() => handleRemove(s)}
          >
            <Trash2 size={13} /> Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div className="cc-staff" aria-busy={isFetching || removing}>
      {header}

      {isLoading ? (
        <div className="cc-staff-skeleton">
          <TableSkeleton columns={5} rows={6} />
        </div>
      ) : isError ? (
        <div className="cc-staff-table">
          <div className="cc-staff-empty">
            <div className="cc-staff-empty-title">Couldn’t load staff</div>
            <div>Something went wrong fetching your team.</div>
            <Button className="cc-staff-remove" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="cc-staff-table">
          <Table<OrgStaffMember>
            columns={columns}
            dataSource={items}
            rowKey="userId"
            loading={isFetching}
            pagination={false}
            locale={{
              emptyText: (
                <div className="cc-staff-empty">
                  <UserCog size={22} color="#9a8f7d" />
                  <div className="cc-staff-empty-title">No staff yet</div>
                  <div>Invite your first counselor to build your team.</div>
                  <Button
                    className="cc-staff-primary"
                    type="primary"
                    onClick={openAdd}
                  >
                    <UserPlus size={15} /> Add counselor
                  </Button>
                </div>
              ),
            }}
          />
        </div>
      )}

      <div className="cc-staff-note">
        <ShieldCheck size={15} />
        <span>
          Owners have full administration access. Counselors can manage students
          and invitations but not settings or staff.
        </span>
      </div>

      {/* ── Add-counselor modal ── */}
      <Modal
        title="Add a counselor"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={submitAdd}
        okText={addMode === 'email' ? 'Send invitation' : 'Add counselor'}
        okButtonProps={{
          className: 'cc-staff-primary',
          disabled: addMode === 'existing' && !selectedUserId,
        }}
        confirmLoading={inviting || adding}
        className="cc-staff-add-modal"
        destroyOnClose
      >
        <Tabs
          activeKey={addMode}
          onChange={(k) => setAddMode(k as AddMode)}
          className="cc-staff-add-tabs"
          items={[
            {
              key: 'email',
              label: (
                <span className="cc-staff-tab-label">
                  <AtSign size={14} /> Invite by email
                </span>
              ),
              children: (
                <div className="cc-staff-add-pane">
                  <p className="cc-staff-add-help">
                    Email a counselor who does not yet have a TopCoach account.
                    They will get an invitation to join{' '}
                    <b>{org?.name ?? 'this organization'}</b>.
                  </p>
                  <Form form={emailForm} layout="vertical" requiredMark={false}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'An email is required' },
                        { type: 'email', message: 'Enter a valid email' },
                      ]}
                    >
                      <Input
                        placeholder="counselor@example.com"
                        autoComplete="off"
                        onPressEnter={submitEmail}
                      />
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'existing',
              label: (
                <span className="cc-staff-tab-label">
                  <UserPlus size={14} /> Add existing user
                </span>
              ),
              children: (
                <div className="cc-staff-add-pane">
                  <p className="cc-staff-add-help">
                    Search for someone who <b>already has</b> a TopCoach account
                    and add them straight away — no email needed.
                  </p>
                  <Select
                    className="cc-staff-user-select"
                    showSearch
                    labelInValue={false}
                    value={selectedUserId}
                    placeholder="Search by name or email…"
                    filterOption={false}
                    onSearch={setUserQuery}
                    onChange={(v) => setSelectedUserId(v)}
                    notFoundContent={
                      searching
                        ? 'Searching…'
                        : debouncedQuery.length < 2
                          ? 'Type at least 2 characters'
                          : 'No matching users'
                    }
                    loading={searching}
                    options={userOptions}
                    optionRender={(opt) => (
                      <div className="cc-staff-user-opt">
                        <span className="cc-staff-user-opt-name">
                          {opt.data.label}
                        </span>
                        <span className="cc-staff-user-opt-email">
                          {(opt.data as { email?: string }).email}
                        </span>
                      </div>
                    )}
                    suffixIcon={<Search size={15} />}
                    style={{ width: '100%' }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
