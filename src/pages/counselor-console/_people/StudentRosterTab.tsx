/* ── Counselor Console — the student roster ───────────────────────────────────
   The Students page's roster, mounted twice: once for the people currently in
   the organization (`mode="active"`) and once for the ones who have been put
   away (`mode="archived"`).

   WHY THE SPLIT IS CLEAN: a student is in exactly one of three membership
   states — active, invited, archived. The active tab's segmented control covers
   the first two and the Archived tab covers the third, so every student appears
   under exactly one tab, once. The old page had an "All" segment that quietly
   mixed archived students back into the working roster, which is the ambiguity
   this restructure exists to remove.

   Export lives here rather than in the page header because it exports THIS
   tab's current filters — a counselor who has filtered to "Invited" and hits
   Export expects the invited list, not the whole organization. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Progress, Select, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  Archive,
  ArrowRightLeft,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Search as SearchIcon,
  UserMinus,
  Users,
  MapPin,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Program identity colours. Import from `../colors`, NOT from `../charts/ccEcharts`:
// that module has a top-level `echarts.use()` side effect and would drag the whole
// charting library into this page's bundle.
import { ccProgramColor, ccTint } from '../colors';
import { CcPill } from '../components/CcPill';
import { CcMenu, type CcMenuItem } from '../components/CcMenu';
import { CcAvatar } from '../components/CcAvatar';
import { useAppDispatch } from 'src/app/store';
import {
  counselorConsoleApi,
  useGetOrgStudentsQuery,
  useArchiveStudentMutation,
  useTransferStudentMutation,
  useMoveStudentBranchMutation,
  useRemoveStudentMutation,
  type OrgStudent,
} from 'src/app/services/counselorConsoleApi';
import type { OrgMembership } from 'src/app/services/counselorConsoleApi';
import { PeopleEmpty, PeopleTableShell, apiErrorMessage } from './peopleChrome';
import { MEMBER_STATUS_PILL } from './roleLabels';
import './roster.scss';

dayjs.extend(relativeTime);

import { useCounselorConsole } from '../CounselorConsoleContext';
import { activeBranches } from './branchHelpers';

const PAGE_SIZE = 20;
/**
 * Largest `limit` the roster endpoint accepts — `GetOrgRosterQueryDto` declares
 * `@Max(100)` and the global ValidationPipe 400s anything above it. Exports must
 * page through the roster rather than requesting it in one oversized call.
 */
const EXPORT_PAGE_SIZE = 100;
/** Safety net so a bad `total`/`items` pairing can't spin forever. */
const EXPORT_MAX_PAGES = 200;

/** The two membership states the active tab distinguishes. */
type ActiveFilter = 'active' | 'invited';

const ACTIVE_FILTERS: { value: ActiveFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
];

/**
 * How many program pills a cell shows before collapsing the rest into a `+N`
 * chip. Two keeps the column on one line at its 210px width.
 */
const PROGRAM_PILL_LIMIT = 2;

/**
 * Avatar hue variants. Initials fallbacks are tinted per student so a list of
 * them reads as people rather than one repeated maroon disc. The hue is picked
 * from a stable hash of the student's id (never their index or Math.random), so
 * a given student keeps the same colour across pages, sorts and re-renders.
 *
 * Purely decorative: the avatar always carries the initials, and the name sits
 * next to it, so nothing is encoded by colour alone.
 */
const AVATAR_HUES = ['maroon', 'gold', 'green', 'violet', 'rose'] as const;

function avatarHueClass(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `cc-roster-avatar--${AVATAR_HUES[h % AVATAR_HUES.length]}`;
}

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
  const main = raw ? (/grade/i.test(raw) ? raw : `Grade ${raw}`) : '-';
  const sub = s.graduationYear ? `Class of ${s.graduationYear}` : null;
  return { main, sub };
}

export function StudentRosterTab({
  orgId,
  org,
  orgs,
  mode,
}: {
  orgId: string;
  org: { name?: string; slug?: string } | null | undefined;
  orgs: OrgMembership[];
  mode: 'active' | 'archived';
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isArchived = mode === 'archived';
  const { branches, branchId, hasBranches } = useCounselorConsole();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  /** The status this tab is pinned to. Archived is fixed; active toggles. */
  const status = isArchived ? 'archived' : activeFilter;

  // Debounce the search box → committed `search` (fed to the query).
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [search, status, orgId, branchId]);

  const queryArgs = useMemo(
    () => ({
      orgId,
      branchId,
      search: search || undefined,
      status,
      page,
      limit: PAGE_SIZE,
      sort,
    }),
    [orgId, branchId, search, status, page, sort],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetOrgStudentsQuery(queryArgs, { skip: !orgId });

  const [archiveStudent, { isLoading: archiving }] = useArchiveStudentMutation();
  const [transferStudent, { isLoading: transferring }] =
    useTransferStudentMutation();
  const [removeStudent] = useRemoveStudentMutation();
  const [moveStudentBranch, { isLoading: movingBranch }] =
    useMoveStudentBranchMutation();
  const [moveTarget, setMoveTarget] = useState<OrgStudent | null>(null);
  const [moveBranchId, setMoveBranchId] = useState<string | undefined>();
  const moveOptions = useMemo(
    () =>
      activeBranches(branches).map((b) => ({ value: b.id, label: b.name })),
    [branches],
  );

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
    Modal.confirm({
      title: `Archive ${s.name}?`,
      content:
        'Archived students no longer appear in your active students list, but their data is kept. You can find them again under the Archived tab.',
      okText: 'Archive',
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
    Modal.confirm({
      title: `Remove ${s.name}?`,
      content: (
        <span className="cc-roster-remove-desc">
          Remove <b>{s.name}</b> from <b>{org?.name ?? 'this organization'}</b>?
          They keep their TopCoach account, but leave your student list. This
          cannot be undone from here; you would need to invite them again.
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

  const openMove = (s: OrgStudent) => {
    setMoveTarget(s);
    setMoveBranchId(
      moveOptions.find((o) => o.value !== s.branchId)?.value ?? s.branchId ?? undefined,
    );
  };

  const submitMove = async () => {
    if (!moveTarget || !moveBranchId) return;
    try {
      await moveStudentBranch({
        orgId,
        userId: moveTarget.userId,
        branchId: moveBranchId,
      }).unwrap();
      const dest =
        moveOptions.find((o) => o.value === moveBranchId)?.label ?? 'the branch';
      message.success(`${moveTarget.name} moved to ${dest}`);
      setMoveTarget(null);
    } catch (err) {
      message.error(
        apiErrorMessage(err, 'Could not move this student. Please try again.'),
      );
    }
  };

  const submitTransfer = async () => {
    if (!transferTarget || !transferOrgId) return;
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
    } catch (error) {
      const status = (error as { status?: unknown } | null)?.status;
      message.error(
        status === 409
          ? 'This student already has a staff role in the destination organization. The transfer was not applied.'
          : status === 403
            ? 'You no longer have permission to transfer this student. Refresh the roster and check your organization access.'
            : status === 404
              ? 'This student membership is no longer available. Refresh the roster before trying again.'
              : 'Could not confirm the transfer. Refresh the roster to check its status before trying again.',
      );
    }
  };

  const rowActionsItems = (s: OrgStudent): CcMenuItem[] => [
    {
      key: 'view',
      label: 'View profile',
      icon: <Eye size={15} />,
      onClick: () => handleView(s.userId),
    },
    ...(hasBranches
      ? [
          {
            key: 'move-branch',
            label: 'Move to branch…',
            icon: <MapPin size={15} />,
            onClick: () => openMove(s),
          } as CcMenuItem,
        ]
      : []),
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
  /**
   * Walk the roster page by page at the maximum allowed page size, keeping the
   * current filters/sort, until every matching student is collected. Stops on a
   * short page, once `total` rows are in hand, or at the hard page cap.
   */
  async function loadAllForExport(): Promise<OrgStudent[]> {
    const all: OrgStudent[] = [];
    let expected = Infinity;

    for (let p = 1; p <= EXPORT_MAX_PAGES; p++) {
      const result = await dispatch(
        counselorConsoleApi.endpoints.getOrgStudents.initiate({
          orgId,
          branchId,
          search: search || undefined,
          status,
          page: p,
          limit: EXPORT_PAGE_SIZE,
          sort,
        }),
      ).unwrap();

      const rows = result.items ?? [];
      all.push(...rows);

      if (p === 1 && Number.isFinite(result.total) && result.total >= 0) {
        expected = result.total;
      }
      if (rows.length < EXPORT_PAGE_SIZE || all.length >= expected) break;
    }

    return all;
  }

  const exportRow = (s: OrgStudent) => ({
    Name: s.name,
    Email: s.email,
    Grade: s.gradeLevel ?? '-',
    'Graduation Year': s.graduationYear ?? '-',
    Programs: s.programs.length ? s.programs.join(', ') : '-',
    'Progress (%)': Math.round(s.progress ?? 0),
    'Last Active': s.lastActiveAt
      ? dayjs(s.lastActiveAt).format('YYYY-MM-DD')
      : '-',
    Status: MEMBER_STATUS_PILL[s.status]?.label ?? s.status,
  });

  /** Filename stem — names the tab so two exports don't collide in Downloads. */
  const exportStem = () => {
    const orgSlug = org?.slug ? `${org.slug}_` : '';
    const scope = isArchived ? 'archived_students' : `students_${status}`;
    return `${orgSlug}${scope}_${dayjs().format('YYYY-MM-DD')}`;
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const rows = await loadAllForExport();
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
      XLSX.writeFile(wb, `${exportStem()}.xlsx`);
    } catch (err) {
      console.error('[roster] Excel export failed', err);
      message.error('Could not export the student list. Please try again.');
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
      doc.text(
        `${isArchived ? 'Archived students' : 'Students'}: ${org?.name ?? 'Organization'}`,
        14,
        22,
      );
      doc.setFontSize(11);
      doc.text(`Generated ${dayjs().format('MMM D, YYYY')}`, 14, 30);
      autoTable(doc, {
        head: [
          ['Name', 'Email', 'Grade', 'Grad', 'Programs', 'Progress', 'Status'],
        ],
        body: rows.map((s) => [
          s.name,
          s.email,
          s.gradeLevel ?? '-',
          s.graduationYear != null ? String(s.graduationYear) : '-',
          s.programs.length ? s.programs.join(', ') : '-',
          `${Math.round(s.progress ?? 0)}%`,
          MEMBER_STATUS_PILL[s.status]?.label ?? s.status,
        ]),
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [123, 31, 47] }, // brand maroon
        alternateRowStyles: { fillColor: [246, 243, 236] },
      });
      doc.save(`${exportStem()}.pdf`);
    } catch (err) {
      console.error('[roster] PDF export failed', err);
      message.error('Could not export the student list. Please try again.');
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
            className={`cc-roster-avatar ${avatarHueClass(s.userId || s.name)}`}
          />
          <div className="cc-roster-student-meta">
            <div className="cc-roster-student-name">{s.name}</div>
            <div className="cc-roster-student-email">{s.email}</div>
          </div>
        </div>
      ),
    },
    ...(hasBranches && branchId === 'all'
      ? [
          {
            title: 'Branch',
            key: 'branch',
            width: 140,
            render: (_: unknown, s: OrgStudent) =>
              s.branchName ?? <span className="cc-roster-muted">-</span>,
          },
        ]
      : []),
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
      render: (_, s) => {
        if (s.programs.length === 0)
          return <span className="cc-roster-muted">-</span>;
        const shown = s.programs.slice(0, PROGRAM_PILL_LIMIT);
        const rest = s.programs.slice(PROGRAM_PILL_LIMIT);
        return (
          <div className="cc-roster-programs">
            {shown.map((p) => {
              // Colour follows the program; unknown programs fall back to the
              // neutral rather than inventing a hue. Half the program colour
              // pairs sit in the ΔE 8–12 CVD band, so the pill ALWAYS prints the
              // program name — colour is never the only signal.
              const hue = ccProgramColor(p);
              return (
                <span
                  className="cc-roster-program-pill"
                  key={p}
                  style={{
                    color: hue,
                    background: ccTint(hue, 0.12),
                    borderColor: ccTint(hue, 0.24),
                  }}
                >
                  {p}
                </span>
              );
            })}
            {rest.length > 0 ? (
              <span
                className="cc-roster-program-pill cc-roster-program-pill--more"
                title={rest.join(', ')}
              >
                +{rest.length}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Top program',
      key: 'progress',
      width: 190,
      sorter: true,
      showSorterTooltip: false,
      render: (_, s) => {
        const pct = Math.max(0, Math.min(100, Math.round(s.progress ?? 0)));
        const label = s.topProgram ? `${pct}% · ${s.topProgram}` : `${pct}%`;
        const tip = s.topProgram
          ? `${pct}% in ${s.topProgram}, the student's furthest-along program`
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
          <span
            className="cc-roster-lastactive"
            title={dayjs(s.lastActiveAt).format('lll')}
          >
            {dayjs(s.lastActiveAt).fromNow()}
          </span>
        ) : (
          <span className="cc-roster-muted">-</span>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, s) => {
        const p = MEMBER_STATUS_PILL[s.status] ?? {
          tone: 'neutral' as const,
          label: s.status,
        };
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
            <MoreHorizontal size={16} />
          </CcMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="cc-roster" aria-busy={isFetching || archiving}>
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
        {/* Segmented control rather than AntD's <Segmented> so it wears the
            console's editorial chrome instead of Ant's defaults. Archived is
            deliberately absent — it is its own tab. */}
        {!isArchived ? (
          <div
            className="cc-roster-segmented"
            role="group"
            aria-label="Filter by membership status"
          >
            {ACTIVE_FILTERS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`cc-roster-seg${
                  activeFilter === o.value ? ' cc-roster-seg--on' : ''
                }`}
                aria-pressed={activeFilter === o.value}
                onClick={() => setActiveFilter(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}
        <CcMenu
          items={exportItems}
          align="right"
          ariaLabel="Export students"
          disabled={exporting || total === 0}
          triggerClassName="cc-roster-export"
        >
          <Download size={15} />
          <span>{exporting ? 'Exporting…' : 'Export'}</span>
        </CcMenu>
      </div>

      <PeopleTableShell
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        errorTitle="Couldn’t load students"
        errorText="Something went wrong fetching your students."
        skeletonColumns={6}
        skeletonRows={8}
      >
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
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t, range) =>
              `${range[0]}–${range[1]} of ${t.toLocaleString()}`,
            position: ['bottomRight'],
          }}
          locale={{
            emptyText: (
              <PeopleEmpty
                icon={<Users size={22} />}
                title={
                  isArchived ? 'Nothing archived' : 'No students found'
                }
                text={
                  search
                    ? 'Try a different search.'
                    : isArchived
                      ? 'Students you archive will be kept here.'
                      : activeFilter === 'invited'
                        ? 'No invited students are waiting to accept. Check the Invitations tab.'
                        : 'This organization has no active students yet.'
                }
              />
            ),
          }}
        />
      </PeopleTableShell>

      {/* ── Move to branch modal ── */}
      <Modal
        title={moveTarget ? `Move ${moveTarget.name} to a branch` : 'Move to branch'}
        open={!!moveTarget}
        onCancel={() => setMoveTarget(null)}
        onOk={submitMove}
        okText="Move"
        confirmLoading={movingBranch}
        okButtonProps={{ disabled: !moveBranchId }}
        destroyOnClose
      >
        <p className="cc-roster-transfer-lead">
          Change which branch of <b>{org?.name ?? 'this organization'}</b> this
          student belongs to. Everything else about them stays the same.
        </p>
        <div className="cc-roster-transfer-field">
          <label className="cc-roster-transfer-label">Branch</label>
          <Select
            style={{ width: '100%' }}
            value={moveBranchId}
            onChange={(v) => setMoveBranchId(v)}
            options={moveOptions}
            placeholder="Select a branch"
          />
        </div>
      </Modal>

      {/* ── Transfer student modal ── */}
      <Modal
        title={
          transferTarget ? `Transfer ${transferTarget.name}` : 'Transfer student'
        }
        open={!!transferTarget}
        onCancel={() => setTransferTarget(null)}
        onOk={submitTransfer}
        okText="Transfer"
        confirmLoading={transferring}
        okButtonProps={{ disabled: !transferOrgId }}
        destroyOnClose
      >
        <p className="cc-roster-transfer-lead">
          Move this student to another organization you manage. Their membership
          in <b>{org?.name ?? 'this organization'}</b> will be archived, and they’ll
          become active in the destination organization. They keep their TopCoach
          account, applications and learning history.
        </p>
        <div className="cc-roster-transfer-field">
          <label className="cc-roster-transfer-label">
            Destination organization
          </label>
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

export default StudentRosterTab;
