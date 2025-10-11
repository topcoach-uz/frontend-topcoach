import React, { useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ACCESS_TOKEN } from 'src/constants/storage';
import styles from './ai-assistant.module.scss';

const AiAssistantPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const { data: userData } = useGetMeQuery(undefined, {
    skip: !isAuthenticated, // Skip the query if user is not authenticated
  });
  const navigate = useNavigate();
  
  
  // Get user's name or fallback to "Student" - same pattern as Dashboard
  const userName = userData?.profile?.name || 'Student';

  // ChatKit integration - only initialize when authenticated
  const chatKitResult = useChatKit({
    api: {
      async getClientSecret(existing: string | null) {
        // Only proceed if user is authenticated
        if (!isAuthenticated) {
          throw new Error('User must be authenticated');
        }
        
        // Get the access token from localStorage
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          throw new Error('No access token found');
        }

        if (existing) {
          // implement session refresh
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ refresh: true }),
          });
          const { client_secret } = await res.json();
          return client_secret;
        }

        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  // Only use control when authenticated
  const control = isAuthenticated ? chatKitResult.control : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setCharacterCount(value.length);
    
    // Auto-resize textarea
    const textarea = e.target;
    const inputWrapper = document.querySelector('.inputWrapper') as HTMLElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // Max height of 200px
    
    // Handle alignment based on content
    if (inputWrapper) {
      if (value.trim()) {
        inputWrapper.style.alignItems = 'flex-end';
      } else {
        inputWrapper.style.alignItems = 'center';
      }
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        message.info({
          content: 'Please sign in to start chatting with CoachAI',
          duration: 2,
          onClose: () => {
            // Navigate to sign in page after showing the message
            navigate('/auth/signin');
          }
        });
        return;
      }
      
      // Here you would typically send the message to ChatKit
      // For now, we'll just clear the input
      setInputValue('');
      setCharacterCount(0);
      
      // Reset alignment and height when clearing
      const inputWrapper = document.querySelector('.inputWrapper') as HTMLElement;
      const textarea = document.querySelector('.inputField') as HTMLTextAreaElement;
      if (inputWrapper) {
        inputWrapper.style.alignItems = 'center';
      }
      if (textarea) {
        // Reset textarea height to default
        textarea.style.height = 'auto';
        textarea.style.height = '40px'; // Reset to minimum height
      }
    }
  };

  const handleCardClick = (prompt: string) => {
    setInputValue(prompt);
    setCharacterCount(prompt.length);
    
    // Defer DOM manipulation to ensure React has updated the textarea's value
    setTimeout(() => {
      const inputElement = document.querySelector('.inputField') as HTMLTextAreaElement;
      const inputWrapper = document.querySelector('.inputWrapper') as HTMLElement;
      if (inputElement && inputWrapper) {
        inputElement.focus();
        // Trigger auto-resize - reset height first to get accurate scrollHeight
        inputElement.style.height = 'auto';
        inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + 'px';
        
        // Set alignment to bottom when text is pasted
        inputWrapper.style.alignItems = 'flex-end';
      }
    }, 0); // Defer to the next event loop cycle
  };

  const handleChatAreaClick = () => {
    // Focus the input field when clicking anywhere in the chat area
    const inputElement = document.querySelector('.inputField') as HTMLTextAreaElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Allow new line (do nothing, let default behavior happen)
        return;
      } else {
        // Enter alone: Only send if there's text, otherwise do nothing
        if (inputValue.trim()) {
          e.preventDefault(); // Prevent default behavior (new line)
          handleSend();
        } else {
          // If input is empty, do nothing (prevent height increase)
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className={styles.aiAssistantPage}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.greeting}>Hi there, {userName}!</h1>
          <h2 className={styles.subtitle}>What would you like to know?</h2>
          <p className={styles.instruction}>
            Use one of the prompts below or ask your own question to begin.
          </p>
        </div>

            {/* Prompt Cards Grid */}
            <div className={styles.promptCards}>
              <div 
                className={styles.card}
                onClick={() => handleCardClick("Help me write a compelling personal statement for my university application. I'm applying for Computer Science and want to highlight my passion for technology and problem-solving.")}
              >
                <h3 className={styles.cardTitle}>Essay Coach</h3>
                <p className={styles.cardDescription}>
                  Get help with your personal statement, SOP, or motivation letter
                </p>
              </div>

              <div 
                className={styles.card}
                onClick={() => handleCardClick("I'm looking for universities that offer strong Computer Science programs with good research opportunities. My GPA is 3.8 and I have experience in software development. What universities would be a good match for me?")}
              >
                <h3 className={styles.cardTitle}>University Match</h3>
                <p className={styles.cardDescription}>
                  Find the perfect university and program for your goals
                </p>
              </div>

              <div 
                className={styles.card}
                onClick={() => handleCardClick("I'm an international student from Uzbekistan studying Computer Science. What scholarships are available for me to study in the US, UK, or Canada?")}
              >
                <h3 className={styles.cardTitle}>Scholarship Finder</h3>
                <p className={styles.cardDescription}>
                  Discover scholarships and funding opportunities worldwide
                </p>
              </div>

              <div 
                className={styles.card}
                onClick={() => handleCardClick("Create a personalized application checklist for me. I'm applying to 5 universities for Computer Science programs starting in Fall 2025.")}
              >
                <h3 className={styles.cardTitle}>Application Checklist</h3>
                <p className={styles.cardDescription}>
                  Get a personalized checklist for your application process
                </p>
              </div>
            </div>

        {/* Input Field at Bottom */}
        <div className={styles.inputContainer} onClick={handleChatAreaClick}>
          <div className={styles.inputWrapper}>
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={isAuthenticated ? "Ask whatever you want..." : "Sign in to start chatting with CoachAI..."}
              className={`${styles.inputField} inputField`}
              maxLength={5000}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button
              onClick={handleSend}
              className={styles.sendButton}
              disabled={!inputValue.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15 8L1 1L5 8L1 15L15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className={styles.characterCounter}>
            {characterCount}/5000
          </div>
        </div>

        {/* ChatKit Widget - temporarily disabled due to API issues */}
        {false && control && (
          <ChatKit 
            control={control} 
            className={styles.chatWidget}
          />
        )}
        
        {/* Temporary message while we fix ChatKit */}
        {isAuthenticated && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}>
            ChatKit is temporarily disabled while we fix the API integration. 
            The backend is working (check logs), but the ChatKit widget needs the real OpenAI session.
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistantPage;
