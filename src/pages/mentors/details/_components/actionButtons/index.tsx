import { Button, message } from 'antd';
import { Link } from 'lucide-react';
import useColors from 'src/hooks/useColors';
import MentorDetailsSocials from '../socials';
import styles from './actionButtons.module.scss';

interface ActionButtonsProps {
  mentorId: string;
  mentorName: string;
}

export default function ActionButtons({ mentorId, mentorName }: ActionButtonsProps) {
  const colors = useColors();

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/mentors/${mentorId}`;
    
    // Create a temporary text area to copy the URL
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      message.success('Mentor profile URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      message.error('Failed to copy URL');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={styles.action_buttons_container}>
      {/* Copy URL Button - Icon only */}
      <Button
        type="text"
        icon={<Link size={16} />}
        onClick={handleCopyUrl}
        className={styles.copy_url_button}
        style={{
          color: colors.colorPrimary,
          border: `1px solid ${colors.colorPrimary}`,
          borderRadius: '8px',
          height: '40px',
          width: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px'
        }}
        title="Copy mentor profile URL"
      />
      
      {/* Social Media Buttons */}
      <div className={styles.social_buttons_wrapper}>
        <MentorDetailsSocials />
      </div>
    </div>
  );
}
