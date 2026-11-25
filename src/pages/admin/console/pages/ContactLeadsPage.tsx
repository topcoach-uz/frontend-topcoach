import { useMemo, useState } from 'react';
import { Alert, Card, Empty, Input, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useTranslation } from 'react-i18next';

import {
  useGetAdminContactLeadsQuery,
  type AdminContactLeadRow,
} from 'src/app/services/adminConsoleApi';
import { AcPill } from '../components/AcPill';

import SearchButton from 'src/components/common/searchButton';
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ContactLeadsPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isFetching, isError } = useGetAdminContactLeadsQuery({
    search: search.trim() || undefined,
    source: source.trim() || undefined,
    page,
    limit: pageSize,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<AdminContactLeadRow> = useMemo(
    () => [
      {
        title: t('admin.contactLeads.columns.name', 'Name'),
        dataIndex: 'fullName',
        key: 'fullName',
        width: 180,
        render: (v: string) => v || '—',
      },
      {
        title: t('admin.contactLeads.columns.email', 'Email'),
        dataIndex: 'email',
        key: 'email',
        width: 220,
        render: (v: string) => v || '—',
      },
      {
        title: t('admin.contactLeads.columns.phone', 'Phone'),
        dataIndex: 'phoneNumber',
        key: 'phoneNumber',
        width: 150,
        render: (v: string | null) =>
          v || <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
      },
      {
        title: t('admin.contactLeads.columns.source', 'Source'),
        dataIndex: 'howDidYouHear',
        key: 'howDidYouHear',
        width: 240,
        render: (v: string | null) =>
          v ? (
            <AcPill variant="info">{v}</AcPill>
          ) : (
            <span style={{ color: 'var(--ac-text-muted)' }}>—</span>
          ),
      },
      {
        title: t('admin.contactLeads.columns.educationLevel', 'Education level'),
        dataIndex: 'currentEducationLevel',
        key: 'currentEducationLevel',
        width: 160,
        render: (v: string | null) =>
          v || <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
      },
      {
        title: t('admin.contactLeads.columns.country', 'Country'),
        dataIndex: 'country',
        key: 'country',
        width: 140,
        render: (v: string | null) =>
          v || <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
      },
      {
        title: t('admin.contactLeads.columns.message', 'Message'),
        dataIndex: 'additionalMessage',
        key: 'additionalMessage',
        width: 280,
        render: (v: string | null) =>
          v ? (
            <Tooltip title={v}>
              <span
                style={{
                  display: 'block',
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v}
              </span>
            </Tooltip>
          ) : (
            <span style={{ color: 'var(--ac-text-muted)' }}>—</span>
          ),
      },
      {
        title: t('admin.contactLeads.columns.submitted', 'Submitted'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 170,
        render: (d: string) => (
          <span style={{ color: 'var(--ac-text-secondary)' }}>{formatDateTime(d)}</span>
        ),
      },
    ],
    [t],
  );

  const showEmpty = !isLoading && !isError && rows.length === 0;

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">{t('admin.contactLeads.title', 'Contact leads')}</h1>
      <p className="ac-page-lead">
        {t(
          'admin.contactLeads.lead',
          'Everyone who submitted the public contact form — newest first.',
        )}
      </p>

      <Card bordered={false} className="ac-panel" title={t('admin.contactLeads.cardTitle', 'All leads')}>
        <div className="ac-directory-toolbar" style={{ marginBottom: 12 }}>
          <Input
            allowClear
            size="large"
            placeholder={t(
              'admin.contactLeads.searchPlaceholder',
              'Search by name, email, or phone',
            )}
            suffix={<SearchButton size={30} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ac-directory-search"
          />
          <Input
            allowClear
            size="large"
            placeholder={t('admin.contactLeads.sourcePlaceholder', 'Filter by source')}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 260 }}
          />
        </div>

        {isError && (
          <Alert
            type="error"
            showIcon
            message={t('admin.contactLeads.loadError', 'Failed to load leads')}
            description={t('admin.contactLeads.loadErrorDesc', 'Try refreshing the page.')}
            style={{ marginBottom: 12 }}
          />
        )}

        <div className="ac-directory-table-meta">
          <Typography.Text type="secondary">
            {t('admin.contactLeads.showingCount', 'Showing {{shown}} of {{total}}', {
              shown: rows.length,
              total: total.toLocaleString(),
            })}
          </Typography.Text>
        </div>

        {showEmpty ? (
          <Empty
            description={
              search.trim() || source.trim()
                ? t('admin.contactLeads.emptyNoMatch', 'No leads match your filters')
                : t('admin.contactLeads.emptyNoLeads', 'No contact-form leads yet')
            }
          />
        ) : (
          <Table<AdminContactLeadRow>
            rowKey="id"
            loading={isLoading || isFetching}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (p, s) => {
                setPage(p);
                setPageSize(s);
              },
            }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
