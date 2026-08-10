import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Tabs, Spin, Tooltip, message } from 'antd';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from 'src/app/api';
import { useAdminEnrollMutation, useAdminUnenrollMutation } from 'src/app/services/fullSupportApi';
import { AcPill } from 'src/pages/admin/console/components/AcPill';
import { cleanUserName } from 'src/pages/admin/console/utils';
import './ManageAccessModal.scss';

/**
 * Unified "Manage access" modal opened from each enrollments row.
 * Two tabs: Programs (Admissions / SAT / Full Support grant + revoke)
 * and Community (toggle community-experience mode).
 *
 * Every grant/revoke uses an in-modal confirm step rather than a nested
 * popconfirm — keeps everything on one surface, dark-themed.
 */

export type ManageAccessRow = {
  /** Current enrollment id for the row (null if user has no enrollment yet). */
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  /** Which course this row represents — used to pre-select the right program. */
  courseName?: 'admissions' | 'sat' | 'full_support';
  telegramStatus: string | null;
  communityAccessEnabled?: boolean;
};

/** Server row shape we re-fetch when the modal opens (covers all programs for the user). */
type ProgramRow = {
  id: string | null;
  courseName: 'admissions' | 'sat' | 'full_support';
  courseType: string | null;
  paymentStatus: string | null;
  status: string | null;
  accessGrantedAt: string | null;
};

type Program = 'admissions' | 'full_support';

type ConfirmIntent =
  | { kind: 'grant'; program: Program; plan?: 'standard' | 'premium'; enrollmentId: string | null }
  | { kind: 'revoke'; program: Program; enrollmentId: string | null }
  | { kind: 'community'; enable: boolean };

const PROGRAM_LABEL: Record<Program, string> = {
  admissions: 'Admissions Program',
  full_support: 'Full Support Mentorship',
};

type Props = {
  open: boolean;
  row: ManageAccessRow | null;
  onClose: () => void;
  /** Tell the parent to refetch the table after a successful mutation. */
  onMutated: () => void;
};

export const ManageAccessModal: React.FC<Props> = ({ open, row, onClose, onMutated }) => {
  const [activeTab, setActiveTab] = useState<'programs' | 'community'>('programs');
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmIntent | null>(null);
  const [adminPlan, setAdminPlan] = useState<'standard' | 'premium'>('standard');
  const [communityEnabled, setCommunityEnabled] = useState<boolean>(false);

  const [adminEnroll] = useAdminEnrollMutation();
  const [adminUnenroll] = useAdminUnenrollMutation();

  const isTelegramConnected = row?.telegramStatus === 'connected';
  const subjectName = useMemo(
    () => (row ? cleanUserName(row.userName, row.userEmail) : ''),
    [row],
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab('programs');
    setConfirm(null);
    setAdminPlan('standard');
    setCommunityEnabled(Boolean(row?.communityAccessEnabled));
  }, [open, row?.communityAccessEnabled]);

  // Fetch the full per-program picture for this user when the modal opens.
  useEffect(() => {
    if (!open || !row) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.request({
          path: `/program-dashboard?search=${encodeURIComponent(row.userEmail)}`,
          method: 'GET',
          secure: true,
        });
        const raw = (res as { data?: unknown })?.data;
        const list: ProgramRow[] = Array.isArray(raw)
          ? (raw as ProgramRow[])
          : Array.isArray((raw as { data?: ProgramRow[] })?.data)
            ? ((raw as { data: ProgramRow[] }).data)
            : [];
        if (cancelled) return;
        // Keep only rows that belong to the same user.
        const mine = list.filter(
          (r: ProgramRow & { userId?: string }) => (r as { userId?: string }).userId === row.userId,
        );
        setPrograms(mine);
      } catch {
        if (!cancelled) setPrograms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [open, row]);

  const programState = (program: Program) => {
    const match = programs.find((p) => p.courseName === program);
    if (!match) return { hasAccess: false, enrollmentId: null as string | null, plan: null as string | null };
    const hasAccess = match.paymentStatus === 'completed' && match.status === 'completed';
    return { hasAccess, enrollmentId: match.id, plan: match.courseType };
  };

  const runConfirmedAction = async () => {
    if (!confirm || !row) return;
    setSubmitting(true);
    try {
      if (confirm.kind === 'community') {
        await api.request({
          path: `/program-dashboard/users/${row.userId}/community-access`,
          method: 'POST',
          secure: true,
          body: { enabled: confirm.enable },
        });
        setCommunityEnabled(confirm.enable);
        message.success(confirm.enable ? 'Community access granted.' : 'Community access revoked.');
      } else if (confirm.kind === 'grant') {
        if (confirm.program === 'full_support') {
          await adminEnroll({ userId: row.userId }).unwrap();
          // Backend's enroll() auto-grants community access too — reflect
          // that in the modal so the Community tab flips without the
          // admin having to re-open the row.
          setCommunityEnabled(true);
          message.success(
            `${subjectName} enrolled in Full Support — Community access unlocked.`,
          );
        } else {
          // admissions
          const params = new URLSearchParams();
          params.append('courseName', confirm.program);
          params.append('courseType', confirm.plan ?? 'standard');
          const path = confirm.enrollmentId
            ? `/program-dashboard/enrollments/${confirm.enrollmentId}/grant-access?${params.toString()}`
            : `/program-dashboard/users/${row.userId}/grant-access?${params.toString()}`;
          await api.request({ path, method: 'POST', secure: true });
          message.success(`Access granted to ${PROGRAM_LABEL[confirm.program]}.`);
        }
      } else {
        // revoke
        if (confirm.program === 'full_support') {
          await adminUnenroll(row.userId).unwrap();
          message.success(`${subjectName} removed from Full Support.`);
        } else if (confirm.enrollmentId) {
          await api.request({
            path: `/program-dashboard/enrollments/${confirm.enrollmentId}`,
            method: 'DELETE',
            secure: true,
          });
          message.success(`Access revoked from ${PROGRAM_LABEL[confirm.program]}.`);
        }
      }
      setConfirm(null);
      onMutated();
      // Refresh local program state so the modal reflects the change without closing.
      try {
        const res = await api.request({
          path: `/program-dashboard?search=${encodeURIComponent(row.userEmail)}`,
          method: 'GET',
          secure: true,
        });
        const raw = (res as { data?: unknown })?.data;
        const list: ProgramRow[] = Array.isArray(raw)
          ? (raw as ProgramRow[])
          : Array.isArray((raw as { data?: ProgramRow[] })?.data)
            ? ((raw as { data: ProgramRow[] }).data)
            : [];
        setPrograms(list.filter((r: ProgramRow & { userId?: string }) => (r as { userId?: string }).userId === row.userId));
      } catch {
        // non-fatal — parent table will refetch via onMutated()
      }
    } catch (err) {
      const msg = (err as { data?: { message?: string }; message?: string })?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'Action failed. Try again.';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgramRow = (program: Program) => {
    const { hasAccess, enrollmentId, plan } = programState(program);
    // Community membership includes the Admissions course content on the
    // backend (CourseEnrollmentService.getEnrollmentStatus) — reflect that
    // here so admins don't think the student is locked out.
    const viaCommunity = program === 'admissions' && !hasAccess && communityEnabled;
    const grantDisabled = !isTelegramConnected && program !== 'full_support';
    const grantTip = grantDisabled ? 'User must have Telegram connected to grant access.' : '';
    return (
      <div className="ac-manage-access__row" key={program}>
        <div className="ac-manage-access__row-meta">
          <span className="ac-manage-access__row-title">{PROGRAM_LABEL[program]}</span>
          <span className="ac-manage-access__row-sub">
            {hasAccess ? (
              <>Active{plan && program === 'admissions' ? ` · ${plan.toUpperCase()}` : ''}</>
            ) : viaCommunity ? (
              'Course content included with Community access'
            ) : (
              'No access'
            )}
            {program === 'full_support' && (
              <> · Includes Community access automatically</>
            )}
            {!hasAccess && grantDisabled && (
              <span style={{ color: '#f59e0b' }}> · Telegram not connected — direct grant unavailable</span>
            )}
          </span>
        </div>
        <div className="ac-manage-access__row-actions">
          <AcPill variant={hasAccess || viaCommunity ? 'mint' : 'neutral'}>
            {hasAccess ? 'Active' : viaCommunity ? 'Via Community' : 'Inactive'}
          </AcPill>
          {hasAccess ? (
            <button
              type="button"
              className="ac-manage-access__btn ac-manage-access__btn--revoke"
              onClick={() => setConfirm({ kind: 'revoke', program, enrollmentId })}
            >
              Revoke
            </button>
          ) : (
            <>
              {program === 'admissions' && (
                <div className="ac-manage-access__plan" role="group" aria-label="Plan">
                  {(['standard', 'premium'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`ac-manage-access__plan-btn ${adminPlan === p ? 'ac-manage-access__plan-btn--active' : ''}`}
                      onClick={() => setAdminPlan(p)}
                    >
                      {p === 'standard' ? 'Standard' : 'Premium'}
                    </button>
                  ))}
                </div>
              )}
              <Tooltip title={grantTip}>
                <button
                  type="button"
                  className="ac-manage-access__btn ac-manage-access__btn--grant"
                  disabled={grantDisabled}
                  onClick={() =>
                    setConfirm({
                      kind: 'grant',
                      program,
                      plan: program === 'admissions' ? adminPlan : undefined,
                      enrollmentId,
                    })
                  }
                >
                  Grant
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderConfirm = () => {
    if (!confirm || !row) return null;
    const isRevoke = confirm.kind === 'revoke' || (confirm.kind === 'community' && !confirm.enable);
    const programLabel = confirm.kind === 'community' ? null : PROGRAM_LABEL[confirm.program];
    const title =
      confirm.kind === 'community'
        ? confirm.enable
          ? 'Grant community access?'
          : 'Revoke community access?'
        : confirm.kind === 'grant'
          ? `Grant ${programLabel}?`
          : `Revoke ${programLabel}?`;
    const body =
      confirm.kind === 'community'
        ? confirm.enable
          ? `${subjectName} will get full Community features unlocked, including the Admissions course content — no Telegram connection required.`
          : `${subjectName} will be moved back to the standard experience. Admissions course access included with Community is removed too (direct enrollments are kept).`
        : confirm.kind === 'grant'
          ? `${subjectName} will get access to ${programLabel}${
              confirm.kind === 'grant' && confirm.plan ? ` on the ${confirm.plan.toUpperCase()} plan` : ''
            }.${
              confirm.program === 'full_support'
                ? ' Community access is unlocked automatically — no placement test or subscription required.'
                : ' They must have Telegram connected for course content.'
            }`
          : `${subjectName} will lose access to ${programLabel}. The enrollment row is removed; you can re-grant later.`;

    return (
      <div className="ac-manage-access__confirm">
        <span
          className={`ac-manage-access__confirm-icon ${
            isRevoke ? 'ac-manage-access__confirm-icon--warn' : 'ac-manage-access__confirm-icon--ok'
          }`}
        >
          {isRevoke ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        </span>
        <div className="ac-manage-access__confirm-title">{title}</div>
        <div className="ac-manage-access__confirm-body">{body}</div>
        <div className="ac-manage-access__confirm-actions">
          <button
            type="button"
            className="ac-manage-access__btn ac-manage-access__btn--cancel"
            disabled={submitting}
            onClick={() => setConfirm(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`ac-manage-access__btn ${isRevoke ? 'ac-manage-access__btn--revoke' : 'ac-manage-access__btn--grant'}`}
            disabled={submitting}
            onClick={() => void runConfirmedAction()}
          >
            {submitting ? 'Working…' : isRevoke ? 'Yes, revoke' : 'Yes, grant'}
          </button>
        </div>
      </div>
    );
  };

  const renderCommunityTab = () => (
    <div className="ac-manage-access__community">
      <div className="ac-manage-access__community-title">
        {communityEnabled ? 'Community access is active' : 'Standard experience'}
      </div>
      <div className="ac-manage-access__community-body">
        {communityEnabled
          ? `${subjectName} has Community features unlocked, including the Admissions course content. Revoking moves them back to the standard experience.`
          : `${subjectName} is on the standard experience. Granting unlocks Community features and the Admissions course content.`}
      </div>
      <div className="ac-manage-access__community-actions">
        <button
          type="button"
          className={`ac-manage-access__btn ${communityEnabled ? 'ac-manage-access__btn--revoke' : 'ac-manage-access__btn--grant'}`}
          onClick={() => setConfirm({ kind: 'community', enable: !communityEnabled })}
        >
          {communityEnabled ? 'Revoke community' : 'Grant community'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (submitting) return;
        onClose();
      }}
      title={
        <span
          style={{
            color: '#f4f4f5',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Manage access
        </span>
      }
      footer={null}
      width={560}
      destroyOnClose
      rootClassName="ac-manage-access-modal"
      classNames={{ mask: 'ac-manage-access-mask' }}
      // Hex literals (not CSS vars) — the Modal portals to <body>, where
      // --ac-* variable resolution is unreliable (admin-console-tokens.scss
      // is scoped via :root but AntD v5's runtime CSS can win at the same
      // specificity layer). Hardcoded hexes match var(--ac-bg-surface).
      styles={{
        content: {
          background: '#252a35',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: 0,
          color: '#f4f4f5',
        },
        header: {
          background: '#252a35',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          padding: '18px 24px 14px',
          margin: 0,
          color: '#f4f4f5',
        },
        body: {
          background: 'transparent',
          color: '#f4f4f5',
          padding: '20px 24px 24px',
        },
        mask: {
          background: 'rgba(6, 8, 12, 0.78)',
          backdropFilter: 'blur(3px)',
        },
      }}
    >
      {row && (
        <div className="ac-manage-access">
          <div className="ac-manage-access__subject">
            For <strong>{subjectName}</strong> · {row.userEmail}
          </div>

          {confirm ? (
            renderConfirm()
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as 'programs' | 'community')}
              items={[
                {
                  key: 'programs',
                  label: 'Programs',
                  children: loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                      <Spin />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {renderProgramRow('admissions')}
                      {renderProgramRow('full_support')}
                    </div>
                  ),
                },
                {
                  key: 'community',
                  label: 'Community',
                  children: renderCommunityTab(),
                },
              ]}
            />
          )}
        </div>
      )}
    </Modal>
  );
};
