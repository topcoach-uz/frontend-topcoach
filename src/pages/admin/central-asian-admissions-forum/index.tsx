import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Tag,
  message,
  Drawer,
  Select,
  DatePicker,
  Typography,
  Empty,
  Dropdown,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TFunction } from 'i18next';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { ArrowLeft, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { CaafForumApplicationDto } from 'src/app/services/caafForumApi';
import { useGetCaafForumAdminApplicationsQuery } from 'src/app/services/caafForumApi';
import type { CaafRegistrationStatus } from 'src/pages/events/central-asian-admissions-forum/types';
import type { CaafDraft } from 'src/pages/events/central-asian-admissions-forum/types';
import styles from './CentralAsianAdmissionsForumAdmin.module.scss';

function formatCategory(d: CaafDraft, t: TFunction): string {
  if (!d.categoryId) return '—';
  if (d.categoryId === 'other') return d.categoryOther.trim() || t('caafForum.review.otherPrefix');
  return t(`caafForum.cat.${d.categoryId}`);
}

function formatDestinations(d: CaafDraft, t: TFunction): string {
  const parts = d.destinationIds
    .map((id) => {
      if (id === 'other')
        return d.destinationOther.trim()
          ? `${t('caafForum.review.otherPrefix')}: ${d.destinationOther.trim()}`
          : t('caafForum.review.otherPrefix');
      return t(`caafForum.dest.${id}`);
    })
    .filter(Boolean);
  return parts.length ? parts.join('; ') : '—';
}

function formatPrimaryGoal(goal: string, t: TFunction): string {
  if (!goal) return '—';
  return t(`caafForum.goal.${goal}`);
}

const { RangePicker } = DatePicker;

function statusTagFor(s: CaafRegistrationStatus, t: TFunction): { color: string; label: string } {
  const colors: Record<CaafRegistrationStatus, string> = {
    pending_payment: 'gold',
    paid: 'green',
    refunded: 'default',
    cancelled: 'red',
  };
  const keys: Record<CaafRegistrationStatus, string> = {
    pending_payment: 'caafForum.admin.tagPending',
    paid: 'caafForum.admin.tagPaid',
    refunded: 'caafForum.admin.tagRefunded',
    cancelled: 'caafForum.admin.tagCancelled',
  };
  return { color: colors[s], label: t(keys[s]) };
}

function shorten(s: string, n: number): string {
  if (!s || s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

function submissionToExportRow(r: CaafForumApplicationDto, t: TFunction): Record<string, string> {
  const d = r.draft;
  return {
    'Application ID': r.id,
    'Submitted at': r.submittedAt,
    Status: r.status,
    'Paid at': r.paidAt ?? '',
    'User ID': r.userId,
    'Full name': d.fullName,
    Email: d.email,
    Phone: d.phone,
    'Country & city': d.countryCity,
    Category: formatCategory(d, t),
    'Grade / year': d.gradeOrYear,
    Destinations: formatDestinations(d, t),
    'Intended field': d.intendedFieldOfStudy,
    'Heard about': d.hearAbout,
    'Primary goal': formatPrimaryGoal(d.primaryGoal, t),
    'Speaker question': d.speakerQuestion,
    'Consultation (yes/no)':
      d.wantsConsultation === 'yes'
        ? t('caafForum.consultation.yes')
        : d.wantsConsultation === 'no'
          ? t('caafForum.consultation.no')
          : '',
    'Consent accepted': d.consentAccepted ? t('caafForum.consultation.yes') : t('caafForum.consultation.no'),
  };
}

function escapeCsvCell(value: string): string {
  const s = value ?? '';
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportSubmissionsCsv(list: CaafForumApplicationDto[], filenameBase: string, t: TFunction): void {
  if (list.length === 0) {
    message.info(t('caafForum.admin.exportNothing'));
    return;
  }
  const rows = list.map((r) => submissionToExportRow(r, t));
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h] ?? '')).join(',')),
  ];
  const csv = `\uFEFF${lines.join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(t('caafForum.admin.exportSuccessCsv', { count: list.length }));
}

function exportSubmissionsXlsx(list: CaafForumApplicationDto[], filenameBase: string, t: TFunction): void {
  if (list.length === 0) {
    message.info(t('caafForum.admin.exportNothing'));
    return;
  }
  const rows = list.map((r) => submissionToExportRow(r, t));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Applications');
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
  message.success(t('caafForum.admin.exportSuccessXlsx', { count: list.length }));
}

export default function CentralAsianAdmissionsForumAdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData || user;
  const isSuperAdminOnly =
    currentUser?.managementRole === 'SuperAdmin' || (currentUser?.managementRole as string) === 'Owner';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaafRegistrationStatus | 'all'>('all');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [detail, setDetail] = useState<CaafForumApplicationDto | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('caafForum.admin.statusAll') },
      { value: 'pending_payment' as const, label: t('caafForum.admin.statusPending') },
      { value: 'paid' as const, label: t('caafForum.admin.statusPaid') },
      { value: 'refunded' as const, label: t('caafForum.admin.statusRefunded') },
      { value: 'cancelled' as const, label: t('caafForum.admin.statusCancelled') },
    ],
    [t],
  );

  const queryParams = useMemo(
    () => ({
      status: statusFilter,
      from: range?.[0]?.startOf('day').toISOString(),
      to: range?.[1]?.endOf('day').toISOString(),
      q: search.trim() || undefined,
    }),
    [statusFilter, range, search],
  );

  const { data, isFetching, refetch } = useGetCaafForumAdminApplicationsQuery(queryParams, {
    skip: !isAuthenticated || profileLoading || !isSuperAdminOnly,
  });

  const rows = data?.applications ?? [];

  useEffect(() => {
    if (!profileLoading && isAuthenticated && !isSuperAdminOnly) {
      message.warning(t('caafForum.admin.onlySuperAdmin'));
      navigate('/student-hub', { replace: true });
    }
  }, [profileLoading, isAuthenticated, isSuperAdminOnly, navigate, t]);

  const onExportMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      const base = `caaf-2026-applications-${dayjs().format('YYYY-MM-DD-HHmm')}`;
      if (key === 'csv') exportSubmissionsCsv(rows, base, t);
      if (key === 'xlsx') exportSubmissionsXlsx(rows, base, t);
    },
    [rows, t],
  );

  const columns: ColumnsType<CaafForumApplicationDto> = useMemo(
    () => [
      {
        title: t('caafForum.admin.col.submitted'),
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 120,
        render: (v: string) => dayjs(v).format('MMM D, YYYY HH:mm'),
      },
      {
        title: t('caafForum.admin.col.name'),
        key: 'name',
        render: (_, r) => r.draft.fullName || '—',
      },
      {
        title: t('caafForum.admin.col.email'),
        key: 'email',
        ellipsis: true,
        render: (_, r) => r.draft.email || '—',
      },
      {
        title: t('caafForum.admin.col.status'),
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (s: CaafRegistrationStatus) => {
          const meta = statusTagFor(s, t);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: t('caafForum.admin.col.paid'),
        key: 'paidAt',
        width: 120,
        render: (_, r) => (r.paidAt ? dayjs(r.paidAt).format('MMM D, YYYY') : '—'),
      },
      {
        title: t('caafForum.admin.col.actions'),
        key: 'actions',
        width: 88,
        render: (_, record) => (
          <Button type="link" size="small" onClick={() => setDetail(record)}>
            {t('caafForum.admin.view')}
          </Button>
        ),
      },
    ],
    [t],
  );

  if (profileLoading || (isAuthenticated && isSuperAdminOnly && isFetching && !data)) {
    return (
      <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate('/student-hub')} style={{ marginBottom: 16 }}>
        {t('caafForum.admin.back')}
      </Button>

      <Card title={t('caafForum.admin.title')} bordered={false} className={styles.card}>
        <Typography.Paragraph type="secondary">{t('caafForum.admin.subtitle')}</Typography.Paragraph>

        <div className={styles.toolbar}>
          <Input
            allowClear
            placeholder={t('caafForum.admin.searchPh')}
            prefix={<Search size={16} />}
            style={{ maxWidth: 320 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            style={{ width: 200 }}
            value={statusFilter}
            options={statusOptions}
            onChange={(v) => setStatusFilter(v as CaafRegistrationStatus | 'all')}
          />
          <RangePicker value={range} onChange={(v) => setRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
          <Button onClick={() => void refetch()} loading={isFetching}>
            {t('caafForum.admin.refresh')}
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: t('caafForum.admin.exportCsv'), disabled: rows.length === 0 },
                { key: 'xlsx', label: t('caafForum.admin.exportXlsx'), disabled: rows.length === 0 },
              ],
              onClick: onExportMenuClick,
            }}
            trigger={['click']}
          >
            <Button icon={<Download size={16} />}>{t('caafForum.admin.export')}</Button>
          </Dropdown>
        </div>

        <Table<CaafForumApplicationDto>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          loading={isFetching}
          locale={{
            emptyText: <Empty description={t('caafForum.admin.empty')} />,
          }}
        />
      </Card>

      <Drawer
        title={detail ? shorten(detail.draft.fullName || t('caafForum.admin.drawerApplication'), 40) : t('caafForum.admin.drawerApplication')}
        width={480}
        open={!!detail}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <>
            <div className={styles.drawerSection}>
              <div className={styles.drawerLabel}>{t('caafForum.admin.col.status')}</div>
              {(() => {
                const meta = statusTagFor(detail.status, t);
                return <Tag color={meta.color}>{meta.label}</Tag>;
              })()}
            </div>
            <div className={styles.drawerSection}>
              <div className={styles.drawerLabel}>{t('caafForum.admin.drawer.submitted')}</div>
              <div className={styles.drawerValue}>{dayjs(detail.submittedAt).format('LLL')}</div>
            </div>
            {detail.paidAt && (
              <div className={styles.drawerSection}>
                <div className={styles.drawerLabel}>{t('caafForum.admin.drawer.paid')}</div>
                <div className={styles.drawerValue}>{dayjs(detail.paidAt).format('LLL')}</div>
              </div>
            )}
            <Typography.Title level={5}>{t('caafForum.admin.drawer.responses')}</Typography.Title>
            {[
              [t('caafForum.review.fullName'), detail.draft.fullName],
              [t('caafForum.review.email'), detail.draft.email],
              [t('caafForum.admin.drawer.phone'), detail.draft.phone],
              [t('caafForum.review.countryCity'), detail.draft.countryCity],
              [t('caafForum.admin.drawer.category'), formatCategory(detail.draft, t)],
              [t('caafForum.admin.drawer.grade'), detail.draft.gradeOrYear],
              [t('caafForum.admin.drawer.destinations'), formatDestinations(detail.draft, t)],
              [t('caafForum.admin.drawer.field'), detail.draft.intendedFieldOfStudy],
              [t('caafForum.admin.drawer.heardAbout'), detail.draft.hearAbout],
              [t('caafForum.admin.drawer.goal'), formatPrimaryGoal(detail.draft.primaryGoal, t)],
              [t('caafForum.admin.drawer.question'), detail.draft.speakerQuestion],
              [
                t('caafForum.admin.drawer.consultation'),
                detail.draft.wantsConsultation === 'yes'
                  ? t('caafForum.consultation.yes')
                  : detail.draft.wantsConsultation === 'no'
                    ? t('caafForum.consultation.no')
                    : '—',
              ],
              [
                t('caafForum.admin.drawer.consent'),
                detail.draft.consentAccepted ? t('caafForum.consultation.yes') : t('caafForum.consultation.no'),
              ],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.drawerSection}>
                <div className={styles.drawerLabel}>{k}</div>
                <div className={styles.drawerValue}>{v || '—'}</div>
              </div>
            ))}
          </>
        )}
      </Drawer>
    </div>
  );
}
