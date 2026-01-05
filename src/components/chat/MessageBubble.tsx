import React from 'react';
import { Avatar, Typography, Tooltip } from 'antd';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import { ChatMessage, MessageType, MessageStatus } from 'src/app/services/chat/types';
import { useTypedSelector } from 'src/app/store';
import dayjs from 'dayjs';
import { getLatestCreatedImg } from 'src/utils';
import ImagePreview from './ImagePreview';
import FilePreview from './FilePreview';
import styles from './MessageBubble.module.scss';

const { Text } = Typography;

interface MessageBubbleProps {
  message: ChatMessage;
  conversation?: {
    mentorId: string;
    mentor?: { profile?: { avatar?: string; name?: string; media?: Array<{ url?: string; createdAt?: string }> } };
    student?: { profile?: { avatar?: string; name?: string } };
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, conversation }) => {
  const currentUser = useTypedSelector((state) => state.auth.profile);
  const isOwnMessage = message.senderId === currentUser?.id;
  
  // Determine if sender is mentor or student to get correct avatar
  const isSenderMentor = conversation?.mentorId === message.senderId;
  // For mentors, use getLatestCreatedImg to get image from media array
  const senderAvatar = isSenderMentor 
    ? getLatestCreatedImg(conversation?.mentor?.profile?.media || []) || conversation?.mentor?.profile?.avatar
    : conversation?.student?.profile?.avatar;
  const senderName = isSenderMentor
    ? conversation?.mentor?.profile?.name
    : conversation?.student?.profile?.name;

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm');
  };

  const renderStatusIcon = () => {
    if (!isOwnMessage) return null;

    switch (message.status) {
      case MessageStatus.SENT:
      case MessageStatus.SENDING:
        return (
          <Tooltip title="Sent">
            <CheckOutlined className={styles.statusIcon} />
          </Tooltip>
        );
      case MessageStatus.DELIVERED:
        return (
          <Tooltip title="Delivered">
            <span className={styles.statusIcon}>
              <CheckOutlined />
              <CheckOutlined />
            </span>
          </Tooltip>
        );
      case MessageStatus.READ:
        return (
          <Tooltip title="Read">
            <span className={`${styles.statusIcon} ${styles.statusRead}`}>
              <CheckOutlined />
              <CheckOutlined />
            </span>
          </Tooltip>
        );
      case MessageStatus.FAILED:
        return (
          <Tooltip title="Failed to send">
            <span className={`${styles.statusIcon} ${styles.statusFailed}`}>
              ⚠
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case MessageType.TEXT:
        return (
          <div className={styles.messageText}>
            {message.message}
            {message.editedAt && (
              <Text type="secondary" className={styles.editedLabel}>
                (edited)
              </Text>
            )}
          </div>
        );
      case MessageType.IMAGE:
        return (
          <div className={styles.messageImage}>
            <ImagePreview
              imageUrl={message.fileUrl || ''}
              fileName={message.fileName}
              fileSize={message.fileSize}
              showDownload={true}
            />
          </div>
        );
      case MessageType.FILE:
      case MessageType.DOCUMENT:
        return (
          <div className={styles.messageFile}>
            <FilePreview
              fileUrl={message.fileUrl || ''}
              fileName={message.fileName || 'File'}
              fileSize={message.fileSize}
              fileMimeType={message.fileMimeType}
              showDownload={true}
            />
          </div>
        );
      default:
        return <div className={styles.messageText}>{message.message}</div>;
    }
  };

  return (
    <div
      className={`${styles.messageBubble} ${
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      }`}
    >
      {!isOwnMessage && (
        <Avatar
          src={senderAvatar || message.sender?.profile?.avatar}
          size={32}
          className={styles.messageAvatar}
          style={{ backgroundColor: '#8b0000' }}
          icon={!senderAvatar && !message.sender?.profile?.avatar ? <UserOutlined /> : undefined}
        >
          {!senderAvatar && !message.sender?.profile?.avatar && message.sender?.profile?.name?.[0]?.toUpperCase()}
        </Avatar>
      )}
      <div className={styles.messageContent}>
        {!isOwnMessage && (
          <div className={styles.senderName}>
            {senderName || message.sender?.profile?.name || message.sender?.email || 'User'}
          </div>
        )}
        {isOwnMessage && (
          <div className={styles.senderName}>
            You
          </div>
        )}
        <Tooltip title={dayjs(message.sentAt).format('MMM DD, YYYY HH:mm')}>
          <div
            className={`${styles.bubble} ${
              isOwnMessage ? styles.bubbleOwn : styles.bubbleOther
            }`}
          >
            {renderMessageContent()}
          </div>
        </Tooltip>
        <div className={styles.messageTimeContainer}>
          <Text className={styles.messageTime}>
            {formatTime(message.sentAt)}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);

