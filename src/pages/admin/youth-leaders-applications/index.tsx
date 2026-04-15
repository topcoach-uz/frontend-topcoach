import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  message,
  Drawer,
  Descriptions,
  Select,
  DatePicker,
  Modal,
  Typography,
  Empty,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { ArrowLeft, ChevronDown, Download, FileDown, Search } from 'lucide-react';
import {
  THEMATIC_CLUSTER_OPTIONS,
  type YouthLeadersDraft,
} from 'src/pages/events/youth-leaders-application/types';
import {
  downloadStoredSubmissionFile,
  loadSubmissions,
  SUBMISSIONS_STORAGE_KEY,
  updateSubmission,
  type StoredSubmissionFile,
  type YouthLeadersApplicationStatus,
  type YouthLeadersSubmission,
} from 'src/pages/events/youth-leaders-application/submissionsStorage';
import {
  generateYouthLeadersApplicationPdf,
  generateYouthLeadersApplicationsPdf,
} from 'src/utils/youthLeadersApplicationPdf';
import styles from './YouthLeadersApplicationsAdmin.module.scss';

const { RangePicker } = DatePicker;

function clusterLabel(id: string): string {
  if (!id) return '—';
  return THEMATIC_CLUSTER_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function shorten(s: string, n: number): string {
  if (!s || s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

const STATUS_OPTIONS: { value: YouthLeadersApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function YouthLeadersApplicationsAdminPage() {
  const navigate = useNavigate();
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userData || user;
  const isSuperAdminOnly = currentUser?.managementRole === 'SuperAdmin';

  const [rows, setRows] = useState<YouthLeadersSubmission[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<YouthLeadersApplicationStatus | 'all'>('all');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [detail, setDetail] = useState<YouthLeadersSubmission | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [actionModal, setActionModal] = useState<
    { type: 'approve' | 'reject'; record: YouthLeadersSubmission } | null
  >(null);
  const [actionNote, setActionNote] = useState('');

  const refresh = useCallback(() => {
    setRows(loadSubmissions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SUBMISSIONS_STORAGE_KEY) refresh();
    };
    const onUpdated = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('topcoach-youth-leaders-submissions-updated', onUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('topcoach-youth-leaders-submissions-updated', onUpdated);
    };
  }, [refresh]);

  useEffect(() => {
    if (!profileLoading && isAuthenticated && !isSuperAdminOnly) {
      message.warning('Only SuperAdmin can access this page.');
      navigate('/student-hub', { replace: true });
    }
  }, [profileLoading, isAuthenticated, isSuperAdminOnly, navigate]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (range?.[0] && range?.[1]) {
      const start = range[0].startOf('day').valueOf();
      const end = range[1].endOf('day').valueOf();
      list = list.filter((r) => {
        const t = new Date(r.submittedAt).getTime();
        return t >= start && t <= end;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const p = r.draft.personal;
        const blob = [
          p.familyName,
          p.givenName,
          p.middleName,
          p.email,
          p.mobile,
          p.nationality,
          r.id,
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }, [rows, statusFilter, range, search]);

  const selectedInView = useMemo(() => {
    const set = new Set(selectedRowKeys);
    return filtered.filter((r) => set.has(r.id));
  }, [filtered, selectedRowKeys]);

  const exportPdfDisabled = filtered.length === 0 && selectedInView.length === 0;

  const exportPdfMenuItems: MenuProps['items'] = [
    {
      key: 'filtered',
      label: `Export filtered (${filtered.length})`,
      disabled: filtered.length === 0,
    },
    {
      key: 'selected',
      label: `Export selected (${selectedInView.length})`,
      disabled: selectedInView.length === 0,
    },
  ];

  const openAction = (type: 'approve' | 'reject', record: YouthLeadersSubmission) => {
    setActionNote(record.adminNote ?? '');
    setActionModal({ type, record });
  };

  const confirmAction = () => {
    if (!actionModal) return;
    const { type, record } = actionModal;
    const ok = updateSubmission(record.id, {
      status: type === 'approve' ? 'approved' : 'rejected',
      adminNote: actionNote.trim() || undefined,
      reviewedAt: new Date().toISOString(),
    });
    if (ok) {
      message.success(type === 'approve' ? 'Application approved.' : 'Application rejected.');
      refresh();
      setDetail((d) => (d?.id === record.id ? { ...d, status: type === 'approve' ? 'approved' : 'rejected', adminNote: actionNote.trim() || undefined } : d));
    } else {
      message.error('Could not save the update. Storage may be full.');
    }
    setActionModal(null);
  };

  const exportOne = (r: YouthLeadersSubmission) => {
    try {
      generateYouthLeadersApplicationPdf(r);
      message.success('PDF downloaded.');
    } catch {
      message.error('Could not generate PDF.');
    }
  };

  const exportBulk = (list: YouthLeadersSubmission[]) => {
    if (list.length === 0) {
      message.info('Nothing to export.');
      return;
    }
    try {
      generateYouthLeadersApplicationsPdf(list);
      message.success(`PDF with ${list.length} application(s) downloaded.`);
    } catch {
      message.error('Could not generate PDF.');
    }
  };

  const columns: ColumnsType<YouthLeadersSubmission> = [
    {
      title: 'Applicant',
      key: 'name',
      render: (_, r) => {
        const p = r.draft.personal;
        return [p.familyName, p.givenName].filter(Boolean).join(' ') || '—';
      },
      sorter: (a, b) => {
        const na = [a.draft.personal.familyName, a.draft.personal.givenName].join(' ');
        const nb = [b.draft.personal.familyName, b.draft.personal.givenName].join(' ');
        return na.localeCompare(nb);
      },
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, r) => r.draft.personal.email || '—',
    },
    {
      title: 'Nationality',
      key: 'nat',
      width: 120,
      render: (_, r) => r.draft.personal.nationality || '—',
    },
    {
      title: 'Thematic cluster',
      key: 'cluster',
      ellipsis: true,
      render: (_, r) => shorten(clusterLabel(r.draft.thematicClusterId), 42),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (s: YouthLeadersApplicationStatus) => {
        const m = { pending: 'gold', approved: 'green', rejected: 'red' } as const;
        return <Tag color={m[s]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Tag>;
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      width: 165,
      render: (iso: string) => formatSubmittedAt(iso),
      sorter: (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => setDetail(r)}>
            View
          </Button>
          <Button type="link" size="small" icon={<FileDown size={14} />} onClick={() => exportOne(r)}>
            PDF
          </Button>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={() => openAction('approve', r)}>
                Approve
              </Button>
              <Button type="link" size="small" danger onClick={() => openAction('reject', r)}>
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (!isAuthenticated || profileLoading) {
    return (
      <div className={styles.page}>
        <Typography.Text>Loading…</Typography.Text>
      </div>
    );
  }

  if (!isSuperAdminOnly) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Button
        type="text"
        icon={<ArrowLeft size={18} />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>

      <Card title="Youth Leaders applications" bordered={false} className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Review submissions from the Youth Leaders registration flow. Data is stored in this browser until a backend
            is connected. Only <strong>SuperAdmin</strong> accounts can open this page.
          </Typography.Paragraph>

          <Space wrap style={{ width: '100%' }} className={styles.filters}>
            <Input
              allowClear
              placeholder="Search name, email, phone, nationality…"
              prefix={<Search size={16} style={{ opacity: 0.5 }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 260, maxWidth: 400 }}
            />
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(v) => setStatusFilter(v)}
              style={{ width: 180 }}
            />
            <RangePicker value={range ?? undefined} onChange={(d) => setRange(d as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
            <Dropdown
              menu={{
                items: exportPdfMenuItems,
                onClick: ({ key }) => {
                  if (key === 'filtered') exportBulk(filtered);
                  if (key === 'selected') exportBulk(selectedInView);
                },
              }}
              trigger={['click']}
              disabled={exportPdfDisabled}
            >
              <Button icon={<FileDown size={16} />} disabled={exportPdfDisabled}>
                Export PDF
                <ChevronDown size={16} style={{ marginLeft: 6, opacity: 0.7 }} aria-hidden />
              </Button>
            </Dropdown>
          </Space>

          {rows.length === 0 ? (
            <Empty description="No applications submitted yet. Submissions appear after applicants complete the Youth Leaders form and click Submit." />
          ) : (
            <Table<YouthLeadersSubmission>
              rowKey="id"
              size="middle"
              scroll={{ x: 980 }}
              columns={columns}
              dataSource={filtered}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
            />
          )}
        </Space>
      </Card>

      <Drawer
        title="Application detail"
        width={720}
        open={!!detail}
        onClose={() => setDetail(null)}
        extra={
          detail ? (
            <Space>
              <Button icon={<FileDown size={16} />} onClick={() => exportOne(detail)}>
                Export PDF
              </Button>
              {detail.status === 'pending' && (
                <>
                  <Button type="primary" onClick={() => openAction('approve', detail)}>
                    Approve
                  </Button>
                  <Button danger onClick={() => openAction('reject', detail)}>
                    Reject
                  </Button>
                </>
              )}
            </Space>
          ) : null
        }
      >
        {detail && <DetailBody draft={detail.draft} submission={detail} />}
      </Drawer>

      <Modal
        title={actionModal?.type === 'approve' ? 'Approve application' : 'Reject application'}
        open={!!actionModal}
        onOk={confirmAction}
        onCancel={() => setActionModal(null)}
        okText={actionModal?.type === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{ danger: actionModal?.type === 'reject' }}
      >
        <Typography.Paragraph>
          {actionModal?.type === 'approve'
            ? 'Optional note (visible in PDF / records).'
            : 'Optional reason / note for the applicant file.'}
        </Typography.Paragraph>
        <Input.TextArea rows={4} value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Internal note…" />
      </Modal>
    </div>
  );
}

function formatSubmittedAt(iso: string): string {
  if (!iso) return '—';
  return dayjs(iso).format('MMM D, YYYY h:mm A');
}

function FileAttachmentRow({
  label,
  stored,
  fileNameFallback,
}: {
  label: string;
  stored?: StoredSubmissionFile;
  fileNameFallback?: string;
}) {
  const displayName = stored?.name || fileNameFallback;
  if (!displayName?.trim()) {
    return <Descriptions.Item label={label}>—</Descriptions.Item>;
  }
  return (
    <Descriptions.Item label={label}>
      <Space size="small" wrap align="start">
        <span>{displayName}</span>
        {stored ? (
          <Button
            type="link"
            size="small"
            icon={<Download size={14} />}
            onClick={() => downloadStoredSubmissionFile(stored)}
          >
            Download
          </Button>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Filename only — file bytes were not stored (older submission or different browser).
          </Typography.Text>
        )}
      </Space>
    </Descriptions.Item>
  );
}

function DetailBody({ draft, submission }: { draft: YouthLeadersDraft; submission: YouthLeadersSubmission }) {
  const p = draft.personal;
  const id = draft.idInfo;
  const c = draft.contact;
  const a = draft.arrival;
  const att = submission.attachments;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Descriptions bordered size="small" column={1} title="Submission meta">
        <Descriptions.Item label="Submission ID">{submission.id}</Descriptions.Item>
        <Descriptions.Item label="Submitted">{formatSubmittedAt(submission.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="Status">{submission.status}</Descriptions.Item>
        {submission.reviewedAt && (
          <Descriptions.Item label="Reviewed">{formatSubmittedAt(submission.reviewedAt)}</Descriptions.Item>
        )}
        {submission.adminNote && <Descriptions.Item label="Admin note">{submission.adminNote}</Descriptions.Item>}
      </Descriptions>

      <Descriptions bordered size="small" column={1} title="Personal">
        <Descriptions.Item label="Name">{[p.familyName, p.middleName, p.givenName].filter(Boolean).join(' ')}</Descriptions.Item>
        <Descriptions.Item label="Email">{p.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{p.mobile}</Descriptions.Item>
        <Descriptions.Item label="DOB">{p.dateOfBirth}</Descriptions.Item>
        <Descriptions.Item label="Nationality">{p.nationality}</Descriptions.Item>
        <Descriptions.Item label="Dietary">{p.dietary}</Descriptions.Item>
        <Descriptions.Item label="Organization">{p.organization}</Descriptions.Item>
        <Descriptions.Item label="Position">{p.position}</Descriptions.Item>
        <FileAttachmentRow label="ID photo file" stored={att?.idPhoto} fileNameFallback={p.idPhotoFileName} />
        <FileAttachmentRow label="Portrait file" stored={att?.portrait} fileNameFallback={p.portraitPhotoFileName} />
      </Descriptions>

      <Descriptions bordered size="small" column={1} title="ID">
        <Descriptions.Item label="Passport">{id.passportNumber}</Descriptions.Item>
        <Descriptions.Item label="Expiry">{id.passportExpiry}</Descriptions.Item>
        <FileAttachmentRow label="Scan file" stored={att?.passport} fileNameFallback={id.passportScanFileName} />
        <Descriptions.Item label="Visa needed">{id.needsVisa || '—'}</Descriptions.Item>
        <Descriptions.Item label="Visa place">{id.visaApplicationPlace || '—'}</Descriptions.Item>
        <Descriptions.Item label="Program">{id.programName || '—'}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered size="small" column={1} title="Thematic cluster">
        <Descriptions.Item label="Selection">{clusterLabel(draft.thematicClusterId)}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered size="small" column={1} title="Contact">
        <Descriptions.Item label="Address">{c.address || '—'}</Descriptions.Item>
        <Descriptions.Item label="WhatsApp">{c.whatsapp || '—'}</Descriptions.Item>
        <Descriptions.Item label="X">{c.twitter || '—'}</Descriptions.Item>
        <Descriptions.Item label="Instagram">{c.instagram || '—'}</Descriptions.Item>
        <Descriptions.Item label="WeChat">{c.wechat || '—'}</Descriptions.Item>
        <Descriptions.Item label="Short bio">{c.shortBio || '—'}</Descriptions.Item>
        <FileAttachmentRow label="Resume" stored={att?.resume} fileNameFallback={c.resumeFileName} />
        <Descriptions.Item label="Topic">{c.wydfTopic || '—'}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered size="small" column={1} title="Travel">
        <Descriptions.Item label="Arrival airport">{a.arrivalAirport || '—'}</Descriptions.Item>
        <Descriptions.Item label="Arrival date">{a.arrivalDate || '—'}</Descriptions.Item>
        <Descriptions.Item label="Arrival time">{a.arrivalTime || '—'}</Descriptions.Item>
        <Descriptions.Item label="Arrival flight">{a.arrivalFlight || '—'}</Descriptions.Item>
        <Descriptions.Item label="Departure airport">{a.departureAirport || '—'}</Descriptions.Item>
        <Descriptions.Item label="Departure date">{a.departureDate || '—'}</Descriptions.Item>
        <Descriptions.Item label="Departure time">{a.departureTime || '—'}</Descriptions.Item>
        <Descriptions.Item label="Departure flight">{a.departureFlight || '—'}</Descriptions.Item>
      </Descriptions>
    </Space>
  );
}
