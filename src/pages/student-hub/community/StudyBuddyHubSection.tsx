import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Pagination, Segmented, Space, Spin, Tag, Tabs, Typography, message } from 'antd';
import { Search, UserPlus, X } from 'lucide-react';
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
  const [mainTab, setMainTab] = useState<'discover' | 'requests' | 'connected'>('discover');
  const [reqDirection, setReqDirection] = useState<'in' | 'out'>('in');
  const [discoverPage, setDiscoverPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);
  const [connectedPage, setConnectedPage] = useState(1);
  // Search query (name + username, case-insensitive). Stays the same
  // when the user flips tabs so they can scan the same query across
  // Discover / Requests / Connected without retyping.
  const [searchQuery, setSearchQuery] = useState('');

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

  // Normalised search needle. Empty string = no filter.
  const searchNeedle = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  /** Case-insensitive match against display name + @handle. */
  const matchesSearch = (name?: string | null, username?: string | null) => {
    if (!searchNeedle) return true;
    const hay = `${name ?? ''} ${username ?? ''}`.toLowerCase();
    return hay.includes(searchNeedle);
  };

  // Split the discover list into "still to discover" and "already
  // connected" so each tab gets its own subset (and its own pagination).
  // Connected peers should only appear under the Connected tab. Search
  // narrows each list by display name or @handle.
  const discoverItems = useMemo(
    () =>
      items
        .filter((r) => r.requestStatus !== 'connected')
        .filter((r) => matchesSearch(r.name, r.username)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, searchNeedle],
  );
  const connectedItems = useMemo(
    () =>
      items
        .filter((r) => r.requestStatus === 'connected')
        .filter((r) => matchesSearch(r.name, r.username)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, searchNeedle],
  );

  useEffect(() => {
    setDiscoverPage(1);
    setReqPage(1);
    setConnectedPage(1);
  }, [mainTab]);

  useEffect(() => {
    setReqPage(1);
  }, [reqDirection]);

  // Reset pagination back to page 1 whenever the user types a new
  // search — otherwise they can land on an empty page (e.g. were on
  // page 3 of 5, then a search narrows the result set to 2 items).
  useEffect(() => {
    setDiscoverPage(1);
    setReqPage(1);
    setConnectedPage(1);
  }, [searchNeedle]);

  // Requests tab uses the requester/addressee profile depending on
  // direction — filter by whichever is being shown.
  const filteredRequests = useMemo(
    () =>
      requestList.filter((r) => {
        const other = reqDirection === 'in' ? r.requester : r.addressee;
        return matchesSearch(
          other?.profile?.name,
          (other?.profile as { username?: string | null } | undefined)?.username,
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestList, reqDirection, searchNeedle],
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(discoverItems.length / PAGE_SIZE) || 1);
    if (discoverPage > maxPage) setDiscoverPage(maxPage);
  }, [discoverItems.length, discoverPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE) || 1);
    if (reqPage > maxPage) setReqPage(maxPage);
  }, [filteredRequests.length, reqPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(connectedItems.length / PAGE_SIZE) || 1);
    if (connectedPage > maxPage) setConnectedPage(maxPage);
  }, [connectedItems.length, connectedPage]);

  const discoverPageItems = useMemo(
    () => discoverItems.slice((discoverPage - 1) * PAGE_SIZE, discoverPage * PAGE_SIZE),
    [discoverItems, discoverPage],
  );

  const connectedPageItems = useMemo(
    () => connectedItems.slice((connectedPage - 1) * PAGE_SIZE, connectedPage * PAGE_SIZE),
    [connectedItems, connectedPage],
  );

  const requestPageItems = useMemo(
    () => filteredRequests.slice((reqPage - 1) * PAGE_SIZE, reqPage * PAGE_SIZE),
    [filteredRequests, reqPage],
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

  // Single card renderer reused by Discover and Connected tabs. The
  // action area branches on requestStatus so connected peers see a
  // "Message" button and pending ones see request controls.
  type BuddyRow = (typeof items)[number];
  const renderCard = (row: BuddyRow) => {
    const snippetTags = row.overlap.slice(0, 4);
    const footerSnippet =
      row.overlap.length > 0
        ? row.overlap.slice(0, 2).map((o) => o.label).join(' · ')
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
                <Tag color="gold" style={{ margin: 0, alignSelf: 'center' }}>Pending</Tag>
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
  };

  return (
    <div className={styles.studyBuddyHub}>
      <div className={styles.studyBuddySearchRow}>
        <Input
          allowClear={{
            clearIcon: <X size={14} aria-label="Clear search" />,
          }}
          prefix={<Search size={16} style={{ color: 'rgba(0,0,0,0.45)' }} />}
          placeholder="Search by name or @handle"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="large"
          aria-label="Search study buddies by name"
        />
      </div>
      <Tabs
        activeKey={mainTab}
        onChange={(k) => setMainTab(k as 'discover' | 'requests' | 'connected')}
        items={[
          {
            key: 'discover',
            label: `Discover${discoverItems.length ? ` · ${discoverItems.length}` : ''}`,
            children: (
              <>
                {discoverLoading && !items.length ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : discoverItems.length === 0 ? (
                  <Card bordered={false} className={styles.sectionCard}>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {searchNeedle
                        ? `No peers match “${searchQuery}”.`
                        : 'No community peers to show yet. Check back as more students enable Community mode.'}
                    </Paragraph>
                  </Card>
                ) : (
                  <div className={styles.studyBuddyDiscoverGrid}>
                    {discoverPageItems.map(renderCard)}
                  </div>
                )}
                {discoverItems.length > PAGE_SIZE && (
                  <Pagination
                    className={styles.studyBuddyPagination}
                    current={discoverPage}
                    pageSize={PAGE_SIZE}
                    total={discoverItems.length}
                    onChange={(p) => setDiscoverPage(p)}
                    showSizeChanger={false}
                  />
                )}
              </>
            ),
          },
          {
            key: 'requests',
            label: `Requests${filteredRequests.length ? ` · ${filteredRequests.length}` : ''}`,
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
                    {filteredRequests.length > PAGE_SIZE && (
                      <Pagination
                        className={styles.studyBuddyPagination}
                        current={reqPage}
                        pageSize={PAGE_SIZE}
                        total={filteredRequests.length}
                        onChange={(p) => setReqPage(p)}
                        showSizeChanger={false}
                      />
                    )}
                    {filteredRequests.length === 0 && (
                      <Paragraph type="secondary">
                        {searchNeedle
                          ? `No requests match “${searchQuery}”.`
                          : 'No requests in this tab.'}
                      </Paragraph>
                    )}
                  </Space>
                )}
              </>
            ),
          },
          {
            key: 'connected',
            label: `Connected${connectedItems.length ? ` · ${connectedItems.length}` : ''}`,
            children: (
              <>
                {discoverLoading && !connectedItems.length ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : connectedItems.length === 0 ? (
                  <Card bordered={false} className={styles.sectionCard}>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {searchNeedle ? (
                        <>No connected buddies match “{searchQuery}”.</>
                      ) : (
                        <>
                          No study buddies yet. Send a request from{' '}
                          <a onClick={() => setMainTab('discover')} style={{ cursor: 'pointer' }}>Discover</a>{' '}
                          and we'll show your connections here once they accept.
                        </>
                      )}
                    </Paragraph>
                  </Card>
                ) : (
                  <div className={styles.studyBuddyDiscoverGrid}>
                    {connectedPageItems.map(renderCard)}
                  </div>
                )}
                {connectedItems.length > PAGE_SIZE && (
                  <Pagination
                    className={styles.studyBuddyPagination}
                    current={connectedPage}
                    pageSize={PAGE_SIZE}
                    total={connectedItems.length}
                    onChange={(p) => setConnectedPage(p)}
                    showSizeChanger={false}
                  />
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
