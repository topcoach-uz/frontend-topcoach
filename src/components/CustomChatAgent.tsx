import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomChatAgent.module.scss';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatAgentProps {
  agentId?: string;
  apiKey?: string;
}

const CustomChatAgent: React.FC<ChatAgentProps> = ({ 
  agentId = 'agent_4101k7bhh5rmevhscwt844tnwd1a',
  apiKey = 'sk_4a8b2c3d4e5f6g7h8i9j0k1l2m3n4o5p' // This should be from environment variables
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use our backend API endpoint instead of calling ElevenLabs directly
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/ai/chat'
        : 'https://topcoachuni.com/api/ai/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          conversation_id: 'topcoach-conversation'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'Sorry, I couldn\'t process your request.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles['custom-chat-agent']}>
      {/* Chat Toggle Button */}
      <button 
        className={`${styles['chat-toggle']} ${isOpen ? styles['open'] : ''}`}
        onClick={toggleChat}
        aria-label="Toggle AI Assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles['chat-window']}>
          <div className={styles['chat-header']}>
            <div className={styles['chat-title']}>
              <div className={styles['agent-avatar']}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" fill="currentColor"/>
                </svg>
              </div>
              <div className={styles['agent-info']}>
                <h3>TopCoach AI Assistant</h3>
                <p>Admissions & University Guidance</p>
              </div>
            </div>
            <button 
              className={styles['close-button']}
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div className={styles['chat-messages']}>
            {messages.length === 0 && (
              <div className={styles['welcome-message']}>
                <p>Hi! I'm your TopCoach AI Assistant. I can help you with:</p>
                <ul>
                  <li>University admissions guidance</li>
                  <li>Scholarship opportunities</li>
                  <li>Application strategies</li>
                  <li>Academic planning</li>
                </ul>
                <p>How can I assist you today?</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles['message']} ${message.isUser ? styles['user'] : styles['bot']}`}
              >
                <div className={styles['message-content']}>
                  {message.text}
                </div>
                <div className={styles['message-time']}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles['message']} ${styles['bot']}`}>
                <div className={styles['message-content']}>
                  <div className={styles['typing-indicator']}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form className={styles['chat-input-form']} onSubmit={handleSubmit}>
            <div className={styles['input-container']}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about universities, admissions, or scholarships..."
                disabled={isLoading}
                className={styles['chat-input']}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className={styles['send-button']}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomChatAgent;
