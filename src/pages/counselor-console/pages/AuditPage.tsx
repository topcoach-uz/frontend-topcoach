import { useMemo, useState } from 'react';
import { Button, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Building2, ChevronDown, Lock, ScrollText } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useCounselorConsole } from '../CounselorConsoleContext';
import { CcPill, type CcPillVariant } from '../components/CcPill';
import TableSkeleton from 'src/components/loading/TableSkeleton';
import {
  useGetAuditQuery,
  type OrgAuditEntry,
} from 'src/app/services/orgAuditApi';
import './AuditPage.scss';

dayjs.extend(relativeTime);

const PAGE_SIZE = 25;

/**
 * Map a dotted action key to a human sentence. Anything not listed falls back
 * to a title-cased version of the raw key so new backend actions still read
 * sensibly without a frontend change.
 */
const ACTION_LABEL: Record<string, string> = {
  'invitation.created': 'Invitation created',
  'invitation.revoked': 'Invitation revoked',
  'invitation.resent': 'Invitation resent',
  'student.archived': 'Student archived',
  'student.transferred': 'Student transferred',
  'announcement.sent': 'Announcement sent',
  'org.settings_updated': 'Settings updated',
  'staff.removed': 'Staff removed',
};

/** The pill tone for each action family (keyed by the part before the dot). */
const ACTION_TONE: Record<string, CcPillVariant> = {
  invitation: 'info',
  student: 'accent',
  announcement: 'success',
  org: 'warning',
  staff: 'danger',
};

function humanizeAction(action: string): string {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  return action
    .split(/[._]/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function actionTone(action: string): CcPillVariant {
  const family = action.split('.')[0] ?? '';
  return ACTION_TONE[family] ?? 'neutral';
}

/** A short, readable form of a target id (UUIDs get truncated). */
function shortId(id: string | null): string | null {
  if (!id) return null;
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
}

function hasMetadata(m: OrgAuditEntry['metadata']): boolean {
  return !!m && typeof m === 'object' && Object.keys(m).length > 0;
}

function MetadataCell({ entry }: { entry: OrgAuditEntry }) {
  const [open, setOpen] = useState(false);
  if (!hasMetadata(entry.metadata)) {
    return <span className="cc-audit-muted">—</span>;
  }
  const json = JSON.stringify(entry.metadata, null, 2);
  const preview = JSON.stringify(entry.metadata);
  return (
    <div className="cc-audit-meta">
      <Tooltip
        title={<pre className="cc-audit-meta-tip">{json}</pre>}
        placement="topRight"
        overlayClassName="cc-audit-meta-overlay"
      >
        <button
          type="button"
          className={`cc-audit-meta-toggle ${open ? 'cc-audit-meta-toggle--open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <ChevronDown size={13} />
          <span className="cc-audit-meta-preview">{preview}</span>
        </button>
      </Tooltip>
      {open ? <pre className="cc-audit-meta-json">{json}</pre> : null}
    </div>
  );
}

export default function CounselorConsoleAuditPage() {
  const { orgId, org, role } = useCounselorConsole();
  const [page, setPage] = useState(1);

  const isOwner = role === 'owner';

  const queryArgs = useMemo(
    () => ({ orgId: orgId ?? '', page, limit: PAGE_SIZE }),
    [orgId, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetAuditQuery(
    queryArgs,
    { skip: !orgId || !isOwner },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const header = (
    <div className="cc-page-head--ruled">
      <div className="cc-page-eyebrow">
        <span className="cc-page-eyebrow-accent">Administration</span>
        {org ? <span>· {org.name}</span> : null}
      </div>
      <h1 className="cc-page-title">Audit log</h1>
      <p className="cc-page-lead">
        A running record of every administrative action in this organization —
        invitations, student changes, announcements and settings. Use it to see
        who changed what, and when.
      </p>
    </div>
  );

  // ── No organization selected ──
  if (!orgId) {
    return (
      <div className="cc-audit">
        {header}
        <div className="cc-placeholder">
          <Building2 size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Select an organization</div>
          <div className="cc-placeholder-text">
            Choose an organization from the switcher to view its audit log.
          </div>
        </div>
      </div>
    );
  }

  // ── Owner-only gate ──
  if (!isOwner) {
    return (
      <div className="cc-audit">
        {header}
        <div className="cc-placeholder">
          <Lock size={22} color="#7b1f2f" />
          <div className="cc-placeholder-title">Owners only</div>
          <div className="cc-placeholder-text">
            The audit log is restricted to organization owners. Contact an owner
            of {org?.name ?? 'this organization'} if you need access.
          </div>
        </div>
      </div>
    );
  }

  const columns: ColumnsType<OrgAuditEntry> = [
    {
      title: 'Action',
      key: 'action',
      width: 190,
      render: (_, e) => (
        <CcPill variant={actionTone(e.action)}>{humanizeAction(e.action)}</CcPill>
      ),
    },
    {
      title: 'Actor',
      key: 'actor',
      width: 180,
      render: (_, e) => (
        <span className="cc-audit-actor">{e.actorName || 'System'}</span>
      ),
    },
    {
      title: 'Target',
      key: 'target',
      width: 180,
      render: (_, e) => {
        if (!e.targetType && !e.targetId) {
          return <span className="cc-audit-muted">—</span>;
        }
        return (
          <div className="cc-audit-target">
            {e.targetType ? (
              <span className="cc-audit-target-type">{e.targetType}</span>
            ) : null}
            {e.targetId ? (
              <Tooltip title={e.targetId}>
                <span className="cc-audit-target-id">{shortId(e.targetId)}</span>
              </Tooltip>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Details',
      key: 'metadata',
      render: (_, e) => <MetadataCell entry={e} />,
    },
    {
      title: 'When',
      key: 'createdAt',
      width: 150,
      align: 'right',
      render: (_, e) => (
        <Tooltip title={dayjs(e.createdAt).format('lll')}>
          <span className="cc-audit-when">{dayjs(e.createdAt).fromNow()}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="cc-audit" aria-busy={isFetching}>
      {header}

      {isLoading ? (
        <div className="cc-audit-skeleton">
          <TableSkeleton columns={5} rows={8} />
        </div>
      ) : isError ? (
        <div className="cc-audit-table">
          <div className="cc-audit-empty">
            <div className="cc-audit-empty-title">Couldn’t load the audit log</div>
            <div>Something went wrong fetching your organization’s activity.</div>
            <Button className="cc-audit-retry" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="cc-audit-table">
          <Table<OrgAuditEntry>
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={isFetching}
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
                <div className="cc-audit-empty">
                  <ScrollText size={22} color="#9a8f7d" />
                  <div className="cc-audit-empty-title">No activity yet</div>
                  <div>
                    Administrative actions will appear here as your team works.
                  </div>
                </div>
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
