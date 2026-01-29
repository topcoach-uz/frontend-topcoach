import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Upload, message as antMessage, Space } from 'antd';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import {
  useSendMessageMutation,
  useSendFileMessageMutation,
} from 'src/app/services/chat/chatApi';
import { MessageType } from 'src/app/services/chat/types';
import { useSocket } from 'src/lib/socket';
// Chat file upload constants (matching backend)
const MAX_CHAT_FILE_UPLOAD_SIZE = 3 * 1024 * 1024; // 3MB
import styles from './ChatInput.module.scss';

const { TextArea } = Input;

interface ChatInputProps {
  conversationId: string;
  threadId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  conversationId,
  threadId,
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected, emit } = useSocket({ autoConnect: true });

  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation();
  const [sendFileMessage, { isLoading: isSendingFile }] = useSendFileMessageMutation();

  const isLoading = isSendingMessage || isSendingFile;

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file size (3MB max)
    if (file.size > MAX_CHAT_FILE_UPLOAD_SIZE) {
      antMessage.error(
        `File size exceeds the limit of ${MAX_CHAT_FILE_UPLOAD_SIZE / (1024 * 1024)}MB`
      );
      return false;
    }

    // Validate file type (images, PDF, DOC, DOCX)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      antMessage.error(
        'Invalid file type. Allowed types: Images (JPEG, PNG, GIF, WEBP), PDF, DOC, DOCX'
      );
      return false;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    return false; // Prevent default upload
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (socket && isConnected) {
        emit(isTyping ? 'typing_start' : 'typing_stop', {
          conversationId,
          threadId,
        });
      }
    },
    [socket, isConnected, emit, conversationId, threadId]
  );

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Send typing start indicator (debounced via useEffect)
  };

  // Debounced typing indicator
  useEffect(() => {
    if (message.trim()) {
      sendTypingIndicator(true);
      const timer = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000); // Stop typing after 3 seconds of inactivity

      return () => {
        clearTimeout(timer);
        sendTypingIndicator(false);
      };
    } else {
      sendTypingIndicator(false);
    }
  }, [message, sendTypingIndicator]);

  // Handle send message with retry logic
  const handleSend = async (retryCount = 0) => {
    if (!message.trim() && !selectedFile) {
      return;
    }

    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      if (selectedFile) {
        // Send file message
        await sendFileMessage({
          conversationId,
          threadId,
          file: selectedFile,
          message: message.trim() || undefined,
        }).unwrap();

        handleRemoveFile();
      } else {
        // Send text message
        await sendMessage({
          conversationId,
          threadId,
          message: message.trim(),
          messageType: MessageType.TEXT,
        }).unwrap();
      }

      setMessage('');
      sendTypingIndicator(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR')) {
        antMessage.warning(`Retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          handleSend(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      } else {
        antMessage.error(error?.data?.message || 'Failed to send message. Please try again.');
      }
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatInput}>
      {filePreview && (
        <div className={styles.filePreview}>
          <img src={filePreview} alt="Preview" />
          <Button
            type="text"
            size="small"
            onClick={handleRemoveFile}
            className={styles.removeFileButton}
          >
            ✕
          </Button>
        </div>
      )}
      {selectedFile && !filePreview && (
        <div className={styles.filePreview}>
          <Space>
            <PaperClipOutlined />
            <span>{selectedFile.name}</span>
            <Button
              type="text"
              size="small"
              onClick={handleRemoveFile}
              className={styles.removeFileButton}
            >
              ✕
            </Button>
          </Space>
        </div>
      )}
      <div className={styles.inputContainer}>
        <Upload
          beforeUpload={handleFileSelect}
          showUploadList={false}
          accept="image/*,.pdf,.doc,.docx"
        >
          <Button
            type="text"
            icon={<PaperClipOutlined />}
            className={styles.attachButton}
            disabled={isLoading}
          />
        </Upload>
        <TextArea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          className={styles.textInput}
          bordered={false}
          disabled={isLoading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSend()}
          loading={isLoading}
          disabled={!message.trim() && !selectedFile}
          className={styles.sendButton}
        />
      </div>
    </div>
  );
};

export default ChatInput;

