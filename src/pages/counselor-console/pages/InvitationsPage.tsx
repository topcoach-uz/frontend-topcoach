import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  MailPlus,
  RotateCcw,
  Search,
  Send,
  Upload as UploadIcon,
  UserPlus,
  Users,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import TableSkeleton from 'src/components/loading/TableSkeleton';
import {
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useBulkInviteMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useSearchOrgUsersQuery,
  useAddOrgMemberMutation,
  type OrgInvitation,
  type OrgInvitationStatus,
  type OrgMembershipRole,
  type CreateInvitationBody,
  type BulkInviteResult,
} from 'src/app/services/counselorConsoleApi';
import './InvitationsPage.scss';

const PAGE_SIZE = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StatusFilter = 'all' | OrgInvitationStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const STATUS_PILL: Record<
  OrgInvitationStatus,
  { tone: CcPillVariant; label: string }
> = {
  pending: { tone: 'info', label: 'Pending' },
  accepted: { tone: 'success', label: 'Accepted' },
  expired: { tone: 'warning', label: 'Expired' },
  revoked: { tone: 'neutral', label: 'Revoked' },
};

// Only counselors and students are invitable — owners are set deliberately,
// never via an invite (enforced by the backend too).
const ROLE_OPTIONS: { value: OrgMembershipRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'counselor', label: 'Counselor' },
];

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

// ── CSV parsing ──────────────────────────────────────────────────────────────
// Expected header: name,email,grade,graduationYear,phone
// Manual RFC-4180-ish parser (papaparse is not a dependency): handles quoted
// fields, escaped double-quotes and embedded commas/newlines.

interface ParsedCsvRow {
  key: string;
  name: string;
  email: string;
  grade: string;
  graduationYear: string;
  phone: string;
  valid: boolean;
  error: string | null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // flush trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const HEADER_ALIASES: Record<string, keyof Omit<ParsedCsvRow, 'key' | 'valid' | 'error'>> = {
  name: 'name',
  'full name': 'name',
  email: 'email',
  'email address': 'email',
  grade: 'grade',
  'grade level': 'grade',
  gradelevel: 'grade',
  graduationyear: 'graduationYear',
  'graduation year': 'graduationYear',
  gradyear: 'graduationYear',
  phone: 'phone',
  'phone number': 'phone',
};

const NUMERIC_HEADER_ORDER: (keyof Omit<ParsedCsvRow, 'key' | 'valid' | 'error'>)[] = [
  'name',
  'email',
  'grade',
  'graduationYear',
  'phone',
];

/** Parse + validate the raw CSV text into preview rows. */
function buildPreviewRows(text: string): ParsedCsvRow[] {
  const table = parseCsv(text).filter(
    (r) => r.length > 0 && r.some((c) => c.trim() !== ''),
  );
  if (table.length === 0) return [];

  // Detect a header row: if the first row's cells map to known aliases.
  const first = table[0]!.map((c) => c.trim().toLowerCase());
  const looksLikeHeader = first.some((c) => c in HEADER_ALIASES);

  let colMap: (keyof Omit<ParsedCsvRow, 'key' | 'valid' | 'error'> | null)[];
  let dataRows: string[][];
  if (looksLikeHeader) {
    colMap = first.map((c) => HEADER_ALIASES[c] ?? null);
    dataRows = table.slice(1);
  } else {
    // No header — assume the canonical column order.
    colMap = NUMERIC_HEADER_ORDER;
    dataRows = table;
  }

  const seenEmails = new Set<string>();

  return dataRows.map((cells, idx) => {
    const rec: Record<string, string> = {
      name: '',
      email: '',
      grade: '',
      graduationYear: '',
      phone: '',
    };
    colMap.forEach((field, ci) => {
      if (field) rec[field] = (cells[ci] ?? '').trim();
    });

    const email = rec.email.toLowerCase();
    let error: string | null = null;
    if (!email) {
      error = 'Missing email';
    } else if (!EMAIL_RE.test(email)) {
      error = 'Invalid email';
    } else if (seenEmails.has(email)) {
      error = 'Duplicate in file';
    } else if (rec.graduationYear && !/^\d{4}$/.test(rec.graduationYear)) {
      error = 'Graduation year must be a 4-digit year';
    }
    if (email && !error) seenEmails.add(email);

    return {
      key: `${idx}-${email || 'row'}`,
      name: rec.name,
      email: rec.email,
      grade: rec.grade,
      graduationYear: rec.graduationYear,
      phone: rec.phone,
      valid: !error,
      error,
    };
  });
}

export default function CounselorConsoleInvitationsPage() {
  const { orgId, org } = useCounselorConsole();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  // Single-invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm] = Form.useForm();

  // CSV import modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<ParsedCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<BulkInviteResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add-existing-user modal
  const [addOpen, setAddOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(userQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  const queryArgs = useMemo(
    () => ({
      orgId: orgId ?? '',
      status: status === 'all' ? undefined : status,
      page,
      limit: PAGE_SIZE,
    }),
    [orgId, status, page],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetInvitationsQuery(queryArgs, { skip: !orgId });

  const [createInvitation, { isLoading: creating }] = useCreateInvitationMutation();
  const [bulkInvite, { isLoading: bulkSubmitting }] = useBulkInviteMutation();
  const [resendInvitation] = useResendInvitationMutation();
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [addOrgMember, { isLoading: adding }] = useAddOrgMemberMutation();

  const { data: userResults, isFetching: searching } = useSearchOrgUsersQuery(
    { orgId: orgId ?? '', q: debouncedQuery },
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

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // ── Single invite ──────────────────────────────────────────────────────────
  const openInvite = () => {
    inviteForm.resetFields();
    inviteForm.setFieldsValue({ role: 'student' });
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    if (!orgId) return;
    let values: {
      name?: string;
      email: string;
      grade?: string;
      graduationYear?: number;
      phone?: string;
      role: OrgMembershipRole;
    };
    try {
      values = await inviteForm.validateFields();
    } catch {
      return; // validation errors are shown inline
    }
    try {
      await createInvitation({
        orgId,
        email: values.email.trim(),
        role: values.role,
        name: values.name?.trim() || undefined,
        gradeLevel: values.grade?.trim() || undefined,
        graduationYear: values.graduationYear || undefined,
        phone: values.phone?.trim() || undefined,
      }).unwrap();
      message.success(`Invitation sent to ${values.email.trim()}`);
      setInviteOpen(false);
    } catch (err: any) {
      const reason =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        'Could not send the invitation. Please try again.';
      message.error(String(reason));
    }
  };

  // ── Add existing user ────────────────────────────────────────────────────────
  const openAddExisting = () => {
    setUserQuery('');
    setDebouncedQuery('');
    setSelectedUserId(undefined);
    setAddOpen(true);
  };

  const submitAddExisting = async () => {
    if (!orgId || !selectedUserId) return;
    const picked = userOptions.find((u) => u.value === selectedUserId);
    try {
      await addOrgMember({
        orgId,
        userId: selectedUserId,
        role: 'student',
      }).unwrap();
      message.success(`${picked?.label ?? 'Student'} added to your organization`);
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

  // ── CSV import ───────────────────────────────────────────────────────────────
  const openImport = () => {
    setCsvRows([]);
    setCsvFileName(null);
    setCsvResult(null);
    setImportOpen(true);
  };

  const handleFilePicked = (file: File) => {
    setCsvResult(null);
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = buildPreviewRows(String(reader.result ?? ''));
        setCsvRows(rows);
        if (rows.length === 0) {
          message.warning('No rows found in that file.');
        }
      } catch {
        message.error('Could not read that CSV file.');
      }
    };
    reader.onerror = () => message.error('Could not read that CSV file.');
    reader.readAsText(file);
  };

  const validCsvRows = useMemo(() => csvRows.filter((r) => r.valid), [csvRows]);
  const invalidCsvCount = csvRows.length - validCsvRows.length;

  const submitBulk = async () => {
    if (!orgId || validCsvRows.length === 0) return;
    const invitations: CreateInvitationBody[] = validCsvRows.map((r) => ({
      email: r.email.trim(),
      role: 'student',
      name: r.name.trim() || undefined,
      gradeLevel: r.grade.trim() || undefined,
      graduationYear: r.graduationYear ? Number(r.graduationYear) : undefined,
      phone: r.phone.trim() || undefined,
    }));
    try {
      const result = await bulkInvite({ orgId, invitations }).unwrap();
      setCsvResult(result);
      message.success(
        `Imported ${result.created} invitation${result.created === 1 ? '' : 's'}` +
          (result.skipped.length
            ? ` · ${result.skipped.length} skipped`
            : ''),
      );
    } catch (err: any) {
      const reason =
        err?.data?.message || 'Could not import invitations. Please try again.';
      message.error(String(reason));
    }
  };

  // ── Row actions ──────────────────────────────────────────────────────────────
  const handleResend = async (inv: OrgInvitation) => {
    if (!orgId) return;
    try {
      await resendInvitation({ orgId, id: inv.id }).unwrap();
      message.success(`Invitation re-sent to ${inv.email}`);
    } catch {
      message.error('Could not resend the invitation.');
    }
  };

  const handleRevoke = async (inv: OrgInvitation) => {
    if (!orgId) return;
    try {
      await revokeInvitation({ orgId, id: inv.id }).unwrap();
      message.success(`Invitation to ${inv.email} revoked`);
    } catch {
      message.error('Could not revoke the invitation.');
    }
  };

  const confirmRevoke = (inv: OrgInvitation) => {
    Modal.confirm({
      title: 'Revoke invitation?',
      content: (
        <span className="cc-invite-confirm-desc">
          This will cancel the invite to <b>{inv.email}</b>. They will no longer
          be able to join with the existing link.
        </span>
      ),
      okText: 'Revoke',
      okButtonProps: { danger: true },
      cancelText: 'Keep',
      onOk: () => handleRevoke(inv),
    });
  };

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
    {
      title: 'Role',
      key: 'role',
      width: 130,
      render: (_, inv) => (
        <CcPill variant={ROLE_PILL[inv.role] ?? 'neutral'}>
          {ROLE_LABEL[inv.role] ?? inv.role}
        </CcPill>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, inv) => {
        const p = STATUS_PILL[inv.status] ?? {
          tone: 'neutral' as CcPillVariant,
          label: inv.status,
        };
        return <CcPill variant={p.tone}>{p.label}</CcPill>;
      },
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
          <span className="cc-invite-muted">—</span>
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
          <span className="cc-invite-muted">—</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 190,
      align: 'right',
      render: (_, inv) => {
        const actionable = inv.status === 'pending' || inv.status === 'expired';
        if (!actionable) return <span className="cc-invite-muted">—</span>;
        return (
          <div className="cc-invite-row-actions">
            <Button
              className="cc-invite-ghost"
              size="small"
              onClick={() => handleResend(inv)}
            >
              <RotateCcw size={13} /> Resend
            </Button>
            <Button
              className="cc-invite-ghost cc-invite-ghost--danger"
              size="small"
              onClick={() => confirmRevoke(inv)}
            >
              <XCircle size={13} /> Revoke
            </Button>
          </div>
        );
      },
    },
  ];

  const previewColumns: ColumnsType<ParsedCsvRow> = [
    {
      title: '',
      key: 'flag',
      width: 40,
      render: (_, r) =>
        r.valid ? (
          <CheckCircle2 size={16} className="cc-invite-flag-ok" />
        ) : (
          <AlertTriangle size={16} className="cc-invite-flag-bad" />
        ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => v || '—' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '—' },
    { title: 'Grade', dataIndex: 'grade', key: 'grade', width: 80, render: (v) => v || '—' },
    {
      title: 'Grad yr',
      dataIndex: 'graduationYear',
      key: 'graduationYear',
      width: 90,
      render: (v) => v || '—',
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v) => v || '—' },
    {
      title: 'Result',
      key: 'result',
      width: 170,
      render: (_, r) =>
        r.valid ? (
          <span className="cc-invite-flag-ok-text">Ready</span>
        ) : (
          <span className="cc-invite-flag-bad-text">{r.error}</span>
        ),
    },
  ];

  // ── Null-org state ───────────────────────────────────────────────────────────
  if (!orgId) {
    return (
      <div>
        <div className="cc-page-head--ruled">
          <div className="cc-page-eyebrow">
            <span className="cc-page-eyebrow-accent">People</span>
          </div>
          <h1 className="cc-page-title">Invitations</h1>
          <p className="cc-page-lead">
            Invite students to join your organization and track every pending,
            accepted and expired invite.
          </p>
        </div>
        <div className="cc-placeholder">
          <Users size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">No organization selected</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to manage its invitations.
          </div>
        </div>
      </div>
    );
  }

  const countLabel = isLoading ? '…' : total.toLocaleString();

  return (
    <div className="cc-invite">
      <div className="cc-page-head--ruled">
        <div className="cc-invite-head">
          <div>
            <div className="cc-page-eyebrow">
              <span className="cc-page-eyebrow-accent">People</span>
              {org ? <span>· {org.name}</span> : null}
            </div>
            <h1 className="cc-page-title">Invitations</h1>
            <div className="cc-invite-count">
              <b>{countLabel}</b> {total === 1 ? 'invitation' : 'invitations'}
            </div>
          </div>
          <div className="cc-invite-head-actions">
            <Button className="cc-invite-secondary" onClick={openAddExisting}>
              <UserPlus size={15} /> Add existing
            </Button>
            <Button className="cc-invite-secondary" onClick={openImport}>
              <UploadIcon size={15} /> Import CSV
            </Button>
            <Button className="cc-invite-primary" type="primary" onClick={openInvite}>
              <MailPlus size={15} /> Invite student
            </Button>
          </div>
        </div>
      </div>

      <div className="cc-invite-toolbar">
        <Select<StatusFilter>
          className="cc-invite-status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          aria-label="Filter by status"
        />
      </div>

      {isLoading ? (
        <div className="cc-invite-skeleton">
          <TableSkeleton columns={5} rows={8} />
        </div>
      ) : isError ? (
        <div className="cc-invite-table">
          <div className="cc-invite-empty">
            <div className="cc-invite-empty-title">Couldn’t load invitations</div>
            <div>Something went wrong fetching invitations.</div>
            <Button className="cc-invite-ghost" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="cc-invite-table">
          <Table<OrgInvitation>
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={isFetching}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              onChange: (next) => setPage(next),
              showSizeChanger: false,
              showTotal: (t, range) =>
                `${range[0]}–${range[1]} of ${t.toLocaleString()}`,
              position: ['bottomRight'],
            }}
            locale={{
              emptyText: (
                <div className="cc-invite-empty">
                  <MailPlus size={22} color="#9a8f7d" />
                  <div className="cc-invite-empty-title">No invitations yet</div>
                  <div>
                    {status !== 'all'
                      ? 'Try a different status filter.'
                      : 'Invite your first student to get started.'}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      )}

      {/* ── Add existing user modal ── */}
      <Modal
        title="Add an existing student"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={submitAddExisting}
        okText="Add student"
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
          them straight to <b>{org?.name ?? 'this organization'}</b> as an active
          student — no email is sent. Use <b>Invite student</b> instead to email
          someone who is new to TopCoach.
        </p>
        <Select
          className="cc-invite-user-select"
          showSearch
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
            <div className="cc-invite-user-opt">
              <span className="cc-invite-user-opt-name">{opt.data.label}</span>
              <span className="cc-invite-user-opt-email">
                {(opt.data as { email?: string }).email}
              </span>
            </div>
          )}
          suffixIcon={<Search size={15} />}
          style={{ width: '100%' }}
        />
      </Modal>

      {/* ── Single invite modal ── */}
      <Modal
        title="Invite student"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={submitInvite}
        okText="Send invitation"
        confirmLoading={creating}
        okButtonProps={{ className: 'cc-invite-primary' }}
        className="cc-invite-modal"
        destroyOnClose
      >
        <Form form={inviteForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Full name">
            <Input placeholder="Jane Doe" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'An email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="jane@example.com" autoComplete="off" />
          </Form.Item>
          <div className="cc-invite-form-row">
            <Form.Item name="grade" label="Grade">
              <Input placeholder="e.g. 11" autoComplete="off" />
            </Form.Item>
            <Form.Item name="graduationYear" label="Graduation year">
              <InputNumber
                placeholder="2027"
                controls={false}
                min={1900}
                max={2100}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 555 000 0000" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Choose a role' }]}
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── CSV import modal ── */}
      <Modal
        title="Import students from CSV"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        width={760}
        className="cc-invite-modal cc-invite-import-modal"
        destroyOnClose
        footer={
          csvResult
            ? [
                <Button key="done" type="primary" className="cc-invite-primary" onClick={() => setImportOpen(false)}>
                  Done
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setImportOpen(false)}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  className="cc-invite-primary"
                  disabled={validCsvRows.length === 0}
                  loading={bulkSubmitting}
                  onClick={submitBulk}
                >
                  Invite {validCsvRows.length} valid{' '}
                  {validCsvRows.length === 1 ? 'student' : 'students'}
                </Button>,
              ]
        }
      >
        {csvResult ? (
          <div className="cc-invite-result">
            <div className="cc-invite-result-summary">
              <CheckCircle2 size={18} className="cc-invite-flag-ok" />
              <span>
                <b>{csvResult.created}</b> invitation
                {csvResult.created === 1 ? '' : 's'} created
                {csvResult.skipped.length
                  ? ` · ${csvResult.skipped.length} skipped`
                  : ''}
                .
              </span>
            </div>
            {csvResult.skipped.length > 0 && (
              <div className="cc-invite-skipped">
                <div className="cc-invite-skipped-title">Skipped</div>
                <ul>
                  {csvResult.skipped.map((s) => (
                    <li key={s.email}>
                      <span className="cc-invite-skipped-email">{s.email}</span>
                      <span className="cc-invite-skipped-reason">{s.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="cc-invite-import-help">
              Upload a CSV with the columns{' '}
              <code>name,email,graduationYear,grade,phone</code>. Only{' '}
              <b>email</b> is required. Rows are validated below before anything
              is sent.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFilePicked(f);
                // reset so the same file can be re-picked
                e.target.value = '';
              }}
            />
            <div className="cc-invite-drop">
              <Button
                className="cc-invite-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon size={15} /> Choose CSV file
              </Button>
              {csvFileName ? (
                <span className="cc-invite-filename">{csvFileName}</span>
              ) : (
                <span className="cc-invite-muted">No file selected</span>
              )}
            </div>

            {csvRows.length > 0 && (
              <>
                <div className="cc-invite-preview-meta">
                  <CcPill variant="success">{validCsvRows.length} valid</CcPill>
                  {invalidCsvCount > 0 ? (
                    <CcPill variant="warning">{invalidCsvCount} invalid</CcPill>
                  ) : null}
                </div>
                <div className="cc-invite-preview">
                  <Table<ParsedCsvRow>
                    columns={previewColumns}
                    dataSource={csvRows}
                    rowKey="key"
                    size="small"
                    pagination={
                      csvRows.length > 8 ? { pageSize: 8, size: 'small' } : false
                    }
                    rowClassName={(r) =>
                      r.valid ? '' : 'cc-invite-preview-row--invalid'
                    }
                  />
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
