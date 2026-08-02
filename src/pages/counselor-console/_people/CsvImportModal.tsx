/* ── Counselor Console — bulk student import ──────────────────────────────────
   Pick a CSV, see every row validated BEFORE anything is sent, then send only
   the rows that will succeed. Students only: staff are added one at a time and
   deliberately so.

   The preview is the point. A counselor is uploading a file they exported from
   somewhere else and cannot see inside; the table below the picker is where
   they find out that column three was blank on twelve rows, while it is still
   free to fix. */
import { useMemo, useRef, useState } from 'react';
import { Button, Modal, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertTriangle, CheckCircle2, Upload as UploadIcon } from 'lucide-react';

import { CcPill } from '../components/CcPill';
import {
  useBulkInviteMutation,
  type BulkInviteResult,
  type CreateInvitationBody,
} from 'src/app/services/counselorConsoleApi';
import { apiErrorMessage } from './peopleChrome';
import { buildPreviewRows, type ParsedCsvRow } from './csvImport';

/** Above this the preview paginates rather than growing the modal past the fold. */
const PREVIEW_PAGE_SIZE = 8;

const previewColumns: ColumnsType<ParsedCsvRow> = [
  {
    title: '',
    key: 'flag',
    width: 40,
    render: (_, r) =>
      r.valid ? (
        <CheckCircle2 size={16} className="cc-invite-flag-ok" />
      ) : (
        <AlertTriangle size={16} className="cc-invite-flag-bad" />
      ),
  },
  { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => v || '-' },
  { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '-' },
  {
    title: 'Grade',
    dataIndex: 'grade',
    key: 'grade',
    width: 80,
    render: (v) => v || '-',
  },
  {
    title: 'Grad yr',
    dataIndex: 'graduationYear',
    key: 'graduationYear',
    width: 90,
    render: (v) => v || '-',
  },
  { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v) => v || '-' },
  {
    title: 'Result',
    key: 'result',
    width: 190,
    render: (_, r) =>
      r.valid ? (
        <span className="cc-invite-flag-ok-text">Ready</span>
      ) : (
        <span className="cc-invite-flag-bad-text">{r.error}</span>
      ),
  },
];

export function CsvImportModal({
  open,
  onClose,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
}) {
  const [rows, setRows] = useState<ParsedCsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<BulkInviteResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkInvite, { isLoading: submitting }] = useBulkInviteMutation();

  const validRows = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const invalidCount = rows.length - validRows.length;

  const close = () => {
    setRows([]);
    setFileName(null);
    setResult(null);
    onClose();
  };

  const handleFilePicked = (file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = buildPreviewRows(String(reader.result ?? ''));
        setRows(parsed);
        if (parsed.length === 0) message.warning('No rows found in that file.');
      } catch {
        message.error('Could not read that CSV file.');
      }
    };
    reader.onerror = () => message.error('Could not read that CSV file.');
    reader.readAsText(file);
  };

  const submit = async () => {
    if (validRows.length === 0) return;
    const invitations: CreateInvitationBody[] = validRows.map((r) => ({
      email: r.email.trim(),
      role: 'student',
      name: r.name.trim() || undefined,
      // Already coerced to a smallint (or null) by the CSV validator — the raw
      // cell text never reaches the API.
      gradeLevel: r.gradeLevel ?? undefined,
      graduationYear: r.graduationYear ? Number(r.graduationYear) : undefined,
      phone: r.phone.trim() || undefined,
    }));
    try {
      const res = await bulkInvite({ orgId, invitations }).unwrap();
      setResult(res);
      const createdCount = res.created.length;
      message.success(
        `Imported ${createdCount} invitation${createdCount === 1 ? '' : 's'}` +
          (res.skipped.length ? ` · ${res.skipped.length} skipped` : ''),
      );
    } catch (err) {
      message.error(
        apiErrorMessage(err, 'Could not import invitations. Please try again.'),
      );
    }
  };

  const createdCount = result?.created.length ?? 0;

  return (
    <Modal
      title="Import students from CSV"
      open={open}
      onCancel={close}
      width={760}
      className="cc-invite-modal cc-invite-import-modal"
      destroyOnClose
      footer={
        result
          ? [
              <Button
                key="done"
                type="primary"
                className="cc-invite-primary"
                onClick={close}
              >
                Done
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={close}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                className="cc-invite-primary"
                disabled={validRows.length === 0}
                loading={submitting}
                onClick={submit}
              >
                Invite {validRows.length} valid{' '}
                {validRows.length === 1 ? 'student' : 'students'}
              </Button>,
            ]
      }
    >
      {result ? (
        <div className="cc-invite-result">
          <div className="cc-invite-result-summary">
            <CheckCircle2 size={18} className="cc-invite-flag-ok" />
            <span>
              <b>{createdCount}</b> invitation{createdCount === 1 ? '' : 's'}{' '}
              created
              {result.skipped.length
                ? ` · ${result.skipped.length} skipped`
                : ''}
              .
            </span>
          </div>
          {result.skipped.length > 0 && (
            <div className="cc-invite-skipped">
              <div className="cc-invite-skipped-title">Skipped</div>
              <ul>
                {result.skipped.map((s) => (
                  <li key={s.email}>
                    <span className="cc-invite-skipped-email">{s.email}</span>
                    <span className="cc-invite-skipped-reason">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="cc-invite-import-help">
            Upload a CSV with the columns{' '}
            <code>name,email,grade,graduationYear,phone</code>. Only{' '}
            <b>email</b> is required, and <b>grade</b> must be a number from 1
            to 13. Rows are validated below before anything is sent.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFilePicked(f);
              // reset so the same file can be re-picked
              e.target.value = '';
            }}
          />
          <div className="cc-invite-drop">
            <Button
              className="cc-invite-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon size={15} /> Choose CSV file
            </Button>
            {fileName ? (
              <span className="cc-invite-filename">{fileName}</span>
            ) : (
              <span className="cc-invite-muted">No file selected</span>
            )}
          </div>

          {rows.length > 0 && (
            <>
              <div className="cc-invite-preview-meta">
                <CcPill variant="success">{validRows.length} valid</CcPill>
                {invalidCount > 0 ? (
                  <CcPill variant="warning">{invalidCount} invalid</CcPill>
                ) : null}
              </div>
              <div className="cc-invite-preview">
                <Table<ParsedCsvRow>
                  columns={previewColumns}
                  dataSource={rows}
                  rowKey="key"
                  size="small"
                  pagination={
                    rows.length > PREVIEW_PAGE_SIZE
                      ? { pageSize: PREVIEW_PAGE_SIZE, size: 'small' }
                      : false
                  }
                  rowClassName={(r) =>
                    r.valid ? '' : 'cc-invite-preview-row--invalid'
                  }
                />
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

export default CsvImportModal;
