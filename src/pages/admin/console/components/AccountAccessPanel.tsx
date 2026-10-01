import { useState } from 'react';
import { Alert, Button, Input, Modal, Space, Spin, Typography } from 'antd';
import {
  useChangeAccountAccessMutation,
  useGetAccountAccessQuery,
} from 'src/app/services/accountAccessApi';
import { useAdminConsole } from '../AdminConsoleContext';
import { AcPill } from './AcPill';

const { Text, Paragraph } = Typography;

function failureMessage(error: unknown) {
  const data = (error as { data?: { message?: string | string[] } })?.data;
  if (Array.isArray(data?.message)) return data.message.join(' ');
  return typeof data?.message === 'string'
    ? data.message
    : 'The change could not be confirmed. Refresh the account status before trying again.';
}

export default function AccountAccessPanel({ userId }: { userId: string }) {
  const { role } = useAdminConsole();
  const {
    currentData: access,
    isFetching,
    isError,
    refetch,
  } = useGetAccountAccessQuery(userId, {
    skip: role !== 'SuperAdmin',
    refetchOnMountOrArgChange: true,
  });
  const [changeAccess, { isLoading: saving }] =
    useChangeAccountAccessMutation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState<{
    deactivated: boolean;
    expectedVersion: number;
    reason: string;
  } | null>(null);

  if (role !== 'SuperAdmin') return null;
  if (!access && isFetching)
    return <Spin aria-label="Loading account access" />;
  if (isError || !access) {
    return (
      <Alert
        type="error"
        message="Account access status is unavailable"
        action={
          <Button onClick={() => refetch()} loading={isFetching}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!access.isStaff) return null;

  const blocked =
    access.isSelf || (!access.deactivated && access.blockers.length > 0);

  async function confirmChange() {
    if (!confirmation || saving) return;
    setError('');
    setNotice('');
    try {
      await changeAccess({ userId, ...confirmation }).unwrap();
      setNotice(
        confirmation.deactivated
          ? 'Account deactivated. Student records and staff history are preserved.'
          : 'Account reactivated. The staff member must sign in again.',
      );
      setReason('');
    } catch (cause) {
      setError(failureMessage(cause));
    } finally {
      setConfirmation(null);
      void refetch();
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Text strong>Staff account access</Text>
        <AcPill variant={access.deactivated ? 'danger' : 'mint'}>
          {access.deactivated ? 'Deactivated' : 'Active'}
        </AcPill>
        <Button
          size="small"
          onClick={() => refetch()}
          loading={isFetching}
          disabled={saving}
        >
          Refresh
        </Button>
      </Space>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Deactivation blocks sign-in and ends existing sessions. Student records,
        submissions, payments, and staff history are preserved. Reactivation
        requires a new sign-in and keeps the mentor hidden from the public
        directory until reviewed.
      </Paragraph>
      {blocked && (
        <Alert
          type="warning"
          showIcon
          message="Resolve before changing access"
          description={
            access.isSelf ? (
              'You cannot change your own account access.'
            ) : (
              <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                {access.blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          }
        />
      )}
      {error && <Alert type="error" showIcon message={error} />}
      {notice && <Alert type="success" showIcon message={notice} />}
      <label htmlFor={`access-reason-${userId}`}>
        Reason for access change
      </label>
      <Input.TextArea
        id={`access-reason-${userId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        maxLength={500}
        showCount
        disabled={blocked || saving}
        placeholder="Record the reason for this staff access change"
      />
      <Button
        danger={!access.deactivated}
        type="primary"
        loading={saving}
        disabled={blocked || isFetching || !reason.trim()}
        onClick={() =>
          setConfirmation({
            deactivated: !access.deactivated,
            expectedVersion: access.version,
            reason: reason.trim(),
          })
        }
      >
        {access.deactivated ? 'Reactivate account' : 'Deactivate account'}
      </Button>
      {access.history.length > 0 && (
        <div>
          <Text strong>Recent access changes</Text>
          {access.history.map((entry, index) => (
            <div key={`${entry.createdAt}-${index}`} style={{ marginTop: 12 }}>
              <Text>
                {entry.action === 'deactivated' ? 'Deactivated' : 'Reactivated'}{' '}
                · {new Date(entry.createdAt).toLocaleString()}
              </Text>
              <Paragraph style={{ marginBottom: 2, whiteSpace: 'pre-wrap' }}>
                {entry.reason}
              </Paragraph>
              <Text
                type="secondary"
                style={{ fontSize: 12, overflowWrap: 'anywhere' }}
              >
                By account {entry.actorUserId}
              </Text>
            </div>
          ))}
        </div>
      )}
      <Modal
        title={
          confirmation?.deactivated
            ? 'Deactivate this staff account?'
            : 'Reactivate this staff account?'
        }
        open={!!confirmation}
        onCancel={() => {
          if (!saving) setConfirmation(null);
        }}
        onOk={confirmChange}
        confirmLoading={saving}
        okText={
          confirmation?.deactivated
            ? 'Deactivate account'
            : 'Reactivate account'
        }
        okButtonProps={{ danger: confirmation?.deactivated }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
      >
        <Paragraph>
          {confirmation?.deactivated
            ? 'This staff member will lose access across TopCoach. Their records and student work will remain available to authorized staff.'
            : 'This staff member can sign in again with their current roles. Previous sign-in sessions will remain invalid.'}
        </Paragraph>
        <Paragraph>
          <Text strong>Reason: </Text>
          {confirmation?.reason}
        </Paragraph>
      </Modal>
    </Space>
  );
}
