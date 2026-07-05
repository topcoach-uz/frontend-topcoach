import React, { useState, useRef, useEffect, useCallback } from 'react';
import { App, Input, Button, Upload, Space } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { Send, Paperclip } from 'lucide-react';
import EmojiPickerButton from './EmojiPickerButton';
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
  const { message: messageApi } = App.useApp();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<TextAreaRef>(null);
  const { socket, isConnected, emit } = useSocket({ autoConnect: true });

  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation();
  const [sendFileMessage, { isLoading: isSendingFile }] = useSendFileMessageMutation();

  const isLoading = isSendingMessage || isSendingFile;

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file size (3MB max)
    if (file.size > MAX_CHAT_FILE_UPLOAD_SIZE) {
      messageApi.error(
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
      messageApi.error(
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
        messageApi.warning(`Retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          handleSend(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      } else {
        messageApi.error(error?.data?.message || 'Failed to send message. Please try again.');
      }
    }
  };

  // Insert emoji at the current cursor position, keeping focus in the input
  const handleEmojiSelect = (emoji: string) => {
    const textArea = textAreaRef.current?.resizableTextArea?.textArea;
    if (!textArea) {
      setMessage((prev) => prev + emoji);
      return;
    }
    const start = textArea.selectionStart ?? message.length;
    const end = textArea.selectionEnd ?? message.length;
    setMessage(message.slice(0, start) + emoji + message.slice(end));
    requestAnimationFrame(() => {
      textArea.focus();
      const caret = start + emoji.length;
      textArea.setSelectionRange(caret, caret);
    });
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
            <Paperclip size={16} />
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
            icon={<Paperclip size={18} strokeWidth={1.75} />}
            className={styles.iconButton}
            disabled={isLoading}
            aria-label="Attach file"
          />
        </Upload>
        <TextArea
          ref={textAreaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          autoSize={{ minRows: 1, maxRows: 5 }}
          className={styles.textInput}
          variant="borderless"
          disabled={isLoading}
        />
        <EmojiPickerButton
          onSelect={handleEmojiSelect}
          disabled={isLoading}
          className={styles.iconButton}
        />
        <Button
          type="primary"
          icon={<Send size={16} strokeWidth={2} />}
          onClick={() => handleSend()}
          loading={isLoading}
          disabled={!message.trim() && !selectedFile}
          className={styles.sendButton}
          aria-label="Send message"
        />
      </div>
    </div>
  );
};

export default ChatInput;

