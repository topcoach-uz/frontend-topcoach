import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, DatePicker, Spin, Empty, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search as SearchIcon } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { api } from 'src/app/api';
import { AcPill, type AcPillVariant } from 'src/pages/admin/console/components/AcPill';
import { cleanUserName } from 'src/pages/admin/console/utils';

/**
 * Programs › Placement Test tab — admin audit of successful attempts.
 * Backend: GET /api/admin/placement-test/passes.
 */

type PassRow = {
  attemptId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  scorePercentage: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  source: 'ai' | 'fallback';
  timeTakenSeconds: number;
  attemptIndex: number;
  submittedAt: string | null;
  createdAt: string;
};

type PassResponse = {
  items: PassRow[];
  total: number;
  page: number;
  limit: number;
};

const LEVEL_VARIANT: Record<PassRow['level'], AcPillVariant> = {
  A1: 'slate',
  A2: 'slate',
  B1: 'mint',
  B2: 'cyan',
  C1: 'purple',
};

const formatDuration = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '—';
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r.toString().padStart(2, '0')}s`;
};

const PlacementTestPassesTab: React.FC = () => {
  const [data, setData] = useState<PassRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<PassRow['level'] | 'all'>('all');
  const [source, setSource] = useState<PassRow['source'] | 'all'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (level !== 'all') params.set('level', level);
      if (source !== 'all') params.set('source', source);
      if (dateRange?.[0]) params.set('dateFrom', dateRange[0].startOf('day').toISOString());
      if (dateRange?.[1]) params.set('dateTo', dateRange[1].endOf('day').toISOString());
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      const res = await api.request({
        path: `/admin/placement-test/passes?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      const body = (res as { data?: PassResponse })?.data;
      if (body && Array.isArray(body.items)) {
        setData(body.items);
        setTotal(body.total ?? body.items.length);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, level, source, dateRange, page, pageSize]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const columns: ColumnsType<PassRow> = useMemo(
    () => [
      {
        title: 'Student',
        key: 'student',
        width: 240,
        render: (_, r) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>{cleanUserName(r.userName ?? '', r.userEmail)}</span>
            <span style={{ fontSize: 12, color: 'var(--ac-text-muted)' }}>{r.userEmail}</span>
          </div>
        ),
      },
      {
        title: 'Score',
        dataIndex: 'scorePercentage',
        key: 'score',
        width: 90,
        sorter: (a, b) => a.scorePercentage - b.scorePercentage,
        render: (v: number) => <span style={{ fontWeight: 600 }}>{v}%</span>,
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        width: 80,
        render: (v: PassRow['level']) => <AcPill variant={LEVEL_VARIANT[v] ?? 'neutral'}>{v}</AcPill>,
      },
      {
        title: 'Try #',
        dataIndex: 'attemptIndex',
        key: 'attemptIndex',
        width: 80,
        sorter: (a, b) => a.attemptIndex - b.attemptIndex,
        render: (v: number) => (
          <AcPill variant={v === 1 ? 'mint' : v <= 3 ? 'warning' : 'danger'}>
            {v === 1 ? '1st' : v === 2 ? '2nd' : v === 3 ? '3rd' : `${v}th`}
          </AcPill>
        ),
      },
      {
        title: 'Time',
        dataIndex: 'timeTakenSeconds',
        key: 'time',
        width: 100,
        sorter: (a, b) => a.timeTakenSeconds - b.timeTakenSeconds,
        render: (v: number) => formatDuration(v),
      },
      {
        title: 'Source',
        dataIndex: 'source',
        key: 'source',
        width: 100,
        render: (v: PassRow['source']) => (
          <AcPill variant={v === 'ai' ? 'purple' : 'slate'}>{v === 'ai' ? 'AI' : 'Fallback'}</AcPill>
        ),
      },
      {
        title: 'Passed at',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 180,
        sorter: (a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''),
        render: (v: string | null, r) => {
          const ts = v ?? r.createdAt;
          return ts ? new Date(ts).toLocaleString() : '—';
        },
      },
    ],
    [],
  );

  return (
    <>
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <Input
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            prefix={<SearchIcon size={14} />}
            style={{ maxWidth: 320 }}
          />
          <Select
            value={level}
            onChange={(v) => { setLevel(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'All levels' },
              { value: 'B1', label: 'B1' },
              { value: 'B2', label: 'B2' },
              { value: 'C1', label: 'C1' },
              { value: 'A1', label: 'A1' },
              { value: 'A2', label: 'A2' },
            ]}
          />
          <Select
            value={source}
            onChange={(v) => { setSource(v); setPage(1); }}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'All sources' },
              { value: 'ai', label: 'AI-generated' },
              { value: 'fallback', label: 'Fallback bank' },
            ]}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(v) => { setDateRange(v as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            presets={[
              { label: 'Last 7 days', value: [dayjs().subtract(7, 'day'), dayjs()] },
              { label: 'Last 30 days', value: [dayjs().subtract(30, 'day'), dayjs()] },
              { label: 'Last 90 days', value: [dayjs().subtract(90, 'day'), dayjs()] },
            ]}
          />
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ac-text-muted)' }}>
            {total.toLocaleString()} pass{total === 1 ? '' : 'es'}
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Spin spinning={loading}>
          {data.length === 0 && !loading ? (
            <Empty description="No passed placement-test attempts match these filters." />
          ) : (
            <Table<PassRow>
              dataSource={data}
              columns={columns}
              rowKey="attemptId"
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '25', '50', '100'],
                showTotal: (t) => `Total ${t.toLocaleString()}`,
                onChange: (p, s) => { setPage(p); setPageSize(s); },
              }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Spin>
      </Card>
    </>
  );
};

export default PlacementTestPassesTab;
