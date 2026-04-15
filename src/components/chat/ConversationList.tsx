import React, { useMemo, useEffect, useState } from 'react';
import { List, Avatar, Empty, Spin, Typography, Input, Segmented } from 'antd';
import { User, Search } from 'lucide-react';
import { useGetConversationsQuery, chatApi } from 'src/app/services/chat/chatApi';
import {
  Conversation,
  isConversationArray,
} from 'src/app/services/chat/types';
import { useTypedSelector, useAppDispatch } from 'src/app/store';
import { useSocket } from 'src/lib/socket';
import { getLatestCreatedImg } from 'src/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './ConversationList.module.scss';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ConversationListProps {
  onConversationClick: (conversationId: string) => void;
  /** Two-column messenger: search, selection highlight, tighter styling */
  variant?: 'default' | 'messenger';
  selectedConversationId?: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onConversationClick,
  variant = 'default',
  selectedConversationId = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segment, setSegment] = useState<'all' | 'mentors' | 'peers'>('all');
  const dispatch = useAppDispatch();
  const { data: conversationsData, isLoading } = useGetConversationsQuery(
    undefined,
    {
      // Reduced polling since we have real-time updates via Socket.io
      pollingInterval: 60000, // Poll every 60 seconds as fallback
    }
  );
  const currentUser = useTypedSelector((state) => state.auth.profile);
  
  // Listen for real-time conversation updates
  const { socket, isConnected, on, off } = useSocket({ autoConnect: true });
  
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleConversationUpdate = () => {
      // Invalidate cache to refresh conversation list
      dispatch(chatApi.util.invalidateTags(['ChatConversations']));
    };

    on('conversation_updated', handleConversationUpdate);

    return () => {
      off('conversation_updated', handleConversationUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, dispatch]);

  const conversations = useMemo(() => {
    if (!conversationsData) return [];
    const raw: Conversation[] = isConversationArray(conversationsData)
      ? conversationsData
      : conversationsData.conversations || [];

    /** One row per mentor–student pair (full support + 1:1 may have duplicated rows). */
    const byKey = new Map<string, Conversation[]>();
    for (const c of raw) {
      const type = c.conversationType ?? 'MENTOR_STUDENT';
      const key = `${type}:${[c.mentorId, c.studentId].sort().join(':')}`;
      const list = byKey.get(key) ?? [];
      list.push(c);
      byKey.set(key, list);
    }
    const merged: Conversation[] = [];
    for (const [, group] of byKey) {
      if (group.length === 1) {
        merged.push(group[0]);
        continue;
      }
      const primary = group.reduce((best, cur) => {
        const bt = best.lastMessageAt ? new Date(best.lastMessageAt).getTime() : 0;
        const ct = cur.lastMessageAt ? new Date(cur.lastMessageAt).getTime() : 0;
        return ct >= bt ? cur : best;
      });
      const maxT = Math.max(
        0,
        ...group.map((x) => (x.lastMessageAt ? new Date(x.lastMessageAt).getTime() : 0)),
      );
      merged.push({
        ...primary,
        unreadCountMentor: group.reduce((s, x) => s + (x.unreadCountMentor ?? 0), 0),
        unreadCountStudent: group.reduce((s, x) => s + (x.unreadCountStudent ?? 0), 0),
        lastMessageAt:
          maxT > 0 ? new Date(maxT).toISOString() : primary.lastMessageAt,
      });
    }
    merged.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return merged;
  }, [conversationsData]);

  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser?.id) return null;
    if (conversation.mentorId === currentUser.id) {
      return conversation.student;
    }
    return conversation.mentor;
  };

  const roleFiltered = useMemo(() => {
    if (segment === 'all') return conversations;
    if (segment === 'peers') return conversations.filter((c) => c.conversationType === 'PEER');
    return conversations.filter((c) => c.conversationType !== 'PEER');
  }, [conversations, segment]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return roleFiltered;
    return roleFiltered.filter((c) => {
      const other = getOtherUser(c);
      const name = (other?.profile?.name || '').toLowerCase();
      const email = (other?.email || '').toLowerCase();
      const handle = (other?.profile?.username || '').toLowerCase();
      return name.includes(q) || email.includes(q) || handle.includes(q);
    });
  }, [roleFiltered, searchQuery, currentUser?.id]);

  const getOtherUserAvatar = (conversation: Conversation) => {
    const otherUser = getOtherUser(conversation);
    if (!otherUser) return null;
    if (otherUser.profile?.media?.length) {
      const mediaImage = getLatestCreatedImg(otherUser.profile.media as any);
      if (mediaImage) return mediaImage;
    }
    return otherUser.profile?.avatar || null;
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!currentUser?.id) return 0;
    if (conversation.mentorId === currentUser.id) {
      return conversation.unreadCountMentor;
    }
    return conversation.unreadCountStudent;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (conversation.conversationType === 'PEER' && conversation.peerOverlapLabels?.length) {
      return conversation.peerOverlapLabels.slice(0, 3).join(' · ');
    }
    if (conversation.lastMessageAt) {
      return dayjs(conversation.lastMessageAt).fromNow();
    }
    return 'No messages yet';
  };

  const handleConversationClick = (conversationId: string) => {
    onConversationClick(conversationId);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (roleFiltered.length === 0 && conversations.length > 0) {
    return (
      <div className={variant === 'messenger' ? styles.messengerListWrap : styles.emptyContainer}>
        {variant === 'messenger' && (
          <div className={styles.messengerSearch}>
            <Segmented
              block
              value={segment}
              onChange={(v) => setSegment(v as 'all' | 'mentors' | 'peers')}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Mentors', value: 'mentors' },
                { label: 'Peers', value: 'peers' },
              ]}
              style={{ marginBottom: 10 }}
            />
            <Input
              allowClear
              size="large"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search size={16} className={styles.messengerSearchIcon} aria-hidden />}
              className={styles.messengerSearchInput}
            />
          </div>
        )}
        <Empty description="No conversations in this category" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Empty
          description="No conversations yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className={variant === 'messenger' ? styles.messengerEmpty : styles.emptyContainer}>
        {variant === 'messenger' && (
          <div className={styles.messengerSearch}>
            <Segmented
              block
              value={segment}
              onChange={(v) => setSegment(v as 'all' | 'mentors' | 'peers')}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Mentors', value: 'mentors' },
                { label: 'Peers', value: 'peers' },
              ]}
              style={{ marginBottom: 10 }}
            />
            <Input
              allowClear
              size="large"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search size={16} className={styles.messengerSearchIcon} aria-hidden />}
              className={styles.messengerSearchInput}
            />
          </div>
        )}
        <Empty description="No matches" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const list = (
    <List
      className={`${styles.conversationList} ${variant === 'messenger' ? styles.conversationListMessenger : ''}`}
      dataSource={filteredConversations}
      renderItem={(conversation) => {
        const otherUser = getOtherUser(conversation);
        const unreadCount = getUnreadCount(conversation);
        const lastMessageTime = getLastMessagePreview(conversation);
        const isSelected = selectedConversationId === conversation.id;

        return (
          <List.Item
            className={`${styles.conversationItem} ${
              unreadCount > 0 ? styles.unread : ''
            } ${isSelected ? styles.conversationItemSelected : ''} ${
              variant === 'messenger' ? styles.conversationItemMessenger : ''
            }`}
            onClick={() => handleConversationClick(conversation.id)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={getOtherUserAvatar(conversation)}
                  size={48}
                  icon={!getOtherUserAvatar(conversation) ? <User size={16} /> : undefined}
                  style={{ backgroundColor: '#8b0000' }}
                >
                  {!getOtherUserAvatar(conversation) && (otherUser?.profile?.name?.[0]?.toUpperCase() || 'U')}
                </Avatar>
              }
              title={
                <div className={styles.conversationTitle}>
                  <Text strong className={styles.userName}>
                    {otherUser?.profile?.name ||
                      otherUser?.email ||
                      'Unknown User'}
                  </Text>
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                  )}
                </div>
              }
              description={
                <div>
                  {conversation.conversationType === 'PEER' && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>
                      Peer · Study Buddy
                    </Text>
                  )}
                  <Text type="secondary" className={styles.lastMessage}>
                    {lastMessageTime}
                  </Text>
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );

  if (variant === 'messenger') {
    return (
      <div className={styles.messengerListWrap}>
        <div className={styles.messengerSearch}>
          <Segmented
            block
            value={segment}
            onChange={(v) => setSegment(v as 'all' | 'mentors' | 'peers')}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Mentors', value: 'mentors' },
              { label: 'Peers', value: 'peers' },
            ]}
            style={{ marginBottom: 10 }}
          />
          <Input
            allowClear
            size="large"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Search size={16} className={styles.messengerSearchIcon} aria-hidden />}
            className={styles.messengerSearchInput}
          />
        </div>
        {list}
      </div>
    );
  }

  return list;
};

export default ConversationList;

