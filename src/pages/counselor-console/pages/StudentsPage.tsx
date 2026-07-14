import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Modal,
  Progress,
  Select,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  Archive,
  ArrowRightLeft,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Search as SearchIcon,
  UserMinus,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import { CcMenu, type CcMenuItem } from '../components/CcMenu';
import { CcAvatar } from '../components/CcAvatar';
import TableSkeleton from 'src/components/loading/TableSkeleton';
import { useAppDispatch } from 'src/app/store';
import {
  counselorConsoleApi,
  useGetOrgStudentsQuery,
  useArchiveStudentMutation,
  useTransferStudentMutation,
  useRemoveStudentMutation,
  type OrgStudent,
  type OrgStudentStatus,
} from 'src/app/services/counselorConsoleApi';
import './StudentsPage.scss';

dayjs.extend(relativeTime);

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'active' | 'invited' | 'archived';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_PILL: Record<
  OrgStudentStatus,
  { tone: CcPillVariant; label: string }
> = {
  active: { tone: 'success', label: 'Active' },
  invited: { tone: 'info', label: 'Invited' },
  archived: { tone: 'neutral', label: 'Archived' },
};

/** Map an antd sorter field/order onto the `field:asc|desc` string the API wants. */
type SortField = 'name' | 'progress' | 'lastActiveAt';
function toSortParam(
  sorter: SorterResult<OrgStudent> | SorterResult<OrgStudent>[],
): string | undefined {
  const s = Array.isArray(sorter) ? sorter[0] : sorter;
  if (!s || !s.order || !s.field) return undefined;
  const field = String(s.field) as SortField;
  return `${field}:${s.order === 'ascend' ? 'asc' : 'desc'}`;
}

function progressColor(pct: number): string {
  if (pct >= 80) return 'var(--cc-success)';
  if (pct >= 50) return 'var(--cc-warning)';
  return 'var(--cc-accent)';
}

function gradeSummary(s: OrgStudent): { main: string; sub: string | null } {
  // gradeLevel can arrive as a number (e.g. 11) or a string (e.g. "Grade 11"),
  // so coerce before string ops.
  const raw = s.gradeLevel != null ? String(s.gradeLevel).trim() : '';
  const main = raw ? (/grade/i.test(raw) ? raw : `Grade ${raw}`) : '—';
  const sub = s.graduationYear ? `Class of ${s.graduationYear}` : null;
  return { main, sub };
}

export default function CounselorConsoleStudentsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orgId, org, orgs } = useCounselorConsole();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  // Debounce the search box → committed `search` (fed to the query).
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [search, status, orgId]);

  const queryArgs = useMemo(
    () => ({
      orgId: orgId ?? '',
      search: search || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: PAGE_SIZE,
      sort,
    }),
    [orgId, search, status, page, sort],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetOrgStudentsQuery(queryArgs, { skip: !orgId });

  const [archiveStudent, { isLoading: archiving }] = useArchiveStudentMutation();
  const [transferStudent, { isLoading: transferring }] =
    useTransferStudentMutation();
  const [removeStudent] = useRemoveStudentMutation();

  // Transfer modal state
  const [transferTarget, setTransferTarget] = useState<OrgStudent | null>(null);
  const [transferOrgId, setTransferOrgId] = useState<string | undefined>(
    undefined,
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleView = (userId: string) => {
    navigate(`/counselor-console/students/${userId}`);
  };

  // Other organizations the current user belongs to — transfer destinations.
  const transferOptions = useMemo(
    () =>
      orgs
        .filter((m) => m.organization.id !== orgId)
        .map((m) => ({ value: m.organization.id, label: m.organization.name })),
    [orgs, orgId],
  );

  const handleArchive = (s: OrgStudent) => {
    if (!orgId) return;
    Modal.confirm({
      title: `Archive ${s.name}?`,
      content:
        'Archived students are removed from the active roster but their data is kept. You can filter to “Archived” to find them again.',
      okText: 'Archive',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await archiveStudent({ orgId, userId: s.userId }).unwrap();
          message.success(`${s.name} archived`);
          refetch();
        } catch {
          message.error('Could not archive this student. Please try again.');
        }
      },
    });
  };

  const handleRemove = (s: OrgStudent) => {
    if (!orgId) return;
    Modal.confirm({
      title: `Remove ${s.name}?`,
      content: (
        <span className="cc-roster-remove-desc">
          Remove <b>{s.name}</b> from{' '}
          <b>{org?.name ?? 'this organization'}</b>? They keep their TopCoach
          account, but leave this roster.
        </span>
      ),
      okText: 'Remove',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await removeStudent({ orgId, userId: s.userId }).unwrap();
          message.success(
            `${s.name} removed from ${org?.name ?? 'the organization'}`,
          );
          refetch();
        } catch {
          message.error('Could not remove this student. Please try again.');
        }
      },
    });
  };

  const openTransfer = (s: OrgStudent) => {
    setTransferTarget(s);
    setTransferOrgId(transferOptions[0]?.value);
  };

  const submitTransfer = async () => {
    if (!orgId || !transferTarget || !transferOrgId) return;
    try {
      await transferStudent({
        orgId,
        userId: transferTarget.userId,
        targetOrgId: transferOrgId,
      }).unwrap();
      const destName =
        transferOptions.find((o) => o.value === transferOrgId)?.label ??
        'the selected organization';
      message.success(`${transferTarget.name} transferred to ${destName}`);
      setTransferTarget(null);
      refetch();
    } catch {
      message.error('Could not transfer this student. Please try again.');
    }
  };

  const rowActionsItems = (s: OrgStudent): CcMenuItem[] => [
    {
      key: 'view',
      label: 'View profile',
      icon: <Eye size={15} />,
      onClick: () => handleView(s.userId),
    },
    {
      key: 'transfer',
      label: 'Transfer to…',
      icon: <ArrowRightLeft size={15} />,
      disabled: transferOptions.length === 0,
      onClick: () => openTransfer(s),
    },
    { type: 'divider' },
    {
      key: 'archive',
      label: 'Archive',
      icon: <Archive size={15} />,
      danger: true,
      disabled: s.status === 'archived',
      onClick: () => handleArchive(s),
    },
    {
      key: 'remove',
      label: 'Remove from organization',
      icon: <UserMinus size={15} />,
      danger: true,
      onClick: () => handleRemove(s),
    },
  ];

  // ── Export (Excel + PDF) — pulls the FULL roster for the current filters,
  //    not just the visible page, via a one-off query dispatch. ──────────────
  const rowsForExport = useRef<OrgStudent[]>([]);
  async function loadAllForExport(): Promise<OrgStudent[]> {
    if (!orgId) return [];
    const result = await dispatch(
      counselorConsoleApi.endpoints.getOrgStudents.initiate({
        orgId,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        page: 1,
        limit: Math.max(total, PAGE_SIZE),
        sort,
      }),
    ).unwrap();
    return result.items ?? [];
  }

  const exportRow = (s: OrgStudent) => ({
    Name: s.name,
    Email: s.email,
    Grade: s.gradeLevel ?? '—',
    'Graduation Year': s.graduationYear ?? '—',
    Programs: s.programs.length ? s.programs.join(', ') : '—',
    'Progress (%)': Math.round(s.progress ?? 0),
    'Last Active': s.lastActiveAt
      ? dayjs(s.lastActiveAt).format('YYYY-MM-DD')
      : '—',
    Status: STATUS_PILL[s.status]?.label ?? s.status,
  });

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const rows = await loadAllForExport();
      rowsForExport.current = rows;
      const ws = XLSX.utils.json_to_sheet(rows.map(exportRow));
      ws['!cols'] = [
        { wch: 22 },
        { wch: 30 },
        { wch: 10 },
        { wch: 16 },
        { wch: 22 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const orgSlug = org?.slug ? `${org.slug}_` : '';
      XLSX.writeFile(
        wb,
        `${orgSlug}students_${dayjs().format('YYYY-MM-DD')}.xlsx`,
      );
    } catch {
      message.error('Could not export the roster. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const rows = await loadAllForExport();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Students — ${org?.name ?? 'Organization'}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated ${dayjs().format('MMM D, YYYY')}`, 14, 30);
      autoTable(doc, {
        head: [
          ['Name', 'Email', 'Grade', 'Grad', 'Programs', 'Progress', 'Status'],
        ],
        body: rows.map((s) => [
          s.name,
          s.email,
          s.gradeLevel ?? '—',
          s.graduationYear != null ? String(s.graduationYear) : '—',
          s.programs.length ? s.programs.join(', ') : '—',
          `${Math.round(s.progress ?? 0)}%`,
          STATUS_PILL[s.status]?.label ?? s.status,
        ]),
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [123, 31, 47] }, // brand maroon
        alternateRowStyles: { fillColor: [246, 243, 236] },
      });
      const orgSlug = org?.slug ? `${org.slug}_` : '';
      doc.save(`${orgSlug}students_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch {
      message.error('Could not export the roster. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportItems: CcMenuItem[] = [
    {
      key: 'excel',
      label: 'Export as Excel',
      icon: <FileSpreadsheet size={15} />,
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FileText size={15} />,
      onClick: exportToPDF,
    },
  ];

  const columns: ColumnsType<OrgStudent> = [
    {
      title: 'Student',
      key: 'name',
      sorter: true,
      showSorterTooltip: false,
      render: (_, s) => (
        <div className="cc-roster-student">
          <CcAvatar
            name={s.name}
            src={s.avatarUrl}
            className="cc-roster-avatar"
          />
          <div className="cc-roster-student-meta">
            <div className="cc-roster-student-name">{s.name}</div>
            <div className="cc-roster-student-email">{s.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Grade',
      key: 'grade',
      width: 160,
      render: (_, s) => {
        const g = gradeSummary(s);
        return (
          <div>
            <div className="cc-roster-grade-main">{g.main}</div>
            {g.sub ? <div className="cc-roster-grade-sub">{g.sub}</div> : null}
          </div>
        );
      },
    },
    {
      title: 'Program',
      key: 'program',
      width: 210,
      render: (_, s) =>
        s.programs.length > 0 ? (
          <div className="cc-roster-programs">
            {s.programs.map((p) => (
              <span className="cc-roster-program-pill" key={p}>
                {p}
              </span>
            ))}
          </div>
        ) : (
          <span className="cc-roster-muted">—</span>
        ),
    },
    {
      title: 'Top program',
      key: 'progress',
      width: 190,
      sorter: true,
      showSorterTooltip: false,
      render: (_, s) => {
        const pct = Math.max(0, Math.min(100, Math.round(s.progress ?? 0)));
        const label = s.topProgram
          ? `${pct}% · ${s.topProgram}`
          : `${pct}%`;
        const tip = s.topProgram
          ? `${pct}% in ${s.topProgram} — the student's furthest-along program`
          : 'No program progress yet';
        return (
          <div className="cc-roster-progress" title={tip}>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={progressColor(pct)}
              trailColor="var(--cc-hairline)"
            />
            <div className="cc-roster-progress-label">{label}</div>
          </div>
        );
      },
    },
    {
      title: 'Last active',
      key: 'lastActiveAt',
      width: 140,
      sorter: true,
      showSorterTooltip: false,
      render: (_, s) =>
        s.lastActiveAt ? (
          <span className="cc-roster-lastactive" title={dayjs(s.lastActiveAt).format('lll')}>
            {dayjs(s.lastActiveAt).fromNow()}
          </span>
        ) : (
          <span className="cc-roster-muted">—</span>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, s) => {
        const p = STATUS_PILL[s.status] ?? { tone: 'neutral', label: s.status };
        return <CcPill variant={p.tone}>{p.label}</CcPill>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, s) => (
        <div
          className="cc-roster-actions"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <Button
            className="cc-roster-view"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleView(s.userId);
            }}
          >
            <Eye size={13} /> View
          </Button>
          <CcMenu
            items={rowActionsItems(s)}
            align="right"
            ariaLabel={`Actions for ${s.name}`}
            triggerClassName="cc-roster-kebab"
          >
            <MoreVertical size={15} />
          </CcMenu>
        </div>
      ),
    },
  ];

  // ── Null-org state ──────────────────────────────────────────────────────
  if (!orgId) {
    return (
      <div>
        <div className="cc-page-head--ruled">
          <div className="cc-page-eyebrow">
            <span className="cc-page-eyebrow-accent">People</span>
          </div>
          <h1 className="cc-page-title">Students</h1>
          <p className="cc-page-lead">
            The full roster for this organization — search, filter and drill into
            each student.
          </p>
        </div>
        <div className="cc-placeholder">
          <Users size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">No organization selected</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to view its students.
          </div>
        </div>
      </div>
    );
  }

  const countLabel = isLoading ? '…' : total.toLocaleString();

  return (
    <div className="cc-roster">
      <div className="cc-page-head--ruled">
        <div className="cc-roster-head">
          <div>
            <div className="cc-page-eyebrow">
              <span className="cc-page-eyebrow-accent">People</span>
              {org ? <span>· {org.name}</span> : null}
            </div>
            <h1 className="cc-page-title">Students</h1>
            <div className="cc-roster-count">
              <b>{countLabel}</b> {total === 1 ? 'student' : 'students'}
            </div>
          </div>
          <div className="cc-roster-head-actions">
            <CcMenu
              items={exportItems}
              align="right"
              ariaLabel="Export roster"
              disabled={exporting || total === 0}
              triggerClassName="cc-roster-export"
            >
              <Download size={15} />
              <span>{exporting ? 'Exporting…' : 'Export'}</span>
            </CcMenu>
          </div>
        </div>
      </div>

      <div className="cc-roster-toolbar">
        <Input
          className="cc-roster-search"
          allowClear
          prefix={<SearchIcon size={15} />}
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search students"
        />
        <Select<StatusFilter>
          className="cc-roster-status"
          value={status}
          onChange={(v) => setStatus(v)}
          options={STATUS_OPTIONS}
          aria-label="Filter by status"
        />
      </div>

      {isLoading ? (
        <div className="cc-roster-skeleton">
          <TableSkeleton columns={6} rows={8} />
        </div>
      ) : isError ? (
        <div className="cc-roster-table">
          <div className="cc-roster-empty">
            <div className="cc-roster-empty-title">Couldn’t load students</div>
            <div>Something went wrong fetching the roster.</div>
            <Button className="cc-roster-view" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="cc-roster-table">
          <Table<OrgStudent>
            columns={columns}
            dataSource={items}
            rowKey="userId"
            loading={isFetching}
            onChange={(_pagination, _filters, sorter) => {
              setSort(toSortParam(sorter));
            }}
            onRow={(record) => ({
              className: 'cc-roster-row',
              tabIndex: 0,
              onClick: () => handleView(record.userId),
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleView(record.userId);
                }
              },
            })}
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
                <div className="cc-roster-empty">
                  <Users size={22} color="#9a8f7d" />
                  <div className="cc-roster-empty-title">No students found</div>
                  <div>
                    {search || status !== 'all'
                      ? 'Try adjusting your search or status filter.'
                      : 'This organization has no students yet.'}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      )}

      {/* ── Transfer student modal ── */}
      <Modal
        title={
          transferTarget ? `Transfer ${transferTarget.name}` : 'Transfer student'
        }
        open={!!transferTarget}
        onCancel={() => setTransferTarget(null)}
        onOk={submitTransfer}
        okText="Transfer"
        confirmLoading={transferring || archiving}
        okButtonProps={{ disabled: !transferOrgId }}
        destroyOnClose
      >
        <p className="cc-roster-transfer-lead">
          Move this student to another organization you manage. They’ll appear on
          the destination roster and be removed from{' '}
          <b>{org?.name ?? 'this organization'}</b>.
        </p>
        <div className="cc-roster-transfer-field">
          <label className="cc-roster-transfer-label">Destination organization</label>
          <Select
            style={{ width: '100%' }}
            value={transferOrgId}
            onChange={(v) => setTransferOrgId(v)}
            options={transferOptions}
            placeholder="Select an organization"
            notFoundContent="You don’t belong to any other organizations"
          />
        </div>
      </Modal>
    </div>
  );
}
