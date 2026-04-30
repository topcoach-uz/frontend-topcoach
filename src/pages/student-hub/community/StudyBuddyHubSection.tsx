import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Pagination, Segmented, Space, Spin, Tag, Tabs, Typography, message } from 'antd';
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

const PAGE_SIZE = 6;

const { Paragraph } = Typography;

export type StudyBuddyHubSectionProps = {
  onOpenChat: (conversationId: string) => void;
};

export default function StudyBuddyHubSection({ onOpenChat }: StudyBuddyHubSectionProps) {
  const [mainTab, setMainTab] = useState<'discover' | 'requests'>('discover');
  const [reqDirection, setReqDirection] = useState<'in' | 'out'>('in');
  const [discoverPage, setDiscoverPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);

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
  const formatUsername = (value?: string | null) => {
    const cleaned = String(value || '').trim();
    if (!cleaned) return '';
    return cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
  };

  const items = discoverData?.items ?? [];
  const requestList = requestsData?.requests ?? [];

  useEffect(() => {
    setDiscoverPage(1);
    setReqPage(1);
  }, [mainTab]);

  useEffect(() => {
    setReqPage(1);
  }, [reqDirection]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / PAGE_SIZE) || 1);
    if (discoverPage > maxPage) setDiscoverPage(maxPage);
  }, [items.length, discoverPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(requestList.length / PAGE_SIZE) || 1);
    if (reqPage > maxPage) setReqPage(maxPage);
  }, [requestList.length, reqPage]);

  const discoverPageItems = useMemo(
    () => items.slice((discoverPage - 1) * PAGE_SIZE, discoverPage * PAGE_SIZE),
    [items, discoverPage],
  );

  const requestPageItems = useMemo(
    () => requestList.slice((reqPage - 1) * PAGE_SIZE, reqPage * PAGE_SIZE),
    [requestList, reqPage],
  );

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
                  <div className={styles.studyBuddyDiscoverGrid}>
                    {discoverPageItems.map((row) => {
                      const snippetTags = row.overlap.slice(0, 4);
                      const footerSnippet =
                        row.overlap.length > 0
                          ? row.overlap
                              .slice(0, 2)
                              .map((o) => o.label)
                              .join(' · ')
                          : null;

                      return (
                        <div key={row.userId} className={styles.studyBuddyInstaCard}>
                          <div className={styles.studyBuddyInstaInner}>
                            <Avatar size={104} src={row.avatarUrl || undefined} className={styles.studyBuddyInstaAvatar}>
                              {row.name.charAt(0)}
                            </Avatar>
                            {row.username ? (
                              <div className={styles.studyBuddyInstaHandlePill} title={formatUsername(row.username)}>
                                {formatUsername(row.username)}
                              </div>
                            ) : (
                              <div style={{ height: 8 }} aria-hidden />
                            )}
                            <div className={styles.studyBuddyInstaName}>{row.name}</div>
                            {row.matchExplanation ? (
                              <p className={styles.studyBuddyInstaBio}>{row.matchExplanation}</p>
                            ) : snippetTags.length > 0 ? (
                              <div className={styles.studyBuddyInstaTagRow}>
                                {snippetTags.map((o) => (
                                  <Tag key={`${o.field}-${o.value}`} color="processing" style={{ margin: 0 }}>
                                    {o.label}
                                  </Tag>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.studyBuddyInstaBio}>
                                No shared study-buddy tags yet — connect to find common ground.
                              </p>
                            )}
                            <div className={styles.studyBuddyInstaFooterPill} title={footerSnippet || undefined}>
                              {footerSnippet
                                ? `${footerSnippet}${row.overlap.length > 2 ? '…' : ''}`
                                : `${row.overlapCount} shared interest${row.overlapCount === 1 ? '' : 's'}`}
                            </div>
                            <div className={styles.studyBuddyInstaActions}>
                              {row.requestStatus === 'none' && (
                                <Button
                                  type="primary"
                                  icon={<UserPlus size={18} />}
                                  loading={sending}
                                  onClick={() => void handleSend(row.userId)}
                                >
                                  Request
                                </Button>
                              )}
                              {row.requestStatus === 'outgoing_pending' && (
                                <>
                                  <Tag color="gold" style={{ margin: 0, alignSelf: 'center' }}>
                                    Pending
                                  </Tag>
                                  <Button
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
                                    Cancel request
                                  </Button>
                                </>
                              )}
                              {row.requestStatus === 'incoming_pending' && (
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                  <Tag color="blue" style={{ margin: 0, textAlign: 'center', width: '100%' }}>
                                    Wants to connect
                                  </Tag>
                                  <Button
                                    type="primary"
                                    loading={accepting}
                                    onClick={() => row.incomingRequestId && void handleAccept(row.incomingRequestId)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
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
                        </div>
                      );
                    })}
                  </div>
                )}
                {items.length > PAGE_SIZE && (
                  <Pagination
                    className={styles.studyBuddyPagination}
                    current={discoverPage}
                    pageSize={PAGE_SIZE}
                    total={items.length}
                    onChange={(p) => setDiscoverPage(p)}
                    showSizeChanger={false}
                  />
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
                    {requestPageItems.map((r) => {
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
                    {requestList.length > PAGE_SIZE && (
                      <Pagination
                        className={styles.studyBuddyPagination}
                        current={reqPage}
                        pageSize={PAGE_SIZE}
                        total={requestList.length}
                        onChange={(p) => setReqPage(p)}
                        showSizeChanger={false}
                      />
                    )}
                    {requestList.length === 0 && (
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
