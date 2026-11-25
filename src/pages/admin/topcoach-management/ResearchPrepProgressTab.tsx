/**
 * ResearchPrepProgressTab
 *
 * Superadmin view of the Research Prep roster: students with Community access
 * (Research Prep is part of Community). Progress through the 8-week curriculum
 * and pending grader work. Rows may also show Full Support when that grant applies.
 *
 * Data source: GET /research-prep/admin/students
 */

import React, { useMemo, useState } from 'react';
import { Alert, Card, Input, Progress, Spin, Table, Tag, Typography } from 'antd';
import { Sparkles } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import {
  useGetResearchPrepAdminRosterQuery,
  type ResearchAdminStudent,
} from 'src/app/services/research-prep';

import SearchButton from 'src/components/common/searchButton';
const { Text: AntText } = Typography;

/** Coerce the backend response to a plain array regardless of any wrapper. */
function normalizeStudents(raw: unknown): ResearchAdminStudent[] {
  if (Array.isArray(raw)) return raw as ResearchAdminStudent[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: ResearchAdminStudent[] }).data;
  }
  return [];
}

const ResearchPrepProgressTab: React.FC = () => {
  const { data, isLoading, error } = useGetResearchPrepAdminRosterQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [search, setSearch] = useState('');

  const students = useMemo<ResearchAdminStudent[]>(() => normalizeStudents(data), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => (s.name ?? '').toLowerCase().includes(q));
  }, [students, search]);

  const stats = useMemo(() => {
    if (students.length === 0) {
      return { total: 0, avgPercent: 0, pending: 0 };
    }
    const total = students.length;
    const avgPercent = Math.round(
      students.reduce((acc, s) => acc + (s.overallPercent ?? 0), 0) / total,
    );
    const pending = students.reduce((acc, s) => acc + (s.pendingSubmissions ?? 0), 0);
    return { total, avgPercent, pending };
  }, [students]);

  const columns: ColumnsType<ResearchAdminStudent> = [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong>{name ?? '—'}</strong>
          {row.isFullSupport ? (
            <Tag color="geekblue">Full Support</Tag>
          ) : null}
        </div>
      ),
      sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
    },
    {
      title: 'Weeks completed',
      dataIndex: 'weeksCompleted',
      key: 'weeksCompleted',
      width: 160,
      align: 'center',
      render: (n: number) => (
        <span>
          <strong>{n}</strong> / 8
        </span>
      ),
      sorter: (a, b) => a.weeksCompleted - b.weeksCompleted,
    },
    {
      title: 'Overall progress',
      dataIndex: 'overallPercent',
      key: 'overallPercent',
      width: 220,
      render: (p: number) => (
        <Progress
          percent={p}
          size="small"
          status={p === 100 ? 'success' : 'active'}
        />
      ),
      sorter: (a, b) => a.overallPercent - b.overallPercent,
    },
    {
      title: 'Pending grading',
      dataIndex: 'pendingSubmissions',
      key: 'pendingSubmissions',
      width: 160,
      align: 'center',
      render: (n: number) =>
        n > 0 ? <Tag color="volcano">{n} pending</Tag> : <span style={{ color: '#999' }}>—</span>,
      sorter: (a, b) => a.pendingSubmissions - b.pendingSubmissions,
    },
  ];

  return (
    <>
      <Card className="dashboard-filters" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search students by name"
            suffix={<SearchButton size={30} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
            size="large"
          />
          <AntText type="secondary" style={{ fontSize: 13 }}>
            <Sparkles size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            Research Prep is bundled with Community: everyone listed here has Community access. Full
            Support is granted separately — students can be on both; they still see Research Prep
            when they have Community.
          </AntText>
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        {[
          { label: 'Students enrolled', value: stats.total },
          { label: 'Avg. completion', value: `${stats.avgPercent}%` },
          { label: 'Pending submissions', value: stats.pending },
        ].map((s) => (
          <Card key={s.label} size="small">
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="dashboard-table" style={{ marginTop: 16 }}>
        {error && (
          <Alert
            type="warning"
            showIcon
            message="Couldn't load Research Prep roster."
            description="The page is up — but the /admin/students endpoint failed. Try reloading; if it persists, check that you're signed in as an admin."
            style={{ marginBottom: 12 }}
          />
        )}
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey={(r, i) => r?.id ?? `row-${i}`}
            locale={{
              emptyText: error ? ' ' : 'No students have started Research Prep yet.',
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (n) => `${n} student${n === 1 ? '' : 's'}`,
            }}
          />
        </Spin>
      </Card>
    </>
  );
};

export default ResearchPrepProgressTab;
