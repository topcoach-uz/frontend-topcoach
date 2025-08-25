import React, { useState } from 'react';
import { Card, Button, message, Typography, Space, Tag, Tooltip, Modal } from 'antd';
import { 
  GiftOutlined, 
  CopyOutlined, 
  ShareAltOutlined, 
  TrophyOutlined,
  DollarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useGetMyReferralCodeQuery, useGetReferralStatsQuery } from '../../app/services/referralApi';
import './ReferralCodeDisplay.scss';

const { Text, Title, Paragraph } = Typography;

export const ReferralCodeDisplay: React.FC = () => {
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  
  const { data: referralCodeData, isLoading: isLoadingCode } = useGetMyReferralCodeQuery();
  const { data: statsData, isLoading: isLoadingStats } = useGetReferralStatsQuery();

  const referralCode = referralCodeData?.code;

  const handleCopyCode = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        message.success('Referral code copied to clipboard! 🎉');
      } catch (err) {
        message.error('Failed to copy code. Please try again.');
      }
    }
  };

  const handleShare = () => {
    if (referralCode) {
      setIsShareModalVisible(true);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    const text = `🎓 Get 5% off your TopCoach course with my referral code: ${referralCode}! Join me in this amazing learning journey! 🚀`;
    const url = 'https://topcoach.uz/programs';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (isLoadingCode || isLoadingStats) {
    return (
      <Card className="referral-code-card loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <Text type="secondary">Loading your referral information...</Text>
        </div>
      </Card>
    );
  }

  if (!referralCode) {
    return null; // Don't show anything if user doesn't have a referral code
  }

  return (
    <>
      <Card className="referral-code-card">
        <div className="referral-header">
          <div className="referral-icon-container">
            <GiftOutlined className="referral-icon" />
          </div>
          <div className="referral-title-section">
            <Title level={4} className="referral-title">
              Your Referral Code
            </Title>
            <Text type="secondary" className="referral-subtitle">
              Share this code with friends and earn 5% commission on their purchases!
            </Text>
          </div>
        </div>

        <div className="referral-code-section">
          <div className="code-display">
            <Tag className="referral-code-tag">
              {referralCode}
            </Tag>
            <Space className="code-actions">
              <Tooltip title="Copy code">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={handleCopyCode}
                  size="small"
                  className="copy-button"
                >
                  Copy
                </Button>
              </Tooltip>
              <Tooltip title="Share code">
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  size="small"
                  className="share-button"
                >
                  Share
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>

        {statsData && (
          <div className="referral-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">
                  <UserOutlined />
                </div>
                <div className="stat-content">
                  <Text className="stat-number">{statsData.totalReferrals}</Text>
                  <Text type="secondary" className="stat-label">Total Referrals</Text>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon earnings">
                  <DollarOutlined />
                </div>
                <div className="stat-content">
                  <Text className="stat-number earnings">
                    ${statsData.totalCommission?.toFixed(2) || '0.00'}
                  </Text>
                  <Text type="secondary" className="stat-label">Total Earnings</Text>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="referral-benefits">
          <div className="benefits-header">
            <TrophyOutlined className="benefits-icon" />
            <Text strong>How it works:</Text>
          </div>
          <ul className="benefits-list">
            <li>Share your referral code with friends</li>
            <li>They get 5% off their course purchase</li>
            <li>You earn 5% commission on their purchase</li>
            <li>Unlimited referrals - no expiration!</li>
          </ul>
        </div>
      </Card>

      {/* Share Modal */}
      <Modal
        title={
          <div className="share-modal-header">
            <ShareAltOutlined className="share-modal-icon" />
            <span>Share Your Referral Code</span>
          </div>
        }
        open={isShareModalVisible}
        onCancel={() => setIsShareModalVisible(false)}
        footer={null}
        width={500}
        className="share-modal"
      >
        <div className="share-content">
          <div className="share-preview">
            <Text strong>Preview:</Text>
            <div className="share-text">
              🎓 Get 5% off your TopCoach course with my referral code: <Text code>{referralCode}</Text>! 
              Join me in this amazing learning journey! 🚀
            </div>
          </div>
          
          <div className="share-buttons">
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopyCode}
              block
              className="share-copy-button"
            >
              Copy Message
            </Button>
            
            <div className="social-buttons">
              <Button
                onClick={() => shareToSocialMedia('telegram')}
                className="social-button telegram"
                icon={<span>📱</span>}
              >
                Telegram
              </Button>
              <Button
                onClick={() => shareToSocialMedia('whatsapp')}
                className="social-button whatsapp"
                icon={<span>💬</span>}
              >
                WhatsApp
              </Button>
              <Button
                onClick={() => shareToSocialMedia('twitter')}
                className="social-button twitter"
                icon={<span>🐦</span>}
              >
                Twitter
              </Button>
              <Button
                onClick={() => shareToSocialMedia('facebook')}
                className="social-button facebook"
                icon={<span>📘</span>}
              >
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 