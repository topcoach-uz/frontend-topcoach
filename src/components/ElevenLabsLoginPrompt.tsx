import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import styles from './ElevenLabsLoginPrompt.module.scss';

/**
 * Shown when user is not logged in - prompts them to log in to use the TopCoach Admissions Assistant
 */
export default function ElevenLabsLoginPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${styles['chat-button']} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with AI Assistant - Login required"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="currentColor"/>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.prompt}>
          <p>Log in to start a conversation with the TopCoach Admissions Assistant</p>
          <div className={styles.actions}>
            <Link to="/auth/signin">
              <Button type="primary" size="small">
                Log in
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="small">Sign up</Button>
            </Link>
          </div>
          <button
            className={styles.close}
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
