import React, { useState } from 'react';
import { Avatar, Button, Card, Segmented, Space, Spin, Tag, Tabs, Typography, message } from 'antd';
import { UserPlus } from 'lucide-react';
import {
  useStudyBuddyAcceptRequestMutation,
  useStudyBuddyCancelRequestMutation,
  useStudyBuddyDiscoverQuery,
  useStudyBuddyRejectRequestMutation,
  useStudyBuddyRequestsQuery,
  useStudyBuddySendRequestMutation,
} from 'src/app/services/student-hub/studyBuddyApi';
import { getLatestCreatedImg } from 'src/utils';
import styles from './communityHubMock.module.scss';

const { Paragraph } = Typography;

export type StudyBuddyHubSectionProps = {
  onOpenChat: (conversationId: string) => void;
};

export default function StudyBuddyHubSection({ onOpenChat }: StudyBuddyHubSectionProps) {
  const [mainTab, setMainTab] = useState<'discover' | 'requests'>('discover');
  const [reqDirection, setReqDirection] = useState<'in' | 'out'>('in');

  const {
    data: discoverData,
    isLoading: discoverLoading,
    refetch: refetchDiscover,
  } = useStudyBuddyDiscoverQuery(undefined, { refetchOnMountOrArgChange: true });

  const { data: requestsData, isLoading: requestsLoading } = useStudyBuddyRequestsQuery(
    { direction: reqDirection },
    { skip: mainTab !== 'requests', refetchOnMountOrArgChange: true },
  );

  const [sendRequest, { isLoading: sending }] = useStudyBuddySendRequestMutation();
  const [cancelRequest, { isLoading: cancelling }] = useStudyBuddyCancelRequestMutation();
  const [acceptRequest, { isLoading: accepting }] = useStudyBuddyAcceptRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useStudyBuddyRejectRequestMutation();

  const items = discoverData?.items ?? [];

  const handleSend = async (targetUserId: string) => {
    try {
      await sendRequest({ targetUserId }).unwrap();
      message.success('Study Buddy request sent.');
      void refetchDiscover();
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Could not send request.');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await acceptRequest(id).unwrap();
      message.success('You are connected. Opening chat…');
      onOpenChat(res.conversationId);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Could not accept.');
    }
  };

  return (
    <div className={styles.studyBuddyHub}>
      <Tabs
        activeKey={mainTab}
        onChange={(k) => setMainTab(k as 'discover' | 'requests')}
        items={[
          {
            key: 'discover',
            label: 'Discover',
            children: (
              <>
                {discoverLoading && !items.length ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : items.length === 0 ? (
                  <Card bordered={false} className={styles.sectionCard}>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      No community peers to show yet. Check back as more students enable Community mode.
                    </Paragraph>
                  </Card>
                ) : (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {items.map((row) => (
                      <Card key={row.userId} bordered={false} className={styles.sectionCard}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <Avatar size={48} src={row.avatarUrl || undefined}>
                            {row.name.charAt(0)}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{row.name}</div>
                            {row.username && (
                              <div style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>@{row.username}</div>
                            )}
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {row.overlap.slice(0, 6).map((o) => (
                                <Tag key={`${o.field}-${o.value}`} color="processing">
                                  {o.label}
                                </Tag>
                              ))}
                              {row.overlap.length === 0 && <Tag>No overlap yet</Tag>}
                            </div>
                            <div style={{ marginTop: 10, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                              {row.overlapCount} shared interest{row.overlapCount === 1 ? '' : 's'}
                            </div>
                            {row.matchExplanation && (
                              <div style={{ marginTop: 8, color: '#475569', fontSize: 12, lineHeight: 1.45 }}>
                                {row.matchExplanation}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                            {row.requestStatus === 'none' && (
                              <Button
                                type="primary"
                                icon={<UserPlus size={16} />}
                                loading={sending}
                                onClick={() => void handleSend(row.userId)}
                              >
                                Request
                              </Button>
                            )}
                            {row.requestStatus === 'outgoing_pending' && (
                              <>
                                <Tag color="gold">Pending</Tag>
                                <Button
                                  size="small"
                                  loading={cancelling}
                                  onClick={async () => {
                                    if (!row.outgoingRequestId) return;
                                    try {
                                      await cancelRequest(row.outgoingRequestId).unwrap();
                                      message.info('Request cancelled.');
                                      void refetchDiscover();
                                    } catch (e: any) {
                                      message.error(e?.data?.message || 'Could not cancel.');
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {row.requestStatus === 'incoming_pending' && (
                              <Space direction="vertical" align="end">
                                <Tag color="blue">Wants to connect</Tag>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={accepting}
                                  onClick={() => row.incomingRequestId && void handleAccept(row.incomingRequestId)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  loading={rejecting}
                                  onClick={async () => {
                                    if (!row.incomingRequestId) return;
                                    try {
                                      await rejectRequest(row.incomingRequestId).unwrap();
                                      message.success('Declined.');
                                      void refetchDiscover();
                                    } catch (e: any) {
                                      message.error(e?.data?.message || 'Could not reject.');
                                    }
                                  }}
                                >
                                  Decline
                                </Button>
                              </Space>
                            )}
                            {row.requestStatus === 'connected' && row.conversationId && (
                              <Button type="primary" onClick={() => onOpenChat(row.conversationId!)}>
                                Message
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                )}
              </>
            ),
          },
          {
            key: 'requests',
            label: 'Requests',
            children: (
              <>
                <Segmented
                  options={[
                    { label: 'Incoming', value: 'in' },
                    { label: 'Outgoing', value: 'out' },
                  ]}
                  value={reqDirection}
                  onChange={(v) => setReqDirection(v as 'in' | 'out')}
                  style={{ marginBottom: 14 }}
                />
                {requestsLoading ? (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {(requestsData?.requests ?? []).map((r) => {
                      const other = reqDirection === 'in' ? r.requester : r.addressee;
                      const name = other?.profile?.name ?? 'Peer';
                      const avatar = getLatestCreatedImg((other?.profile?.media as any[]) || []);
                      return (
                        <Card key={r.id} bordered={false} className={styles.sectionCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar size={40} src={avatar || undefined}>
                                {name.charAt(0)}
                              </Avatar>
                              <div>
                                <div style={{ fontWeight: 800 }}>{name}</div>
                                <Tag style={{ marginTop: 6 }}>{r.status}</Tag>
                              </div>
                            </div>
                            <Space wrap>
                              {r.status === 'pending' && reqDirection === 'in' && (
                                <>
                                  <Button type="primary" size="small" loading={accepting} onClick={() => void handleAccept(r.id)}>
                                    Accept
                                  </Button>
                                  <Button
                                    size="small"
                                    danger
                                    loading={rejecting}
                                    onClick={async () => {
                                      try {
                                        await rejectRequest(r.id).unwrap();
                                        message.success('Declined.');
                                      } catch (e: any) {
                                        message.error(e?.data?.message || 'Could not reject.');
                                      }
                                    }}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                              {r.status === 'pending' && reqDirection === 'out' && (
                                <Button
                                  size="small"
                                  loading={cancelling}
                                  onClick={async () => {
                                    try {
                                      await cancelRequest(r.id).unwrap();
                                      message.info('Cancelled.');
                                    } catch (e: any) {
                                      message.error(e?.data?.message || 'Could not cancel.');
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                              {r.status === 'accepted' && r.peerConversationId && (
                                <Button type="link" onClick={() => onOpenChat(r.peerConversationId!)}>
                                  Open chat
                                </Button>
                              )}
                            </Space>
                          </div>
                        </Card>
                      );
                    })}
                    {(requestsData?.requests ?? []).length === 0 && (
                      <Paragraph type="secondary">No requests in this tab.</Paragraph>
                    )}
                  </Space>
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
