import React, { useState } from 'react';
import { Card, Button, message, Typography, Space, Tag, Tooltip, Modal } from 'antd';
import { Gift, Copy, Share2, Trophy, CircleDollarSign, User } from 'lucide-react';
import { useGetMyReferralCodeQuery, useGetReferralStatsQuery } from '../../app/services/referralApi';
import { REFERRAL_DEFAULT_PERCENT } from '../../constants/referral';
import './ReferralCodeDisplay.scss';

const { Text, Title, Paragraph } = Typography;

export const ReferralCodeDisplay: React.FC = () => {
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  
  const { data: referralCodeData, isLoading: isLoadingCode, error: codeError } = useGetMyReferralCodeQuery();
  const { data: statsData, isLoading: isLoadingStats, error: statsError } = useGetReferralStatsQuery();

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

  // Single source for the share copy: the modal previews this exact string, and
  // when the two were written out separately they drifted apart.
  const shareText = `Get ${REFERRAL_DEFAULT_PERCENT}% off at TopCoach with my referral code: ${referralCode}`;

  const shareToSocialMedia = (platform: string) => {
    const text = shareText;
    const url = 'https://topcoachuni.com/programs';

    let shareUrl = '';
    
    switch (platform) {
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'x':
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

  // Show error state if there are errors
  if (codeError || statsError) {
    return (
      <Card className="referral-code-card error">
        <div className="error-content">
          <Text type="danger">Unable to load referral information. Please try again later.</Text>
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
            <Gift size={16} className="referral-icon" />
          </div>
          <div className="referral-title-section">
            <Title level={4} className="referral-title">
              Your Referral Code
            </Title>
            <Text type="secondary" className="referral-subtitle">
              Share this code. They take {REFERRAL_DEFAULT_PERCENT}% off, and you
              earn {REFERRAL_DEFAULT_PERCENT}% back on what they buy.
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
                  icon={<Copy size={16} />}
                  onClick={handleCopyCode}
                  size="small"
                  className="copy-button"
                >
                  Copy
                </Button>
              </Tooltip>
              <Tooltip title="Share code">
                <Button
                  icon={<Share2 size={16} />}
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
                  <User size={16} />
                </div>
                <div className="stat-content">
                  <Text className="stat-number">{statsData.totalReferrals || 0}</Text>
                  <Text type="secondary" className="stat-label">Total Referrals</Text>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon earnings">
                  <CircleDollarSign size={16} />
                </div>
                <div className="stat-content">
                  <Text className="stat-number earnings">
                    ${(statsData.totalCommission || 0).toFixed(2)}
                  </Text>
                  <Text type="secondary" className="stat-label">Total Earnings</Text>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="referral-benefits">
          <div className="benefits-header">
            <Trophy size={16} className="benefits-icon" />
            <Text strong>How it works:</Text>
          </div>
          <ul className="benefits-list">
            <li>Share your referral code with friends</li>
            <li>They get {REFERRAL_DEFAULT_PERCENT}% off their purchase</li>
            <li>
              You earn {REFERRAL_DEFAULT_PERCENT}% back on what they spend
            </li>
            <li>Unlimited referrals - no expiration!</li>
          </ul>
        </div>
      </Card>

      {/* Share Modal */}
      <Modal
        title={
          <div className="share-modal-header">
            <Share2 size={16} className="share-modal-icon" />
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
            <div className="share-text">{shareText}</div>
          </div>
          
          <div className="share-buttons">
            <Button
              type="primary"
              icon={<Copy size={16} />}
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
              >
                <div className="social-button-content">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="social-text">TELEGRAM</span>
                </div>
              </Button>
              <Button
                onClick={() => shareToSocialMedia('whatsapp')}
                className="social-button whatsapp"
              >
                <div className="social-button-content">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span className="social-text">WHATSAPP</span>
                </div>
              </Button>
              <Button
                onClick={() => shareToSocialMedia('x')}
                className="social-button x"
              >
                <div className="social-button-content">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="social-text">X (TWITTER)</span>
                </div>
              </Button>
              <Button
                onClick={() => shareToSocialMedia('facebook')}
                className="social-button facebook"
              >
                <div className="social-button-content">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="social-text">FACEBOOK</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 