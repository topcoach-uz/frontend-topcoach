import { useState } from 'react';
import { message } from 'antd';
import { CcMenu, type CcMenuItem } from '../components/CcMenu';
import {
  BarChart3,
  Building2,
  Download,
  DownloadCloud,
  FileSpreadsheet,
  FileText,
  GraduationCap,
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
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN, LANGUAGE } from 'src/constants/storage';
import './ReportsPage.scss';

type ReportKey = 'roster' | 'programs' | 'engagement';
type ExportFormat = 'excel' | 'csv' | 'pdf';
/** Report types the backend can generate server-side (`GET .../reports/:type`). */
type ServerReportType = 'roster' | 'progress';
type ServerFormat = 'csv' | 'xlsx';

interface Dataset {
  /** Ordered column headers. */
  columns: string[];
  /** Row objects keyed by the column headers. */
  rows: Record<string, string | number>[];
}

const REPORTS: {
  key: ReportKey;
  title: string;
  description: string;
  icon: JSX.Element;
  tone: 'info' | 'good' | 'accent';
  /** When set, this card also offers a server-generated download. */
  serverType?: ServerReportType;
}[] = [
  {
    key: 'roster',
    title: 'Students',
    description:
      'One row per student: name, email, grade, the programs they’re in, progress, and last login. A full student list to review offline or share with your team.',
    icon: <Users size={18} />,
    tone: 'info',
    serverType: 'roster',
  },
  {
    key: 'programs',
    title: 'Program progress',
    description:
      'Each student’s completion in every program they’re enrolled in (Admissions, SAT, Full Support, Research), showing who’s ahead, who’s behind, and the average per program.',
    icon: <GraduationCap size={18} />,
    tone: 'good',
    serverType: 'progress',
  },
  {
    key: 'engagement',
    title: 'Engagement',
    description:
      'Each student’s last-active date and how recently they logged in, so you can spot who’s gone quiet and follow up.',
    icon: <BarChart3 size={18} />,
    tone: 'accent',
  },
];

/**
 * Basenames used for downloaded files. Kept separate from the internal
 * `ReportKey` / `ServerReportType` unions because the user sees these.
 */
const FILE_SLUGS: Record<ReportKey, string> = {
  roster: 'students',
  programs: 'programs',
  engagement: 'engagement',
};

const SERVER_FILE_SLUGS: Record<ServerReportType, string> = {
  roster: 'students',
  progress: 'progress',
};

/**
 * Largest `limit` the roster endpoint accepts — `GetOrgRosterQueryDto` declares
 * `@Max(100)` and the global ValidationPipe 400s anything above it. Full-roster
 * pulls must page, never ask for one oversized page.
 */
const ROSTER_MAX_LIMIT = 100;
/** Safety net so a bad `total`/`items` pairing can't spin forever. */
const ROSTER_MAX_PAGES = 200;

function round(n: number | null | undefined): number {
  return Math.round(Number(n ?? 0));
}

/** Pull the attachment filename out of a Content-Disposition header, if any. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  // RFC 5987 `filename*=UTF-8''...` takes precedence over a plain `filename=`.
  const star = /filename\*=(?:UTF-8'')?["']?([^"';\n]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }
  const plain = /filename="?([^"';\n]+)"?/i.exec(header);
  return plain?.[1] ?? null;
}

/** Trigger a browser download for an in-memory blob. */
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CounselorConsoleReportsPage() {
  const { orgId, org } = useCounselorConsole();
  const dispatch = useAppDispatch();

  // Which report is currently exporting client-side (null when idle).
  const [busy, setBusy] = useState<ReportKey | null>(null);
  // Which server-download is in flight (null when idle) — keyed by report type.
  const [serverBusy, setServerBusy] = useState<ServerReportType | null>(null);

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-page-eyebrow">
        <span className="cc-page-eyebrow-accent">Insights</span>
        {org ? <span>· {org.name}</span> : null}
      </div>
      <h1 className="cc-page-title">Reports</h1>
      <p className="cc-page-lead">
        Export your organization’s data for board decks, spreadsheets and offline
        review. Every report pulls the latest figures at the moment you download.
      </p>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-reports">
        {header}
        <div className="cc-placeholder">
          <Building2 size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Select an organization</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to export its reports.
          </div>
        </div>
      </div>
    );
  }

  // ── Data loaders (pull the full dataset on demand) ──

  /**
   * Walk the roster endpoint page by page at the maximum allowed page size and
   * collect every student. Stops once we've seen `total` rows, once a page
   * comes back short/empty, or at the hard page cap.
   */
  async function fetchAllStudents(): Promise<OrgStudent[]> {
    const all: OrgStudent[] = [];
    let total = Infinity;

    for (let page = 1; page <= ROSTER_MAX_PAGES; page++) {
      const res = await dispatch(
        counselorConsoleApi.endpoints.getOrgStudents.initiate({
          orgId: orgId as string,
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
    const rows = students.map((s: OrgStudent) => ({
      Name: s.name,
      Email: s.email,
      Grade: s.gradeLevel ?? '-',
      'Graduation Year': s.graduationYear ?? '-',
      Program: s.programs.length ? s.programs.join(', ') : '-',
      'Progress (%)': round(s.progress),
      'Last Active': s.lastActiveAt ? dayjs(s.lastActiveAt).format('YYYY-MM-DD') : '-',
      Status: s.status,
    }));
    return {
      columns: [
        'Name',
        'Email',
        'Grade',
        'Graduation Year',
        'Program',
        'Progress (%)',
        'Last Active',
        'Status',
      ],
      rows,
    };
  }

  async function loadPrograms(): Promise<Dataset> {
    const analytics = await dispatch(
      counselorConsoleApi.endpoints.getOrgAnalytics.initiate({
        orgId: orgId as string,
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
      const ds = await LOADERS[key]();
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

  // ── Server-generated download ──
  // Fetches the binary attachment the backend renders at
  // `GET /org/:orgId/reports/:type?format=`, reusing the exact auth + base URL
  // the RTK Query client uses (Bearer token + language header), then triggers a
  // browser download from the blob.
  async function downloadServerReport(
    serverType: ServerReportType,
    format: ServerFormat,
  ) {
    if (serverBusy || !orgId) return;
    setServerBusy(serverType);
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const language = localStorage.getItem(LANGUAGE) || 'en';
      const url = `${baseUrl}/org/${encodeURIComponent(
        orgId,
      )}/reports/${serverType}?format=${format}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          language,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const fallback = `${org?.slug ? `${org.slug}_` : ''}${
        SERVER_FILE_SLUGS[serverType]
      }.${format}`;
      const filename =
        filenameFromDisposition(res.headers.get('content-disposition')) ||
        fallback;
      triggerBlobDownload(blob, filename);
    } catch (err) {
      console.error(
        `[reports] server download failed (type=${serverType}, format=${format})`,
        err,
      );
      message.error('Could not download that report. Please try again.');
    } finally {
      setServerBusy(null);
    }
  }

  const serverMenu = (serverType: ServerReportType): CcMenuItem[] => [
    {
      key: 'xlsx',
      label: 'Download as Excel',
      icon: <FileSpreadsheet size={15} />,
      onClick: () => downloadServerReport(serverType, 'xlsx'),
    },
    {
      key: 'csv',
      label: 'Download as CSV',
      icon: <TableIcon size={15} />,
      onClick: () => downloadServerReport(serverType, 'csv'),
    },
  ];

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
    </div>
  );
}
