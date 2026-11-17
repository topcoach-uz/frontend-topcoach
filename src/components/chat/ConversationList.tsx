import React, { useMemo, useEffect, useState } from 'react';
import { List, Avatar, Empty, Spin, Typography, Input } from 'antd';
import { useSegmentLens } from 'src/hooks/useSegmentLens';
import { User, Search } from 'lucide-react';
import { useGetConversationsQuery, chatApi } from 'src/app/services/chat/chatApi';
import {
  Conversation,
  isConversationArray,
} from 'src/app/services/chat/types';
import { useTypedSelector, useAppDispatch } from 'src/app/store';
import { useSocket } from 'src/lib/socket';
import { getLatestCreatedImg } from 'src/utils';
import { avatarColorForName, avatarInitials } from 'src/utils/avatarColor';
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
  const [segment, setSegment] = useState<'all' | 'mentors' | 'peers' | 'team'>('all');
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

  // One glass thumb that springs between filters (iOS segmented control).
  const segmentLens = useSegmentLens<HTMLDivElement>('[aria-selected="true"]', [segment]);
  const segments = [
    { label: 'All', value: 'all' },
    { label: 'Mentors', value: 'mentors' },
    { label: 'Peers', value: 'peers' },
    { label: 'Team', value: 'team' },
  ] as const;

  const roleFiltered = useMemo(() => {
    if (segment === 'all') return conversations;
    if (segment === 'team') return conversations.filter((c) => c.conversationType === 'ADMIN_MENTOR');
    if (segment === 'peers') return conversations.filter((c) => c.conversationType === 'PEER');
    return conversations.filter((c) => c.conversationType !== 'PEER' && c.conversationType !== 'ADMIN_MENTOR');
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
    // Peer overlap labels (e.g., "Applying to UK · SAT") were previously
    // surfaced here as the conversation preview. They cluttered the
    // editorial layout and didn't represent actual message content, so
    // we've dropped them in favor of the standard time-ago line.
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

  // The filter + search header is rendered once and stays mounted, so
  // switching All → Mentors slides the indicator instead of rebuilding the
  // control when a category happens to be empty.
  const header = variant === 'messenger' && conversations.length > 0 && (
    <div className={styles.messengerSearch}>
      <div ref={segmentLens.ref} className={styles.segments} role="tablist" aria-label="Filter conversations">
        <span className={styles.segmentsThumb} style={segmentLens.lensStyle} aria-hidden />
        {segments.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={segment === item.value}
            className={styles.segment}
            onClick={() => setSegment(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
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
  );

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

  const emptyText =
    roleFiltered.length === 0 ? 'No conversations in this category' : filteredConversations.length === 0 ? 'No matches' : null;

  if (emptyText && variant !== 'messenger') {
    return (
      <div className={styles.emptyContainer}>
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                  style={{
                    backgroundColor: !getOtherUserAvatar(conversation)
                      ? avatarColorForName(otherUser?.profile?.name || otherUser?.email || 'User')
                      : undefined,
                    fontFamily: "'Iowan Old Style', 'Charter', 'Georgia', serif",
                    fontWeight: 500,
                    fontSize: 18,
                  }}
                >
                  {!getOtherUserAvatar(conversation) && avatarInitials(otherUser?.profile?.name || otherUser?.email)}
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
                  {conversation.conversationType === 'ADMIN_MENTOR' && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>
                      {conversation.mentorId === currentUser?.id ? 'Mentor · Team chat' : 'TopCoach Admin'}
                    </Text>
                  )}
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
        {header}
        {emptyText ? (
          <div className={styles.messengerEmptyBody}>
            <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div key={segment} className={styles.messengerListBody}>
            {list}
          </div>
        )}
      </div>
    );
  }

  return list;
};

export default ConversationList;

