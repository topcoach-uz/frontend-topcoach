import React, { useState } from 'react';
import { Table, Empty, Button, Modal, Space } from 'antd';
import { Maximize2 } from 'lucide-react';

type Payload = unknown;

/** Pagination meta from ScholarHub-style response. */
export type PaginationMeta = {
  current_page?: number;
  total?: number;
  per_page?: number;
  last_page?: number;
};

/** Extract array of row objects from ScholarHub-style API response (array, or { data }, { items }, { results }, etc.). */
export function getRowsFromPayload(payload: Payload): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
    if (Array.isArray(o.items)) return o.items as Record<string, unknown>[];
    if (Array.isArray(o.results)) return o.results as Record<string, unknown>[];
    if (Array.isArray(o.list)) return o.list as Record<string, unknown>[];
  }
  return [];
}

/** Extract pagination meta when payload is { data, total, current_page, per_page, last_page }. */
export function getPaginationMeta(payload: Payload): PaginationMeta | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const o = payload as Record<string, unknown>;
  if (!Array.isArray(o.data)) return null;
  return {
    current_page: typeof o.current_page === 'number' ? o.current_page : undefined,
    total: typeof o.total === 'number' ? o.total : undefined,
    per_page: typeof o.per_page === 'number' ? o.per_page : undefined,
    last_page: typeof o.last_page === 'number' ? o.last_page : undefined,
  };
}

/** Returns true if payload looks like a paginated API response (has data array). */
function isPaginatedPayload(payload: Payload): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const o = payload as Record<string, unknown>;
  return Array.isArray(o.data);
}

/** Get all keys from first row for column definitions. */
function getColumnsFromRows(rows: Record<string, unknown>[]): { key: string; title: string }[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => ({
    key,
    title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

/** Format cell value for display. */
function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export type SatProgressTableProps = {
  payload: Payload;
  emptyText?: string;
  /** Optional i18n: "View raw response" button label */
  viewRawLabel?: string;
  /** Optional i18n: "Page X of Y · Z records" */
  pageSummary?: (current: number, last: number, total: number) => string;
};

/** Unwrap one level if payload is { data: <paginated object> } (double-wrapped from API). */
function unwrapPayload(payload: Payload): Payload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const o = payload as Record<string, unknown>;
  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const obj = inner as Record<string, unknown>;
    if ('current_page' in obj || ('data' in obj && Array.isArray(obj.data)) || 'total' in obj) return inner;
  }
  return payload;
}

/** Renders ScholarHub progress payload as a table. For paginated { data: [] } shows a clean table + empty state + "View raw" instead of raw JSON. */
export function SatProgressTable({ payload, emptyText, viewRawLabel = 'View raw response', pageSummary }: SatProgressTableProps) {
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const effective = unwrapPayload(payload);
  const rows = getRowsFromPayload(effective);
  const meta = getPaginationMeta(effective);
  const isPaginated = isPaginatedPayload(effective);

  const paginationSummary =
    meta && (meta.total !== undefined || meta.current_page !== undefined)
      ? pageSummary
        ? pageSummary(
            meta.current_page ?? 1,
            meta.last_page ?? 1,
            meta.total ?? 0,
          )
        : `Page ${meta.current_page ?? 1}${meta.last_page != null ? ` of ${meta.last_page}` : ''} · ${meta.total ?? 0} record${(meta.total ?? 0) !== 1 ? 's' : ''}`
      : null;

  if (isPaginated) {
    if (rows.length > 0) {
      const columns = getColumnsFromRows(rows).map((col) => ({
        ...col,
        dataIndex: col.key,
        render: (val: unknown) => formatCell(val),
      }));
      const dataSource = rows.map((row, idx) => ({ ...row, key: String(row.id ?? row.user_id ?? idx) }));
      return (
        <div>
          {paginationSummary && (
            <div style={{ marginBottom: 12, fontSize: 13, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span>{paginationSummary}</span>
              <Button type="link" size="small" icon={<Maximize2 size={16} />} onClick={() => setRawModalOpen(true)}>
                {viewRawLabel}
              </Button>
            </div>
          )}
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: true } : false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
          {!paginationSummary && (
            <Button type="link" size="small" icon={<Maximize2 size={16} />} onClick={() => setRawModalOpen(true)} style={{ marginTop: 8 }}>
              {viewRawLabel}
            </Button>
          )}
          <Modal
            title={viewRawLabel}
            open={rawModalOpen}
            onCancel={() => setRawModalOpen(false)}
            footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>}
            width={700}
            destroyOnClose
          >
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </Modal>
        </div>
      );
    }

    return (
      <div>
        {paginationSummary && (
          <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>{paginationSummary}</div>
        )}
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText ?? 'No student progress records yet.'}
          style={{ margin: '24px 0' }}
        >
          <Space>
            <Button type="link" size="small" icon={<Maximize2 size={16} />} onClick={() => setRawModalOpen(true)}>
              {viewRawLabel}
            </Button>
          </Space>
        </Empty>
        <Modal
          title={viewRawLabel}
          open={rawModalOpen}
          onCancel={() => setRawModalOpen(false)}
          footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>}
          width={700}
          destroyOnClose
        >
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </Modal>
      </div>
    );
  }

  if (rows.length > 0) {
    const columns = getColumnsFromRows(rows).map((col) => ({
      ...col,
      dataIndex: col.key,
      render: (val: unknown) => formatCell(val),
    }));
    const dataSource = rows.map((row, idx) => ({ ...row, key: String(row.id ?? row.user_id ?? idx) }));
    return (
      <div>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: true } : false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
        <Button type="link" size="small" icon={<Maximize2 size={16} />} onClick={() => setRawModalOpen(true)} style={{ marginTop: 8 }}>
          {viewRawLabel}
        </Button>
        <Modal
          title={viewRawLabel}
          open={rawModalOpen}
          onCancel={() => setRawModalOpen(false)}
          footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>}
          width={700}
          destroyOnClose
        >
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </Modal>
      </div>
    );
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    const entries = Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !Array.isArray(v));
    if (entries.length > 0) {
      return (
        <div>
          <Table
            dataSource={entries.map(([key, value], i) => ({ key: key + i, field: key.replace(/_/g, ' '), value }))}
            columns={[
              { title: 'Field', dataIndex: 'field', key: 'field', width: 180, render: (k: string) => k.replace(/\b\w/g, (c) => c.toUpperCase()) },
              { title: 'Value', dataIndex: 'value', key: 'value', render: formatCell },
            ]}
            pagination={false}
            size="small"
            rowKey="key"
          />
          <Button type="link" size="small" icon={<Maximize2 size={16} />} onClick={() => setRawModalOpen(true)} style={{ marginTop: 8 }}>
            {viewRawLabel}
          </Button>
          <Modal
            title={viewRawLabel}
            open={rawModalOpen}
            onCancel={() => setRawModalOpen(false)}
            footer={<Button onClick={() => setRawModalOpen(false)}>Close</Button>}
            width={700}
            destroyOnClose
          >
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </Modal>
        </div>
      );
    }
  }

  return <div style={{ color: '#666', padding: 16 }}>{emptyText ?? 'No data'}</div>;
}
