/* ── Counselor Console — Staff ────────────────────────────────────────────────
   The people who ADMINISTER an organization, as opposed to the students it
   sponsors. Three tabs, mirroring the Students page exactly so the two read as
   one surface:

     Staff       — owners and counselors with live access
     Invitations — counselor-role invites still outstanding
     Removed     — people whose access was revoked, kept for the record

   Staff and Removed are a pure CLIENT-SIDE partition of one response:
   `GET /org/:orgId/staff` already returns removed members (status `archived`),
   so splitting them costs no second request and the two tabs can never disagree
   about who is where.

   Owner-only. Counselors can manage students and invitations but not the people
   who can manage them — the gate below is the same one the backend enforces. */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Select, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Building2,
  Lock,
  MailPlus,
  MapPin,
  ShieldCheck,
  Trash2,
  UserCog,
  UserMinus,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcAvatar } from '../components/CcAvatar';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import {
  useGetStaffQuery,
  useRemoveStaffMutation,
  useSetStaffBranchesMutation,
  type OrgStaffMember,
} from 'src/app/services/orgAdminApi';
import {
  NoOrgPlaceholder,
  PeopleEmpty,
  PeoplePanel,
  PeopleTableShell,
  PeopleTabs,
  type PeopleTab,
} from '../_people/peopleChrome';
import { CcPageHead } from '../components/CcPageHead';
import { InvitationsTab } from '../_people/InvitationsTab';
import { MEMBER_STATUS_PILL, ROLE_LABEL, ROLE_PILL } from '../_people/roleLabels';
import './StaffPage.scss';

type TabKey = 'staff' | 'invitations' | 'removed';

const ID_BASE = 'cc-staff';

/** Display name for a staff row; the API returns null when a profile is missing. */
const staffName = (s: OrgStaffMember): string =>
  s.name?.trim() || s.email || 'Unnamed member';

export default function CounselorConsoleStaffPage() {
  const { orgId, org, role, branchId, branches } = useCounselorConsole();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const authProfile = useTypedSelector((state) => state.auth.profile);
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData || authProfile;
  const currentUserId = (currentUser as { id?: string } | undefined)?.id;

  const { data, isLoading, isFetching, isError, refetch } = useGetStaffQuery(
    { orgId: orgId as string, branchId },
    { skip: !orgId || role !== 'owner' },
  );
  const [removeStaff, { isLoading: removing }] = useRemoveStaffMutation();
  const [setStaffBranches, { isLoading: savingBranches }] =
    useSetStaffBranchesMutation();
  const [assigning, setAssigning] = useState<OrgStaffMember | null>(null);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active'),
    [branches],
  );
  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const items = useMemo(() => data?.items ?? [], [data]);

  /* One response, two tabs. `archived` is how the backend marks a member whose
     access was removed; everyone else is live. */
  const { live, removed } = useMemo(
    () => ({
      live: items.filter((s) => s.status !== 'archived'),
      removed: items.filter((s) => s.status === 'archived'),
    }),
    [items],
  );

  const TABS: PeopleTab<TabKey>[] = useMemo(
    () => [
      { key: 'staff', label: 'Staff', icon: <Users size={15} /> },
      { key: 'invitations', label: 'Invitations', icon: <MailPlus size={15} /> },
      {
        key: 'removed',
        label: 'Removed',
        icon: <UserMinus size={15} />,
        count: removed.length,
      },
    ],
    [removed.length],
  );

  const activeTab = useMemo<TabKey>(() => {
    const raw = searchParams.get('tab');
    return raw === 'invitations' || raw === 'removed' ? raw : 'staff';
  }, [searchParams]);

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'staff') next.delete('tab');
    else next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  const head = (
    <CcPageHead
      eyebrow="Administration"
      orgName={org?.name}
      title="Staff"
      lead="The counselors and owners with access to this organization. Invite new counselors, or remove access as your team changes."
    />
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-staff">
        {head}
        <NoOrgPlaceholder
          icon={<Building2 size={22} />}
          title="Select an organization"
          text="Choose an organization from the switcher to manage its staff."
        />
      </div>
    );
  }

  // ── Owner-only gate ──
  if (role !== 'owner') {
    return (
      <div className="cc-staff">
        {head}
        <NoOrgPlaceholder
          icon={<Lock size={22} />}
          title="Owners only"
          text={`Staff management is restricted to organization owners. Contact an owner of ${
            org?.name ?? 'this organization'
          } if you need access changed.`}
        />
      </div>
    );
  }

  const handleRemove = (s: OrgStaffMember) => {
    Modal.confirm({
      title: `Remove ${staffName(s)}?`,
      content: (
        <span>
          {staffName(s)} will lose access to <b>{org?.name ?? 'this organization'}</b>{' '}
          immediately. Their students and data stay with the organization. You
          can re-invite them later.
        </span>
      ),
      okText: 'Remove access',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await removeStaff({ orgId, userId: s.userId }).unwrap();
          message.success(`${staffName(s)} removed`);
          refetch();
        } catch {
          message.error('Could not remove this staff member. Please try again.');
        }
      },
    });
  };

  const openAssign = (s: OrgStaffMember) => {
    setAssigning(s);
    setAssignIds(s.branchIds ?? []);
  };

  const handleAssignSave = async () => {
    if (!assigning) return;
    try {
      await setStaffBranches({
        orgId,
        userId: assigning.userId,
        branchIds: assignIds,
      }).unwrap();
      message.success(`Branches updated for ${staffName(assigning)}`);
      setAssigning(null);
    } catch (err: any) {
      message.error(
        err?.data?.message || 'Could not update branches. Please try again.',
      );
    }
  };

  /** Shared columns; the Removed tab drops the action column. */
  const baseColumns: ColumnsType<OrgStaffMember> = [
    {
      title: 'Member',
      key: 'name',
      render: (_, s) => (
        <div className="cc-staff-member">
          <CcAvatar name={staffName(s)} src={s.avatarUrl} className="cc-staff-avatar" />
          <div className="cc-staff-member-meta">
            <div className="cc-staff-member-name">{staffName(s)}</div>
            {s.name?.trim() && s.email && (
              <div className="cc-staff-member-email">{s.email}</div>
            )}
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
    ...(branches.length >= 1
      ? [
          {
            title: 'Branches',
            key: 'branches',
            render: (_: unknown, s: OrgStaffMember) => {
              if (s.role === 'owner') {
                return <span className="cc-staff-muted">All branches</span>;
              }
              const names = (s.branchIds ?? [])
                .map((id) => branchNameById.get(id))
                .filter((n): n is string => !!n);
              return names.length ? (
                <div className="cc-staff-branches">
                  {names.map((n) => (
                    <CcPill key={n} variant="neutral">
                      {n}
                    </CcPill>
                  ))}
                </div>
              ) : (
                <span className="cc-staff-muted">None assigned</span>
              );
            },
          },
        ]
      : []),
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, s) => {
        const p = MEMBER_STATUS_PILL[s.status] ?? {
          tone: 'neutral' as CcPillVariant,
          label: s.status,
        };
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
          <span className="cc-staff-muted">-</span>
        ),
    },
  ];

  const liveColumns: ColumnsType<OrgStaffMember> = [
    ...baseColumns,
    {
      title: '',
      key: 'actions',
      width: branches.length >= 1 ? 250 : 130,
      align: 'right',
      render: (_, s) => {
        // An owner is never removable here, and nobody can remove themselves —
        // both would leave an organization without an administrator.
        const isSelf = !!currentUserId && s.userId === currentUserId;
        const isOwner = s.role === 'owner';
        const disabled = isSelf || isOwner;
        const title = isOwner
          ? 'Owners cannot be removed here'
          : isSelf
            ? 'You cannot remove yourself'
            : undefined;
        return (
          <div className="cc-staff-actions">
            {branches.length >= 1 && s.role === 'counselor' && (
              <Button
                size="small"
                className="cc-staff-assign"
                onClick={() => openAssign(s)}
              >
                <MapPin size={13} /> Assign branches
              </Button>
            )}
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
          </div>
        );
      },
    },
  ];

  return (
    <div className="cc-staff" aria-busy={isFetching || removing}>
      {head}

      <PeopleTabs
        tabs={TABS}
        active={activeTab}
        onChange={setTab}
        idBase={ID_BASE}
        ariaLabel="Staff sections"
      />

      {activeTab === 'staff' && (
        <PeoplePanel tabKey="staff" idBase={ID_BASE}>
          <PeopleTableShell
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            errorTitle="Couldn’t load staff"
            errorText="Something went wrong fetching your team."
            skeletonColumns={5}
            skeletonRows={6}
          >
            <Table<OrgStaffMember>
              columns={liveColumns}
              dataSource={live}
              rowKey="userId"
              loading={isFetching}
              pagination={false}
              locale={{
                emptyText: (
                  <PeopleEmpty
                    icon={<UserCog size={22} />}
                    title="No staff yet"
                    text="Invite your first counselor to build your team."
                    action={
                      <Button
                        className="cc-staff-primary"
                        type="primary"
                        onClick={() => setTab('invitations')}
                      >
                        <MailPlus size={15} /> Invite a counselor
                      </Button>
                    }
                  />
                ),
              }}
            />
          </PeopleTableShell>

          <div className="cc-staff-note">
            <ShieldCheck size={15} />
            <span>
              Owners have full administration access. Counselors can manage
              students and invitations but not settings or staff.
            </span>
          </div>
        </PeoplePanel>
      )}

      <Modal
        open={!!assigning}
        title={assigning ? `Assign branches · ${staffName(assigning)}` : 'Assign branches'}
        okText="Save"
        confirmLoading={savingBranches}
        onOk={handleAssignSave}
        onCancel={() => setAssigning(null)}
        destroyOnClose
      >
        <p style={{ marginTop: 0 }}>
          A counselor sees only the students of the branches assigned to them.
          With none assigned they see no students.
        </p>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select branches"
          value={assignIds}
          onChange={setAssignIds}
          options={activeBranches.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Modal>

      {activeTab === 'invitations' && (
        <PeoplePanel tabKey="invitations" idBase={ID_BASE}>
          <InvitationsTab orgId={orgId} orgName={org?.name} role="counselor" />
        </PeoplePanel>
      )}

      {activeTab === 'removed' && (
        <PeoplePanel tabKey="removed" idBase={ID_BASE}>
          <PeopleTableShell
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            errorTitle="Couldn’t load removed staff"
            errorText="Something went wrong fetching your team."
            skeletonColumns={4}
            skeletonRows={4}
          >
            <Table<OrgStaffMember>
              columns={baseColumns}
              dataSource={removed}
              rowKey="userId"
              loading={isFetching}
              pagination={false}
              locale={{
                emptyText: (
                  <PeopleEmpty
                    icon={<UserMinus size={22} />}
                    title="Nobody removed"
                    text="Staff whose access you revoke will be listed here."
                  />
                ),
              }}
            />
          </PeopleTableShell>

          <div className="cc-staff-note">
            <ShieldCheck size={15} />
            <span>
              Removed staff keep their TopCoach account and the work they did
              stays with the organization. To give someone access again, invite
              them from the Invitations tab.
            </span>
          </div>
        </PeoplePanel>
      )}
    </div>
  );
}
