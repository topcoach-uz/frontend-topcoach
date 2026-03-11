import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Empty, Button, Modal, Space, Dropdown, Progress, Tag, Spin, Collapse } from 'antd';
import { ExpandAltOutlined, DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'src/lib/dayjs';
import { useLazyGetScholarhubLessonProgressAdminQuery } from 'src/app/services/fullSupportApi';

type Payload = unknown;

type SatProgressRow = {
  id: number;
  userId: number;
  courseId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  currentLesson: string;
  lessonOrder: number | null;
  lessonsCompleted: number | null;
  totalLessons: number | null;
  currentStreak: number | null;
  maxStreak: number | null;
  lastLogin: string;
  lastActivity: string;
  tryCount: number | null;
  endTime: string;
  daysRemaining: number | null;
  subscriptionStatus: 'active' | 'expiring_soon' | 'expired';
  score: string;
  createdAt: string;
};

/** Fix duplicated domain in email (e.g. user@gmail.com@gmail.com → user@gmail.com). */
function sanitizeEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  return email.replace(/@([^@]+)@\1$/i, '@$1').replace(/@gmail\.com@gmail\.com$/i, '@gmail.com');
}

/** Compute subscription status and days remaining from end_time. */
function getSubscriptionInfo(endTime: string | null): { daysRemaining: number | null; status: 'active' | 'expiring_soon' | 'expired' } {
  if (!endTime) return { daysRemaining: null, status: 'active' };
  const end = dayjs(endTime);
  const now = dayjs();
  const days = end.diff(now, 'day');
  if (days < 0) return { daysRemaining: 0, status: 'expired' };
  if (days <= 14) return { daysRemaining: days, status: 'expiring_soon' };
  return { daysRemaining: days, status: 'active' };
}

/** Extract rows from ScholarHub course-passing API response. */
function getSatProgressRows(payload: Payload): SatProgressRow[] {
  const inner = payload && typeof payload === 'object' && 'data' in (payload as object)
    ? (payload as { data: unknown }).data
    : null;
  if (!inner || typeof inner !== 'object' || !('data' in (inner as object))) return [];
  const arr = (inner as { data: unknown }).data;
  if (!Array.isArray(arr)) return [];

  return arr.map((r: Record<string, unknown>) => {
    const user = (r.user as Record<string, unknown>) ?? {};
    const course = (r.course as Record<string, unknown>) ?? {};
    const currentLesson = (r.current_lesson as Record<string, unknown>) ?? {};
    const lesson = (currentLesson.lesson as Record<string, unknown>) ?? {};
    const firstName = String(user.first_name ?? '').trim();
    const lastName = String(user.last_name ?? '').trim();
    const name = [firstName, lastName].filter(Boolean).join(' ') || String(user.name ?? user.email ?? '—');
    const email = sanitizeEmail(String(user.email ?? '').trim());
    const lessonOrder = typeof currentLesson.order === 'number' ? currentLesson.order : null;
    const complete = typeof user.complete === 'number' ? user.complete : null;
    const streak = typeof user.streak === 'number' ? user.streak : null;
    const maxStreak = typeof user.max_streak === 'number' ? user.max_streak : null;
    const lastLoginAt = user.last_login_at;
    const updatedAt = currentLesson.updated_at ?? r.updated_at;
    const tryCount = typeof r.try_count === 'number' ? r.try_count : null;
    const endTimeStr = r.end_time ? String(r.end_time) : null;
    const { daysRemaining, status } = getSubscriptionInfo(endTimeStr);
    return {
      id: Number(r.id ?? 0),
      userId: Number(r.user_id ?? 0),
      courseId: Number(r.course_id ?? 0),
      studentName: name,
      studentEmail: email,
      courseName: String(course.name ?? '—'),
      currentLesson: String(lesson.name ?? '—'),
      lessonOrder,
      lessonsCompleted: complete,
      totalLessons: null,
      currentStreak: streak,
      maxStreak: maxStreak,
      lastLogin: lastLoginAt ? dayjs(String(lastLoginAt)).format('MMM D, YYYY h:mm A') : '—',
      lastActivity: updatedAt ? dayjs(String(updatedAt)).format('MMM D, YYYY h:mm A') : '—',
      tryCount,
      endTime: endTimeStr ? dayjs(endTimeStr).format('MMM D, YYYY') : '—',
      daysRemaining,
      subscriptionStatus: status,
      score: typeof r.score === 'number' && typeof r.max_score === 'number' && r.max_score > 0
        ? `${r.score} / ${r.max_score}`
        : typeof r.score === 'number'
          ? String(r.score)
          : '—',
      createdAt: r.created_at ? dayjs(String(r.created_at)).format('MMM D, YYYY') : '—',
    };
  });
}

type LessonItem = { lesson: string; status: string; score?: string; completedAt?: string; tryCount?: number; timeSpent?: string };

/**
 * Map raw lesson + passing info to a normalized status string.
 *
 * Rules for ScholarHub:
 * - Completed: passing.is_complete == 1 OR complete_date exists
 * - In progress: has a passing record with any progress (percentage/score/time) but not completed
 * - Locked: status === 0 OR enabled === 0
 * - Not started: everything else
 */
function mapLessonStatus(lesson: Record<string, unknown>, passing?: Record<string, unknown>): string {
  const rawStatus = lesson.status;
  const enabled = lesson.enabled;

  const completedAt =
    passing?.complete_date ??
    lesson.complete_date ??
    lesson.completed_at;

  const isComplete = passing?.is_complete;

  const percentage =
    typeof passing?.percentage === 'number'
      ? passing.percentage
      : typeof lesson.percentage === 'number'
        ? lesson.percentage
        : null;

  const score =
    typeof passing?.score === 'number'
      ? passing.score
      : typeof lesson.score === 'number'
        ? lesson.score
        : null;

  const time =
    typeof passing?.time === 'number'
      ? passing.time
      : typeof lesson.time === 'number'
        ? lesson.time
        : null;

  const hasProgress =
    (typeof percentage === 'number' && percentage > 0) ||
    (typeof score === 'number' && score > 0) ||
    (typeof time === 'number' && time > 0);

  if (isComplete === 1 || isComplete === '1' || completedAt) return 'Completed';
  if (hasProgress) return 'In progress';
  if (
    rawStatus === 0 ||
    rawStatus === '0' ||
    enabled === 0 ||
    enabled === '0'
  ) {
    return 'Locked';
  }
  return 'Not started';
}

function toLessonItem(raw: Record<string, unknown>): LessonItem {
  // Some payloads nest lesson data under "lesson", others have it at the top level.
  const lesson = (raw.lesson as Record<string, unknown>) ?? raw;
  const passing =
    (raw.passing as Record<string, unknown>) ??
    (lesson.passing as Record<string, unknown>) ??
    undefined;

  const statusStr = mapLessonStatus(lesson, passing);

  // Prefer time from passing, then from raw/lesson fallback fields.
  const timeValueRaw =
    (passing?.time as unknown) ??
    raw.time ??
    lesson.time ??
    raw.duration ??
    lesson.duration;

  let timeSpent: string | undefined;
  if (timeValueRaw != null) {
    if (typeof timeValueRaw === 'number') {
      const totalSeconds = timeValueRaw;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      timeSpent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      timeSpent = String(timeValueRaw);
    }
  }

  const scoreNum =
    typeof passing?.score === 'number'
      ? passing.score
      : typeof raw.score === 'number'
        ? raw.score
        : typeof lesson.score === 'number'
          ? lesson.score
          : undefined;

  const maxScoreNum =
    typeof passing?.max_score === 'number'
      ? passing.max_score
      : typeof raw.max_score === 'number'
        ? raw.max_score
        : typeof lesson.max_score === 'number'
          ? lesson.max_score
          : undefined;

  let score: string | undefined;
  if (typeof scoreNum === 'number' && typeof maxScoreNum === 'number' && maxScoreNum > 0) {
    score = `${scoreNum}/${maxScoreNum}`;
  } else if (typeof scoreNum === 'number') {
    score = String(scoreNum);
  }

  const completedRaw =
    passing?.complete_date ??
    raw.complete_date ??
    lesson.complete_date ??
    raw.completed_at ??
    lesson.completed_at;

  const tryCount =
    typeof passing?.try_count === 'number'
      ? passing.try_count
      : typeof raw.try_count === 'number'
        ? raw.try_count
        : typeof lesson.try_count === 'number'
          ? lesson.try_count
          : undefined;

  return {
    lesson: String(lesson.name ?? raw.name ?? '—'),
    status: statusStr,
    score,
    completedAt: completedRaw ? dayjs(String(completedRaw)).format('MMM D, YYYY') : undefined,
    tryCount,
    timeSpent,
  };
}

export type SubmoduleNode = { id: number; name: string; lessons: LessonItem[] };
export type ModuleNode = { id: number; name: string; submodules: SubmoduleNode[]; lessons: LessonItem[] };

/** Parse lesson-passing response. Returns hierarchy: Course → Module → Submodule → Lessons. */
function parseLessonProgress(data: unknown): {
  lessons: LessonItem[];
  total: number;
  modules: ModuleNode[];
} {
  if (!data || typeof data !== 'object') return { lessons: [], total: 0, modules: [] };
  const obj = data as Record<string, unknown>;

  // 1. Full hierarchy: modules[].submodules[].lessons
  const modulesArr = (obj.modules ?? obj.sections) as Record<string, unknown>[] | undefined;
  if (Array.isArray(modulesArr) && modulesArr.length > 0) {
    const modules: ModuleNode[] = [];
    let total = 0;
    for (let i = 0; i < modulesArr.length; i++) {
      const mod = modulesArr[i] as Record<string, unknown>;
      const modId = typeof mod.id === 'number' ? mod.id : i + 1;
      const modName = String(mod.name ?? mod.title ?? `Module ${modId}`).trim();
      const submodulesArr = (mod.submodules ?? mod.subs) as Record<string, unknown>[] | undefined;
      const directLessons = Array.isArray(mod.lessons) ? (mod.lessons as Record<string, unknown>[]) : [];

      const submodules: SubmoduleNode[] = [];
      if (Array.isArray(submodulesArr) && submodulesArr.length > 0) {
        for (let j = 0; j < submodulesArr.length; j++) {
          const sub = submodulesArr[j] as Record<string, unknown>;
          const subId = typeof sub.id === 'number' ? sub.id : j + 1;
          const subName = String(sub.name ?? sub.title ?? `Submodule ${subId}`).trim();
          const subLessons = Array.isArray(sub.lessons) ? (sub.lessons as Record<string, unknown>[]) : [];
          const lessons = subLessons.map((l) => toLessonItem(l as Record<string, unknown>));
          total += lessons.length;
          submodules.push({ id: subId, name: subName, lessons });
        }
      }
      const modLessons = directLessons.map((l) => toLessonItem(l as Record<string, unknown>));
      total += modLessons.length;
      modules.push({ id: modId, name: modName, submodules, lessons: modLessons });
    }
    const allLessons = modules.flatMap((m) => [...m.lessons, ...m.submodules.flatMap((s) => s.lessons)]);
    return { lessons: allLessons, total, modules };
  }

  // 2. sections[].lessons (section = module, no submodule)
  const sectionsArr = obj.sections as Record<string, unknown>[] | undefined;
  if (Array.isArray(sectionsArr) && sectionsArr.length > 0) {
    const modules: ModuleNode[] = [];
    let total = 0;
    for (let i = 0; i < sectionsArr.length; i++) {
      const sec = sectionsArr[i] as Record<string, unknown>;
      const secId = typeof sec.id === 'number' ? sec.id : i + 1;
      const secName = String(sec.name ?? sec.title ?? `Module ${secId}`).trim();
      const lessonsArr = Array.isArray(sec.lessons) ? (sec.lessons as Record<string, unknown>[]) : [];
      const lessons = lessonsArr.map((l) => toLessonItem(l as Record<string, unknown>));
      total += lessons.length;
      modules.push({ id: secId, name: secName, submodules: [], lessons });
    }
    const allLessons = modules.flatMap((m) => m.lessons);
    return { lessons: allLessons, total, modules };
  }

  // 3. Flat data[] with section_id, submodule_id
  let arr: Record<string, unknown>[] = [];
  if (Array.isArray(obj.data)) arr = obj.data as Record<string, unknown>[];
  else if (Array.isArray(data)) arr = data as Record<string, unknown>[];
  if (arr.length === 0) return { lessons: [], total: 0, modules: [] };
  // 3a. data[] where each item is actually a module with lessons[]
  if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0].lessons)) {
    const modules: ModuleNode[] = [];
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
      const mod = arr[i] as Record<string, unknown>;
      const modId = typeof mod.id === 'number' ? mod.id : i + 1;
      const modName = String(mod.name ?? mod.title ?? `Module ${modId}`).trim();
      const lessonsArr = Array.isArray(mod.lessons) ? (mod.lessons as Record<string, unknown>[]) : [];
      const modLessons = lessonsArr.map((l) => toLessonItem(l as Record<string, unknown>));
      total += modLessons.length;
      modules.push({ id: modId, name: modName, submodules: [], lessons: modLessons });
    }
    const allLessons = modules.flatMap((m) => m.lessons);
    return { lessons: allLessons, total, modules };
  }

  const modMap = new Map<number, { name: string; subMap: Map<number, { name: string; lessons: LessonItem[] }>; lessons: LessonItem[] }>();
  for (const item of arr) {
    const lesson = toLessonItem(item);
    const modId = typeof item.section_id === 'number' ? item.section_id : typeof (item.lesson as Record<string, unknown>)?.section_id === 'number' ? (item.lesson as Record<string, unknown>).section_id : 0;
    const subId = typeof item.submodule_id === 'number' ? item.submodule_id : typeof (item.lesson as Record<string, unknown>)?.submodule_id === 'number' ? (item.lesson as Record<string, unknown>).submodule_id : 0;
    const section = (item.section as Record<string, unknown>) ?? ((item.lesson as Record<string, unknown>)?.section as Record<string, unknown>);
    const submodule = (item.submodule as Record<string, unknown>) ?? ((item.lesson as Record<string, unknown>)?.submodule as Record<string, unknown>);
    const modName = String(section?.name ?? section?.title ?? `Module ${modId}`).trim() || `Module ${modId}`;
    const subName = String(submodule?.name ?? submodule?.title ?? `Submodule ${subId}`).trim() || `Submodule ${subId}`;

    if (!modMap.has(modId)) modMap.set(modId, { name: modName, subMap: new Map(), lessons: [] });
    const mod = modMap.get(modId)!;
    if (subId > 0) {
      if (!mod.subMap.has(subId)) mod.subMap.set(subId, { name: subName, lessons: [] });
      mod.subMap.get(subId)!.lessons.push(lesson);
    } else {
      mod.lessons.push(lesson);
    }
  }

  const modules: ModuleNode[] = Array.from(modMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([modId, { name, subMap, lessons }]) => ({
      id: modId,
      name,
      submodules: Array.from(subMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([subId, { name: subName, lessons: ls }]) => ({ id: subId, name: subName, lessons: ls })),
      lessons,
    }));
  const allLessons = modules.flatMap((m) => [...m.lessons, ...m.submodules.flatMap((s) => s.lessons)]);
  return { lessons: allLessons, total: allLessons.length, modules };
}

export type SatProgressAdminTableProps = {
  payload: Payload;
  emptyText?: string;
  viewRawLabel?: string;
  pageSummary?: (current: number, last: number, total: number) => string;
};

export function SatProgressAdminTable({
  payload,
  emptyText = 'No student progress records yet.',
  viewRawLabel = 'View raw response',
  pageSummary,
}: SatProgressAdminTableProps) {
  const { t } = useTranslation();
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [lessonCache, setLessonCache] = useState<Record<string, { data: unknown; loading?: boolean; total?: number }>>({});
  const [fetchLessonProgress] = useLazyGetScholarhubLessonProgressAdminQuery();
  const rows = getSatProgressRows(payload);

  const inner = payload && typeof payload === 'object' && 'data' in (payload as object)
    ? (payload as { data: Record<string, unknown> }).data
    : null;
  const meta = inner && typeof inner === 'object' ? inner : null;
  const total = typeof meta?.total === 'number' ? meta.total : rows.length;
  const currentPage = typeof meta?.current_page === 'number' ? meta.current_page : 1;
  const lastPage = typeof meta?.last_page === 'number' ? meta.last_page : 1;

  const paginationSummary =
    pageSummary ? pageSummary(currentPage, lastPage, total) : `Page ${currentPage} of ${lastPage} · ${total} record${total !== 1 ? 's' : ''}`;

  const handleExpand = async (expanded: boolean, record: SatProgressRow) => {
    const key = `${record.userId}-${record.courseId}`;
    if (expanded && !lessonCache[key]) {
      setLessonCache((c) => ({ ...c, [key]: { loading: true } }));
      try {
        const res = await fetchLessonProgress({ scholarhubUserId: String(record.userId), courseId: String(record.courseId) }).unwrap();
        const { total: parsedTotal } = parseLessonProgress(res?.data);
        const completed = record.lessonsCompleted ?? 0;
        const total = Math.max(parsedTotal, completed) || parsedTotal || null;
        setLessonCache((c) => ({ ...c, [key]: { data: res?.data, total } }));
      } catch {
        setLessonCache((c) => ({ ...c, [key]: { data: null } }));
      }
    }
  };

  const getRowTotalLessons = (r: SatProgressRow) => lessonCache[`${r.userId}-${r.courseId}`]?.total ?? r.totalLessons ?? null;

  const exportToExcel = () => {
    const headers = ['Student', 'Email', 'Course', 'Current Lesson', 'Lessons Done', 'Progress', 'Streak', 'Max Streak', 'Last Login', 'Last Activity', 'Days Left', 'Status', 'Try Count', 'End Time', 'Score', 'Enrolled'];
    const data = rows.map((r) => {
      const total = getRowTotalLessons(r);
      const pct = r.lessonsCompleted != null && total != null && total > 0 ? `${Math.round((r.lessonsCompleted / total) * 100)}%` : '—';
      return [
        r.studentName,
        r.studentEmail,
        r.courseName,
        r.currentLesson,
        r.lessonsCompleted ?? '—',
        pct,
        r.currentStreak ?? '—',
        r.maxStreak ?? '—',
        r.lastLogin,
        r.lastActivity,
        r.daysRemaining ?? '—',
        r.subscriptionStatus,
        r.tryCount ?? '—',
        r.endTime,
        r.score,
        r.createdAt,
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SAT Progress');
    const fileName = `sat_progress_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(139, 0, 0);
    doc.text('SAT Progress — All Students', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${dayjs().format('MMM D, YYYY')}`, 14, 25);
    doc.setTextColor(0, 0, 0);

    const tableData = rows.map((r) => [
      r.studentName,
      r.courseName,
      r.currentLesson,
      r.lessonsCompleted ?? '—',
      r.currentStreak ?? '—',
      r.daysRemaining ?? '—',
      r.subscriptionStatus,
      r.lastActivity,
      r.endTime,
      r.score,
    ]);

    autoTable(doc, {
      head: [['Student', 'Course', 'Current Lesson', 'Done', 'Streak', 'Days Left', 'Status', 'Last Activity', 'End Time', 'Score']],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [139, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const fileName = `sat_progress_${dayjs().format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
  };

  const exportMenuItems: MenuProps['items'] = [
    { key: 'excel', label: t('fullSupport.satExportExcel', 'Export as Excel'), icon: <FileExcelOutlined />, onClick: exportToExcel },
    { key: 'pdf', label: t('fullSupport.satExportPdf', 'Export as PDF'), icon: <FilePdfOutlined />, onClick: exportToPDF },
  ];

  const progressPercent = (r: SatProgressRow) => {
    let total = getRowTotalLessons(r) ?? r.totalLessons ?? null;
    const done = r.lessonsCompleted ?? 0;
    if (done === 0) return null;
    if (total == null || total === 0) return null;
    if (total < done) total = done;
    return Math.min(100, Math.round((done / total) * 100));
  };

  const statusTag = (status: SatProgressRow['subscriptionStatus']) => {
    const map: Record<SatProgressRow['subscriptionStatus'], { color: string; text: string }> = {
      active: { color: 'green', text: 'Active' },
      expiring_soon: { color: 'orange', text: 'Expiring soon' },
      expired: { color: 'red', text: 'Expired' },
    };
    const { color, text } = map[status];
    return <Tag color={color}>{t(`fullSupport.satStatus.${status}`, text)}</Tag>;
  };

  const columns = [
    { title: t('fullSupport.satColStudent', 'Student'), dataIndex: 'studentName', key: 'studentName', width: 150, ellipsis: true },
    { title: t('fullSupport.satColEmail', 'Email'), dataIndex: 'studentEmail', key: 'studentEmail', width: 170, ellipsis: true },
    { title: t('fullSupport.satColCourse', 'Course'), dataIndex: 'courseName', key: 'courseName', width: 100 },
    { title: t('fullSupport.satColCurrentLesson', 'Current Lesson'), dataIndex: 'currentLesson', key: 'currentLesson', width: 150, ellipsis: true },
    {
      title: t('fullSupport.satColProgress', 'Progress'),
      key: 'progress',
      width: 140,
      render: (_: unknown, r: SatProgressRow) => {
        const done = r.lessonsCompleted ?? 0;
        let total = getRowTotalLessons(r) ?? r.totalLessons ?? null;
        if (total != null && total > 0 && total < done) total = done;
        const pct = progressPercent(r);
        const label =
          total != null && total > 0
            ? `${done} / ${total}`
            : done > 0
              ? `${done} / ?`
              : '—';
        if (pct != null) return <Progress percent={pct} size="small" format={() => label} />;
        return label;
      },
    },
    { title: t('fullSupport.satColStreak', 'Streak'), dataIndex: 'currentStreak', key: 'currentStreak', width: 65, render: (v: number | null) => v ?? '—' },
    { title: t('fullSupport.satColMaxStreak', 'Max Streak'), dataIndex: 'maxStreak', key: 'maxStreak', width: 85, render: (v: number | null) => v ?? '—' },
    { title: t('fullSupport.satColLastLogin', 'Last Login'), dataIndex: 'lastLogin', key: 'lastLogin', width: 130 },
    { title: t('fullSupport.satColLastActivity', 'Last Activity'), dataIndex: 'lastActivity', key: 'lastActivity', width: 130 },
    {
      title: t('fullSupport.satColSubscription', 'Subscription'),
      key: 'subscription',
      width: 130,
      render: (_: unknown, r: SatProgressRow) => (
        <span>
          {statusTag(r.subscriptionStatus)}
          {r.daysRemaining != null && r.subscriptionStatus !== 'expired' && (
            <span style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>({r.daysRemaining}d)</span>
          )}
        </span>
      ),
    },
    { title: t('fullSupport.satColTryCount', 'Try Count'), dataIndex: 'tryCount', key: 'tryCount', width: 75, render: (v: number | null) => v ?? '—' },
    { title: t('fullSupport.satColEndTime', 'End Time'), dataIndex: 'endTime', key: 'endTime', width: 105 },
    { title: t('fullSupport.satColScore', 'Score'), dataIndex: 'score', key: 'score', width: 75 },
  ];

  const expandedRowRender = (record: SatProgressRow) => {
    const key = `${record.userId}-${record.courseId}`;
    const cached = lessonCache[key];
    if (cached?.loading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;
    const parsed = cached?.data ? parseLessonProgress(cached.data) : null;
    if (!parsed || parsed.lessons.length === 0) return cached ? <div style={{ padding: 16, color: '#666' }}>{t('fullSupport.satNoLessonData', 'No lesson-level data for this course.')}</div> : null;

    const { modules, lessons } = parsed;
    const lessonColumns = [
      { title: t('fullSupport.satColLesson', 'Lesson'), dataIndex: 'lesson', key: 'lesson', width: 220 },
      { title: t('fullSupport.satColStatus', 'Status'), dataIndex: 'status', key: 'status', width: 110, render: (s: string) => <Tag color={s === 'Completed' ? 'green' : s === 'In progress' ? 'blue' : 'default'}>{s}</Tag> },
      { title: t('fullSupport.satColScore', 'Score'), dataIndex: 'score', key: 'score', width: 90 },
      { title: t('fullSupport.satColTimeSpent', 'Time'), dataIndex: 'timeSpent', key: 'timeSpent', width: 90 },
      { title: t('fullSupport.satColCompletedAt', 'Completed'), dataIndex: 'completedAt', key: 'completedAt', width: 110 },
      { title: t('fullSupport.satColTryCount', 'Tries'), dataIndex: 'tryCount', key: 'tryCount', width: 60 },
    ];

    const renderLessonTable = (data: LessonItem[], keyPrefix: string) => (
      <Table size="small" dataSource={data} rowKey={(_, i) => `${keyPrefix}-${i}`} pagination={false} columns={lessonColumns} />
    );

    if (modules.length > 0) {
      return (
        <Collapse
          defaultActiveKey={modules.map((m) => `mod-${m.id}`)}
          items={modules.map((mod) => {
            const hasSubmodules = mod.submodules.length > 0;
            const children = hasSubmodules ? (
              <Collapse
                size="small"
                defaultActiveKey={mod.submodules.map((s) => `sub-${mod.id}-${s.id}`)}
                items={mod.submodules.map((sub) => ({
                  key: `sub-${mod.id}-${sub.id}`,
                  label: <span style={{ fontWeight: 500 }}>{t('fullSupport.satSubmodule', 'Submodule')}: {sub.name}</span>,
                  children: sub.lessons.length > 0 ? renderLessonTable(sub.lessons, `sub-${mod.id}-${sub.id}`) : <div style={{ padding: 8, color: '#999' }}>{t('fullSupport.satNoLessons', 'No lessons')}</div>,
                }))}
              />
            ) : mod.lessons.length > 0 ? (
              renderLessonTable(mod.lessons, `mod-${mod.id}`)
            ) : (
              <div style={{ padding: 8, color: '#999' }}>{t('fullSupport.satNoLessons', 'No lessons')}</div>
            );
            return {
              key: `mod-${mod.id}`,
              label: <strong>{t('fullSupport.satModule', 'Module')}: {mod.name}</strong>,
              children,
            };
          })}
        />
      );
    }

    return (
      <Table
        size="small"
        dataSource={lessons}
        rowKey={(_, i) => String(i)}
        pagination={false}
        columns={lessonColumns}
      />
    );
  };

  if (rows.length === 0) {
    return (
      <div>
        {paginationSummary && <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>{paginationSummary}</div>}
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} style={{ margin: '24px 0' }}>
          <Space>
            <Button type="link" size="small" icon={<ExpandAltOutlined />} onClick={() => setRawModalOpen(true)}>{viewRawLabel}</Button>
          </Space>
        </Empty>
        <Modal title={viewRawLabel} open={rawModalOpen} onCancel={() => setRawModalOpen(false)} footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>} width={700} destroyOnClose>
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(payload, null, 2)}</pre>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span>{paginationSummary}</span>
        <Space>
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button size="small" icon={<DownloadOutlined />}>{t('fullSupport.satExport', 'Export')}</Button>
          </Dropdown>
          <Button type="link" size="small" icon={<ExpandAltOutlined />} onClick={() => setRawModalOpen(true)}>{viewRawLabel}</Button>
        </Space>
      </div>
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpand: (expanded, record) => {
            setExpandedRowKeys((k) => (expanded ? [...k, record.id] : k.filter((x) => x !== record.id)));
            if (expanded) handleExpand(expanded, record);
          },
        }}
        pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] } : false}
        size="middle"
        scroll={{ x: 'max-content' }}
      />
      <Modal title={viewRawLabel} open={rawModalOpen} onCancel={() => setRawModalOpen(false)} footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>} width={700} destroyOnClose>
        <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(payload, null, 2)}</pre>
      </Modal>
    </div>
  );
}
