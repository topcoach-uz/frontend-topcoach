/* ── Counselor Console — the Invitations tab ──────────────────────────────────
   One component, mounted twice: as the Students page's "Invitations" tab
   (role=student) and as the Staff page's (role=counselor). The old standalone
   Invitations page mixed both audiences in one list behind a role dropdown,
   which is what made "who am I looking at?" unanswerable. The role is now fixed
   by the page you are on and is never a control.

   DELIVERY IS SURFACED, NOT ASSUMED. An invitation row used to look identical
   whether the email was delivered, queued, or hard-bounced — all three read
   "Pending", which is how invitations silently went nowhere for weeks. The row
   now states delivery in words (never colour alone) and the tab banners the
   failure count above the table, because a counselor is far more likely to scan
   the top of a page than the fifth column of row nine. */
import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Select, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AlertTriangle,
  MailPlus,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Upload as UploadIcon,
  UserPlus,
  XCircle,
} from 'lucide-react';
import dayjs from 'dayjs';

import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcMenu, type CcMenuItem } from '../components/CcMenu';
import {
  useGetInvitationsQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useDeleteInvitationMutation,
  useAddOrgMemberMutation,
  type OrgInvitation,
  type OrgInvitationStatus,
  type OrgMembershipRole,
} from 'src/app/services/counselorConsoleApi';
import { apiErrorMessage, PeopleEmpty, PeopleTableShell } from './peopleChrome';
import { INVITATION_STATUS_PILL } from './roleLabels';
import { InviteByEmailModal } from './InviteByEmailModal';
import { CsvImportModal } from './CsvImportModal';
import { UserSearchSelect } from './UserSearchSelect';
import { useCounselorConsole } from '../CounselorConsoleContext';
import { activeBranches, defaultInviteBranchId } from './branchHelpers';

const PAGE_SIZE = 20;

/**
 * `actionable` sends NO status param, which the API answers with the invites
 * that still need a decision (pending + not-yet-expired). It is the default
 * because a counselor opening this tab is asking "what is outstanding?", not
 * "what has ever been sent?". Accepted and revoked are reachable by name.
 */
type StatusFilter = 'actionable' | OrgInvitationStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'actionable', label: 'Needs action' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'revoked', label: 'Revoked' },
];

export function InvitationsTab({
  orgId,
  orgName,
  role,
}: {
  orgId: string;
  orgName?: string | null;
  /** Which audience this tab lists. Fixed by the host page. */
  role: OrgMembershipRole;
}) {
  const isStudent = role === 'student';
  const noun = isStudent ? 'student' : 'counselor';

  const [status, setStatus] = useState<StatusFilter>('actionable');
  const [page, setPage] = useState(1);
  const { branches, branchId, hasBranches } = useCounselorConsole();
  const [addBranchId, setAddBranchId] = useState<string | undefined>();
  useEffect(() => setPage(1), [branchId]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [selectedUserName, setSelectedUserName] = useState<string | undefined>();

  /* Invitation emails are delivered in the background after the invite is
     created (the send can retry a throttled relay for over a minute). While
     any row on this page is still awaiting its delivery outcome, poll so
     "Sending" resolves to Sent / Not delivered without a manual refresh. */
  const [pollingInterval, setPollingInterval] = useState(0);
  const { data, isLoading, isFetching, isError, refetch } =
    useGetInvitationsQuery(
      {
        orgId,
        branchId,
        role,
        status: status === 'actionable' ? undefined : status,
        page,
        limit: PAGE_SIZE,
      },
      { skip: !orgId, pollingInterval },
    );

  const [resendInvitation] = useResendInvitationMutation();
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();
  const [addOrgMember, { isLoading: adding }] = useAddOrgMemberMutation();

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const hasInFlightSend = useMemo(
    () =>
      items.some(
        (i) => i.status === 'pending' && !i.emailSentAt && !i.lastEmailError,
      ),
    [items],
  );
  useEffect(() => {
    setPollingInterval(hasInFlightSend ? 5000 : 0);
  }, [hasInFlightSend]);

  /** How many rows on this page never reached their invitee. */
  const undeliverable = useMemo(
    () => items.filter((i) => !!i.lastEmailError).length,
    [items],
  );

  /* ── Add an existing user ─────────────────────────────────────────────── */
  const openAddExisting = () => {
    setSelectedUserId(undefined);
    setSelectedUserName(undefined);
    setAddBranchId(defaultInviteBranchId(branches, branchId));
    setAddOpen(true);
  };

  const submitAddExisting = async () => {
    if (!selectedUserId) return;
    try {
      await addOrgMember({
        orgId,
        userId: selectedUserId,
        role: isStudent ? 'student' : 'counselor',
        branchId: hasBranches ? addBranchId : undefined,
      }).unwrap();
      message.success(
        `${selectedUserName ?? 'User'} added to ${orgName ?? 'your organization'}`,
      );
      setAddOpen(false);
    } catch (err) {
      message.error(
        apiErrorMessage(err, 'Could not add this user. Please try again.'),
      );
    }
  };

  /* ── Row actions ──────────────────────────────────────────────────────── */
  const handleResend = async (inv: OrgInvitation) => {
    try {
      await resendInvitation({ orgId, id: inv.id }).unwrap();
      message.success(`Invitation re-sent to ${inv.email}`);
    } catch (err) {
      message.error(apiErrorMessage(err, 'Could not resend the invitation.'));
    }
  };

  const confirmRevoke = (inv: OrgInvitation) => {
    Modal.confirm({
      title: 'Revoke invitation?',
      content: (
        <span>
          This cancels the invite to <b>{inv.email}</b>. They will no longer be
          able to join with the existing link. The record stays in this list
          under “Revoked”.
        </span>
      ),
      okText: 'Revoke',
      okButtonProps: { danger: true },
      cancelText: 'Keep',
      async onOk() {
        try {
          await revokeInvitation({ orgId, id: inv.id }).unwrap();
          message.success(`Invitation to ${inv.email} revoked`);
        } catch (err) {
          message.error(
            apiErrorMessage(err, 'Could not revoke the invitation.'),
          );
        }
      },
    });
  };

  const confirmDelete = (inv: OrgInvitation) => {
    Modal.confirm({
      title: 'Delete this invitation?',
      content: (
        <span>
          The invitation to <b>{inv.email}</b> will be removed from this list
          for good and this cannot be undone. Any link already sent stops
          working. You can invite them again later.
        </span>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await deleteInvitation({ orgId, id: inv.id }).unwrap();
          message.success(`Invitation to ${inv.email} deleted`);
        } catch (err) {
          message.error(
            apiErrorMessage(err, 'Could not delete the invitation.'),
          );
        }
      },
    });
  };

  const rowActions = (inv: OrgInvitation): CcMenuItem[] => {
    const live = inv.status === 'pending' || inv.status === 'expired';
    return [
      {
        key: 'resend',
        label: 'Resend invitation',
        icon: <RotateCcw size={15} />,
        disabled: !live,
        onClick: () => handleResend(inv),
      },
      {
        key: 'revoke',
        label: 'Revoke',
        icon: <XCircle size={15} />,
        danger: true,
        disabled: !live,
        onClick: () => confirmRevoke(inv),
      },
      { type: 'divider' },
      {
        key: 'delete',
        label: 'Delete from list',
        icon: <Trash2 size={15} />,
        danger: true,
        onClick: () => confirmDelete(inv),
      },
    ];
  };

  /* ── Columns ──────────────────────────────────────────────────────────── */
  const columns: ColumnsType<OrgInvitation> = [
    {
      title: 'Invitee',
      key: 'email',
      render: (_, inv) => (
        <div className="cc-invite-who">
          <div className="cc-invite-email">{inv.email}</div>
          {inv.inviteeName ? (
            <div className="cc-invite-name">{inv.inviteeName}</div>
          ) : null}
        </div>
      ),
    },
    ...(hasBranches && branchId === 'all'
      ? [
          {
            title: 'Branch',
            key: 'branch',
            width: 140,
            render: (_: unknown, inv: OrgInvitation) =>
              inv.branchName ?? <span className="cc-invite-muted">-</span>,
          },
        ]
      : []),
    {
      title: 'Status',
      key: 'status',
      width: 170,
      render: (_, inv) => {
        const p = INVITATION_STATUS_PILL[inv.status] ?? {
          tone: 'neutral' as CcPillVariant,
          label: inv.status,
        };
        return (
          <div className="cc-invite-status-cell">
            <CcPill variant={p.tone}>{p.label}</CcPill>
            {/* Delivery, stated. `lastEmailError` set means the invitee never
                got the email — the status pill alone would imply otherwise. */}
            {inv.lastEmailError ? (
              <span
                className="cc-invite-undelivered"
                title={`Email delivery failed: ${inv.lastEmailError}`}
              >
                <AlertTriangle size={11} /> Not delivered
              </span>
            ) : !inv.emailSentAt && inv.status === 'pending' ? (
              /* No outcome recorded yet: the background send (which can
                 retry a throttled relay for over a minute) is in flight. */
              <span className="cc-invite-muted">Sending…</span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Sent',
      key: 'emailSentAt',
      width: 140,
      render: (_, inv) =>
        inv.emailSentAt ? (
          <span
            className="cc-invite-date"
            title={dayjs(inv.emailSentAt).format('lll')}
          >
            {dayjs(inv.emailSentAt).format('MMM D, YYYY')}
          </span>
        ) : (
          <span className="cc-invite-muted">-</span>
        ),
    },
    {
      title: 'Invited',
      key: 'createdAt',
      width: 140,
      render: (_, inv) =>
        inv.createdAt ? (
          <span
            className="cc-invite-date"
            title={dayjs(inv.createdAt).format('lll')}
          >
            {dayjs(inv.createdAt).format('MMM D, YYYY')}
          </span>
        ) : (
          <span className="cc-invite-muted">-</span>
        ),
    },
    {
      title: 'Expires',
      key: 'expiresAt',
      width: 140,
      render: (_, inv) =>
        inv.expiresAt ? (
          <span
            className="cc-invite-date"
            title={dayjs(inv.expiresAt).format('lll')}
          >
            {dayjs(inv.expiresAt).format('MMM D, YYYY')}
          </span>
        ) : (
          <span className="cc-invite-muted">-</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, inv) => {
        const live = inv.status === 'pending' || inv.status === 'expired';
        return (
          <div className="cc-invite-row-actions">
            {live ? (
              <Button
                className="cc-invite-ghost"
                size="small"
                onClick={() => handleResend(inv)}
              >
                <RotateCcw size={13} /> Resend
              </Button>
            ) : null}
            <CcMenu
              items={rowActions(inv)}
              align="right"
              ariaLabel={`Actions for the invitation to ${inv.email}`}
              triggerClassName="cc-people-kebab"
            >
              <MoreHorizontal size={16} />
            </CcMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="cc-invite-toolbar cc-invite-toolbar--split">
        <Select<StatusFilter>
          className="cc-invite-status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          aria-label="Filter invitations by status"
        />
        <div className="cc-invite-toolbar-actions">
          <Button className="cc-invite-secondary" onClick={openAddExisting}>
            <UserPlus size={15} /> Add existing user
          </Button>
          {isStudent ? (
            <Button
              className="cc-invite-secondary"
              onClick={() => setImportOpen(true)}
            >
              <UploadIcon size={15} /> Import CSV
            </Button>
          ) : null}
          <Button
            className="cc-invite-primary"
            type="primary"
            onClick={() => setInviteOpen(true)}
          >
            <MailPlus size={15} /> Invite {noun}
          </Button>
        </div>
      </div>

      {/* Delivery failures, surfaced where they will actually be read. */}
      {undeliverable > 0 ? (
        <div className="cc-invite-delivery-banner" role="alert">
          <AlertTriangle size={16} />
          <span>
            <b>
              {undeliverable} invitation{undeliverable === 1 ? '' : 's'}
            </b>{' '}
            on this page could not be delivered, so {undeliverable === 1 ? 'it' : 'they'}{' '}
            never reached the {undeliverable === 1 ? 'invitee' : 'invitees'}.
            Check the address for a typo, then use <b>Resend</b>. Hover “Not
            delivered” on a row for the reason.
          </span>
        </div>
      ) : null}

      <PeopleTableShell
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        errorTitle="Couldn’t load invitations"
        errorText="Something went wrong fetching invitations."
        skeletonColumns={6}
        skeletonRows={8}
      >
        <Table<OrgInvitation>
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={isFetching}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t, range) =>
              `${range[0]}–${range[1]} of ${t.toLocaleString()}`,
            position: ['bottomRight'],
          }}
          locale={{
            emptyText: (
              <PeopleEmpty
                icon={<MailPlus size={22} />}
                title={
                  status === 'actionable'
                    ? 'Nothing outstanding'
                    : 'No invitations here'
                }
                text={
                  status === 'actionable'
                    ? `No ${noun} invitations are waiting on a response.`
                    : 'Try a different status filter.'
                }
                action={
                  status === 'actionable' ? (
                    <Button
                      className="cc-invite-primary"
                      type="primary"
                      onClick={() => setInviteOpen(true)}
                    >
                      <MailPlus size={15} /> Invite {noun}
                    </Button>
                  ) : undefined
                }
              />
            ),
          }}
        />
      </PeopleTableShell>

      <InviteByEmailModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgId={orgId}
        orgName={orgName}
        role={role}
      />

      {isStudent ? (
        <CsvImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          orgId={orgId}
        />
      ) : null}

      {/* ── Add an existing TopCoach user ── */}
      <Modal
        title={isStudent ? 'Add an existing student' : 'Add an existing counselor'}
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={submitAddExisting}
        okText={isStudent ? 'Add student' : 'Add counselor'}
        okButtonProps={{
          className: 'cc-invite-primary',
          disabled: !selectedUserId,
        }}
        confirmLoading={adding}
        className="cc-invite-modal"
        destroyOnClose
      >
        <p className="cc-invite-add-help">
          Search for someone who <b>already has</b> a TopCoach account and add
          them straight to <b>{orgName ?? 'this organization'}</b> as an active{' '}
          {noun} — no email is sent. Use <b>Invite {noun}</b> instead to email
          someone who is new to TopCoach.
        </p>
        {/* Says out loud what the masking does, so a counselor who sees
            "Sherali O. · sh•••3@gmail.com" reads it as a privacy rule and not
            as broken data. */}
        <p className="cc-invite-add-help">
          Results show a shortened name and a partly hidden email — search by
          full email to find one specific person.
        </p>
        {hasBranches ? (
          <div style={{ marginBottom: 12 }}>
            <div className="cc-invite-add-help" style={{ marginBottom: 4 }}>
              Branch
            </div>
            <Select
              style={{ width: '100%' }}
              value={addBranchId}
              onChange={setAddBranchId}
              options={activeBranches(branches).map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />
          </div>
        ) : null}
        <UserSearchSelect
          orgId={orgId}
          value={selectedUserId}
          active={addOpen}
          onChange={(id, label) => {
            setSelectedUserId(id);
            setSelectedUserName(label);
          }}
        />
      </Modal>
    </div>
  );
}

export default InvitationsTab;
