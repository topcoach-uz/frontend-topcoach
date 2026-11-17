import { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { CcMenu, type CcMenuItem } from '../components/CcMenu';
import { NoOrgPlaceholder } from '../components/CcEmpty';
import { CcPageHead } from '../components/CcPageHead';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Inbox,
  Loader2,
  Table as TableIcon,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { useAppDispatch } from 'src/app/store';
import {
  counselorConsoleApi,
  type OrgStudent,
} from 'src/app/services/counselorConsoleApi';
import './ReportsPage.scss';

type ReportKey = 'roster' | 'programs' | 'engagement';
type ExportFormat = 'excel' | 'csv' | 'pdf';

interface Dataset {
  /** Ordered column headers. */
  columns: string[];
  /** Row objects keyed by the column headers. */
  rows: Record<string, string | number>[];
}

/**
 * What a preview load produced.
 *
 * `complete` distinguishes a cheap sample (the students preview asks for a
 * single 10-row page) from a dataset that already holds every row (programs and
 * engagement come from one analytics call). Only a complete dataset may be
 * reused for an export — a sample would silently truncate the file.
 */
interface PreviewResult {
  ds: Dataset;
  /** True row count on the server, which may exceed `ds.rows.length`. */
  total: number;
  complete: boolean;
}

type PreviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: PreviewResult };

const REPORTS: {
  key: ReportKey;
  title: string;
  description: string;
  icon: JSX.Element;
  tone: 'info' | 'good' | 'accent';
}[] = [
  {
    key: 'roster',
    title: 'Students',
    description:
      'One row per student: name, email, grade, the programs they’re in, progress, and last login. A full student list to review offline or share with your team.',
    icon: <Users size={18} />,
    tone: 'info',
  },
  {
    key: 'programs',
    title: 'Program progress',
    description:
      'One row per program (Admissions, SAT, Full Support, Research) with how many students are enrolled, how many have finished, and the average progress across the program.',
    icon: <GraduationCap size={18} />,
    tone: 'good',
  },
  {
    key: 'engagement',
    title: 'Engagement',
    description:
      'Messages sent, weekly active students, and how recently students were last active, so you can spot who’s gone quiet and follow up.',
    icon: <BarChart3 size={18} />,
    tone: 'accent',
  },
];

/**
 * Basenames used for downloaded files. Kept separate from the internal
 * `ReportKey` union because the user sees these.
 */
const FILE_SLUGS: Record<ReportKey, string> = {
  roster: 'students',
  programs: 'programs',
  engagement: 'engagement',
};

/**
 * Largest `limit` the roster endpoint accepts — `GetOrgRosterQueryDto` declares
 * `@Max(100)` and the global ValidationPipe 400s anything above it. Full-roster
 * pulls must page, never ask for one oversized page.
 */
const ROSTER_MAX_LIMIT = 100;
/** Safety net so a bad `total`/`items` pairing can't spin forever. */
const ROSTER_MAX_PAGES = 200;
/** How many rows the preview shows (and, for students, how many it fetches). */
const PREVIEW_ROWS = 10;

const ROSTER_COLUMNS = [
  'Name',
  'Email',
  'Grade',
  'Graduation Year',
  'Program',
  'Progress (%)',
  'Last Active',
  'Status',
];

function round(n: number | null | undefined): number {
  return Math.round(Number(n ?? 0));
}

function rosterRow(s: OrgStudent): Record<string, string | number> {
  return {
    Name: s.name,
    Email: s.email,
    Grade: s.gradeLevel ?? '-',
    'Graduation Year': s.graduationYear ?? '-',
    Program: s.programs.length ? s.programs.join(', ') : '-',
    'Progress (%)': round(s.progress),
    'Last Active': s.lastActiveAt ? dayjs(s.lastActiveAt).format('YYYY-MM-DD') : '-',
    Status: s.status,
  };
}

export default function CounselorConsoleReportsPage() {
  const { orgId, org, branchId } = useCounselorConsole();
  const dispatch = useAppDispatch();

  // Which report is currently exporting client-side (null when idle).
  const [busy, setBusy] = useState<ReportKey | null>(null);
  // Which report's preview modal is open (null when closed).
  const [previewKey, setPreviewKey] = useState<ReportKey | null>(null);
  const [previews, setPreviews] = useState<
    Partial<Record<ReportKey, PreviewState>>
  >({});
  /**
   * Datasets known to hold EVERY row, so a later export can skip the refetch.
   * Populated by a completed export and by previews whose loader is complete.
   */
  const [fullData, setFullData] = useState<Partial<Record<ReportKey, Dataset>>>(
    {},
  );

  // Cached rows belong to one organization; drop them when the switcher moves.
  useEffect(() => {
    setPreviews({});
    setFullData({});
    setPreviewKey(null);
  }, [orgId, branchId]);

  const header = (
    <CcPageHead
      eyebrow="Insights"
      orgName={org?.name}
      title="Reports"
      lead="Export your organization’s data for board decks, spreadsheets and offline review. Preview a report first to check what’s in it, then download."
    />
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-reports">
        {header}
        <NoOrgPlaceholder
            title="Select an organization"
            text="Choose an organization from the switcher to export its reports."
          />
      </div>
    );
  }

  // ── Data loaders (pull the full dataset on demand) ──

  /**
   * Walk the roster endpoint page by page at the maximum allowed page size and
   * collect every student. Stops once we've seen `total` rows, once a page
   * comes back short/empty, or at the hard page cap.
   *
   * This is an export-only path: it can issue up to 200 requests. Previews use
   * `previewRoster` instead.
   */
  async function fetchAllStudents(): Promise<OrgStudent[]> {
    const all: OrgStudent[] = [];
    let total = Infinity;

    for (let page = 1; page <= ROSTER_MAX_PAGES; page++) {
      const res = await dispatch(
        counselorConsoleApi.endpoints.getOrgStudents.initiate({
          orgId: orgId as string,
          branchId,
          page,
          limit: ROSTER_MAX_LIMIT,
        }),
      ).unwrap();

      const items = res.items ?? [];
      all.push(...items);

      // Trust `total` from the first response, but only if it looks sane.
      if (page === 1 && Number.isFinite(res.total) && res.total >= 0) {
        total = res.total;
      }
      // A short or empty page means the server has nothing more to give,
      // regardless of what `total` claimed.
      if (items.length < ROSTER_MAX_LIMIT || all.length >= total) break;
    }

    return all;
  }

  async function loadRoster(): Promise<Dataset> {
    const students = await fetchAllStudents();
    return { columns: ROSTER_COLUMNS, rows: students.map(rosterRow) };
  }

  async function loadPrograms(): Promise<Dataset> {
    const analytics = await dispatch(
      counselorConsoleApi.endpoints.getOrgAnalytics.initiate({
        orgId: orgId as string,
        branchId,
        range: '365d',
      }),
    ).unwrap();
    const rows = (analytics.programs?.byProgram ?? []).map((p) => ({
      Program: p.program,
      Enrolled: p.enrolled,
      Completed: p.completed,
      'Avg Progress (%)': round(p.avgProgress),
    }));
    return {
      columns: ['Program', 'Enrolled', 'Completed', 'Avg Progress (%)'],
      rows,
    };
  }

  async function loadEngagement(): Promise<Dataset> {
    const analytics = await dispatch(
      counselorConsoleApi.endpoints.getOrgAnalytics.initiate({
        orgId: orgId as string,
        branchId,
        range: '365d',
      }),
    ).unwrap();
    const weekly = (analytics.engagement?.weeklyActive ?? []).map((w) => ({
      Metric: `Week of ${w.week}`,
      Value: w.count,
    }));
    const cohorts = (analytics.engagement?.lastActiveCohorts ?? []).map((c) => ({
      Metric: `Last active: ${c.cohort}`,
      Value: c.count,
    }));
    const rows = [
      { Metric: 'Messages sent', Value: analytics.engagement?.messagesSent ?? 0 },
      ...weekly,
      ...cohorts,
    ];
    return { columns: ['Metric', 'Value'], rows };
  }

  const LOADERS: Record<ReportKey, () => Promise<Dataset>> = {
    roster: loadRoster,
    programs: loadPrograms,
    engagement: loadEngagement,
  };

  // ── Preview loaders (deliberately cheap) ──

  /**
   * One page of `PREVIEW_ROWS` students plus the server's `total`. Never calls
   * `fetchAllStudents` — previewing must not drag thousands of rows over the
   * wire just to render ten of them.
   */
  async function previewRoster(): Promise<PreviewResult> {
    const res = await dispatch(
      counselorConsoleApi.endpoints.getOrgStudents.initiate({
        orgId: orgId as string,
        branchId,
        page: 1,
        limit: PREVIEW_ROWS,
      }),
    ).unwrap();
    const items = res.items ?? [];
    const total =
      Number.isFinite(res.total) && res.total >= 0 ? res.total : items.length;
    return {
      ds: { columns: ROSTER_COLUMNS, rows: items.map(rosterRow) },
      total,
      // A sample, not the whole list — unless the org happens to fit in a page.
      complete: total <= items.length,
    };
  }

  /** Programs and engagement are a single analytics call, so preview = full. */
  async function previewWhole(key: ReportKey): Promise<PreviewResult> {
    const ds = fullData[key] ?? (await LOADERS[key]());
    return { ds, total: ds.rows.length, complete: true };
  }

  const PREVIEW_LOADERS: Record<ReportKey, () => Promise<PreviewResult>> = {
    roster: previewRoster,
    programs: () => previewWhole('programs'),
    engagement: () => previewWhole('engagement'),
  };

  async function loadPreview(key: ReportKey) {
    setPreviews((p) => ({ ...p, [key]: { status: 'loading' } }));
    try {
      const result = await PREVIEW_LOADERS[key]();
      setPreviews((p) => ({ ...p, [key]: { status: 'ready', result } }));
      if (result.complete) {
        setFullData((f) => ({ ...f, [key]: result.ds }));
      }
    } catch (err) {
      console.error(`[reports] preview failed (report=${key})`, err);
      setPreviews((p) => ({ ...p, [key]: { status: 'error' } }));
    }
  }

  function openPreview(key: ReportKey) {
    setPreviewKey(key);
    // Re-use an already loaded preview; only fetch when there's nothing yet.
    if (previews[key]?.status !== 'ready') void loadPreview(key);
  }

  function fileBase(key: ReportKey): string {
    const slug = org?.slug ? `${org.slug}_` : '';
    return `${slug}${FILE_SLUGS[key]}_${dayjs().format('YYYY-MM-DD')}`;
  }

  function writeSpreadsheet(
    ds: Dataset,
    key: ReportKey,
    bookType: 'xlsx' | 'csv',
  ) {
    const ws = XLSX.utils.json_to_sheet(ds.rows, { header: ds.columns });
    ws['!cols'] = ds.columns.map((c) => ({ wch: Math.max(12, c.length + 4) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${fileBase(key)}.${bookType}`, { bookType });
  }

  function writePdf(ds: Dataset, key: ReportKey, title: string) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${title}: ${org?.name ?? 'Organization'}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated ${dayjs().format('MMM D, YYYY')}`, 14, 30);
    autoTable(doc, {
      head: [ds.columns],
      body: ds.rows.map((r) => ds.columns.map((c) => String(r[c] ?? '-'))),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [123, 31, 47] }, // brand maroon
      alternateRowStyles: { fillColor: [246, 243, 236] },
    });
    doc.save(`${fileBase(key)}.pdf`);
  }

  async function runExport(key: ReportKey, format: ExportFormat, title: string) {
    if (busy) return;
    setBusy(key);
    try {
      // Only a dataset known to be complete is reused; a 10-row preview sample
      // never lands in `fullData`, so exports still pull everything.
      const ds = fullData[key] ?? (await LOADERS[key]());
      setFullData((f) => ({ ...f, [key]: ds }));
      if (ds.rows.length === 0) {
        message.warning('There’s no data to export for this report yet.');
        return;
      }
      if (format === 'excel') writeSpreadsheet(ds, key, 'xlsx');
      else if (format === 'csv') writeSpreadsheet(ds, key, 'csv');
      else writePdf(ds, key, title);
    } catch (err) {
      console.error(`[reports] export failed (report=${key}, format=${format})`, err);
      message.error('Could not generate that report. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const exportMenu = (key: ReportKey, title: string): CcMenuItem[] => [
    {
      key: 'excel',
      label: 'Export as Excel',
      icon: <FileSpreadsheet size={15} />,
      onClick: () => runExport(key, 'excel', title),
    },
    {
      key: 'csv',
      label: 'Export as CSV',
      icon: <TableIcon size={15} />,
      onClick: () => runExport(key, 'csv', title),
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FileText size={15} />,
      onClick: () => runExport(key, 'pdf', title),
    },
  ];

  // ── Preview modal body ──

  const previewReport = previewKey
    ? REPORTS.find((r) => r.key === previewKey)
    : undefined;
  const previewState = previewKey ? previews[previewKey] : undefined;

  function renderPreviewBody() {
    if (!previewKey) return null;

    if (!previewState || previewState.status === 'loading') {
      return (
        <div className="cc-preview-state">
          <Loader2 size={20} className="cc-preview-spin" />
          <div className="cc-preview-state-text">Loading a sample…</div>
        </div>
      );
    }

    if (previewState.status === 'error') {
      return (
        <div className="cc-preview-state">
          <AlertTriangle size={20} className="cc-preview-state-ico--bad" />
          <div className="cc-preview-state-title">Could not load the preview</div>
          <div className="cc-preview-state-text">
            Something went wrong fetching this report’s data.
          </div>
          <button
            type="button"
            className="cc-preview-retry"
            onClick={() => void loadPreview(previewKey)}
          >
            Try again
          </button>
        </div>
      );
    }

    const { ds, total } = previewState.result;

    if (ds.rows.length === 0) {
      return (
        <div className="cc-preview-state">
          <Inbox size={20} className="cc-preview-state-ico" />
          <div className="cc-preview-state-title">Nothing to show yet</div>
          <div className="cc-preview-state-text">
            This report has no rows for your organization right now. Once there’s
            data it will appear here.
          </div>
        </div>
      );
    }

    const shown = ds.rows.slice(0, PREVIEW_ROWS);

    return (
      <>
        <div className="cc-preview-scroll">
          <table className="cc-preview-table">
            <thead>
              <tr>
                {ds.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => (
                <tr key={i}>
                  {ds.columns.map((c) => (
                    <td key={c}>{String(row[c] ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cc-preview-foot">
          Showing {shown.length} of {total} {total === 1 ? 'row' : 'rows'}. The
          export includes every row.
        </div>
      </>
    );
  }

  return (
    <div className="cc-reports">
      {header}

      <div className="cc-reports-grid">
        {REPORTS.map((r) => (
          <section key={r.key} className={`cc-reports-card cc-reports-card--${r.tone}`}>
            <span className="cc-reports-ico">{r.icon}</span>
            <h2 className="cc-reports-card-title">{r.title}</h2>
            <p className="cc-reports-card-desc">{r.description}</p>
            <div className="cc-reports-card-actions">
              <button
                type="button"
                className="cc-reports-preview"
                onClick={() => openPreview(r.key)}
              >
                <Eye size={15} />
                <span>Preview</span>
              </button>
              <CcMenu
                items={exportMenu(r.key, r.title)}
                align="left"
                ariaLabel={`Export ${r.title}`}
                disabled={busy === r.key}
                triggerClassName="cc-reports-export"
              >
                <Download size={15} />
                <span>{busy === r.key ? 'Exporting…' : 'Export'}</span>
              </CcMenu>
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={!!previewKey}
        onCancel={() => setPreviewKey(null)}
        title={
          previewReport ? `${previewReport.title} · preview` : 'Report preview'
        }
        width={860}
        footer={null}
        className="cc-preview-modal"
        destroyOnClose
      >
        {renderPreviewBody()}
      </Modal>
    </div>
  );
}
