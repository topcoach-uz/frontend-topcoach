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
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Building2,
  Lock,
  MailPlus,
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
  type OrgStaffMember,
} from 'src/app/services/orgAdminApi';
import {
  NoOrgPlaceholder,
  PeopleEmpty,
  PeoplePageHead,
  PeoplePanel,
  PeopleTableShell,
  PeopleTabs,
  type PeopleTab,
} from '../_people/peopleChrome';
import { InvitationsTab } from '../_people/InvitationsTab';
import { MEMBER_STATUS_PILL, ROLE_LABEL, ROLE_PILL } from '../_people/roleLabels';
import './StaffPage.scss';

type TabKey = 'staff' | 'invitations' | 'removed';

const ID_BASE = 'cc-staff';

export default function CounselorConsoleStaffPage() {
  const { orgId, org, role } = useCounselorConsole();
  const [searchParams, setSearchParams] = useSearchParams();

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
    <PeoplePageHead
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
          icon={<Building2 size={22} color="#7b1f2f" />}
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
          icon={<Lock size={22} color="#7b1f2f" />}
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
      title: `Remove ${s.name}?`,
      content: (
        <span>
          {s.name} will lose access to <b>{org?.name ?? 'this organization'}</b>{' '}
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
          message.success(`${s.name} removed`);
          refetch();
        } catch {
          message.error('Could not remove this staff member. Please try again.');
        }
      },
    });
  };

  /** Shared columns; the Removed tab drops the action column. */
  const baseColumns: ColumnsType<OrgStaffMember> = [
    {
      title: 'Member',
      key: 'name',
      render: (_, s) => (
        <div className="cc-staff-member">
          <CcAvatar name={s.name} src={s.avatarUrl} className="cc-staff-avatar" />
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
          <span className="cc-staff-muted">—</span>
        ),
    },
  ];

  const liveColumns: ColumnsType<OrgStaffMember> = [
    ...baseColumns,
    {
      title: '',
      key: 'actions',
      width: 130,
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
                    icon={<UserCog size={22} color="#9a8f7d" />}
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
                    icon={<UserMinus size={22} color="#9a8f7d" />}
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
