import React, { useState, useEffect } from 'react';
import { Input, Button, message, Spin, Tag, Space, Typography } from 'antd';
import { GiftOutlined, CheckCircleOutlined, CloseCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useValidateReferralCodeMutation } from '../../app/services/referralApi';
import './ReferralCodeInput.scss';

const { Text, Title } = Typography;

interface ReferralCodeInputProps {
  onCodeApplied: (code: string, discount: number, finalAmount: number) => void;
  onCodeRemoved: () => void;
  originalAmount: number;
  currency?: string;
  disabled?: boolean;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({
  onCodeApplied,
  onCodeRemoved,
  originalAmount,
  currency = 'USD',
  disabled = false,
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(originalAmount);

  const [validateCode, { isLoading }] = useValidateReferralCodeMutation();

  // Update final amount when original amount changes
  useEffect(() => {
    if (appliedCode) {
      const discount = originalAmount * 0.05; // 5% discount
      const final = originalAmount - discount;
      setDiscountAmount(discount);
      setFinalAmount(final);
      onCodeApplied(appliedCode, discount, final);
    } else {
      setFinalAmount(originalAmount);
      onCodeRemoved();
    }
  }, [originalAmount, appliedCode, onCodeApplied, onCodeRemoved]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(value);
  };

  const handleApplyCode = async () => {
    if (!code.trim()) {
      message.error('Please enter a referral code');
      return;
    }

    if (code.trim().length < 6) {
      message.error('Referral code must be at least 6 characters');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCode({ code: code.trim() }).unwrap();
      
      if (result.valid) {
        const discount = originalAmount * 0.05; // 5% discount
        const final = originalAmount - discount;
        
        setAppliedCode(code.trim());
        setDiscountAmount(discount);
        setFinalAmount(final);
        
        message.success(`🎉 ${result.message}`);
        onCodeApplied(code.trim(), discount, final);
      } else {
        message.error(result.message || 'Invalid referral code');
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to validate referral code';
      message.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setDiscountAmount(0);
    setFinalAmount(originalAmount);
    setCode('');
    onCodeRemoved();
    message.info('Referral code removed');
  };

  const handleCopyCode = () => {
    if (appliedCode) {
      navigator.clipboard.writeText(appliedCode);
      message.success('Referral code copied to clipboard!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="referral-code-container">
      <div className="referral-code-header">
        <GiftOutlined className="referral-icon" />
        <Title level={5} className="referral-title">
          Have a Referral Code?
        </Title>
      </div>

      {!appliedCode ? (
        <div className="referral-input-section">
          <Input
            placeholder="Enter referral code"
            value={code}
            onChange={handleCodeChange}
            onPressEnter={handleApplyCode}
            disabled={disabled || isLoading}
            className="referral-input"
            maxLength={15}
          />
          
          <Button
            type="primary"
            onClick={handleApplyCode}
            loading={isLoading || isValidating}
            disabled={disabled || !code.trim()}
            className="apply-button"
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="applied-code-section">
          <div className="applied-code-display">
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              className="applied-code-tag"
            >
              {appliedCode}
            </Tag>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopyCode}
              size="small"
              className="copy-button"
            />
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              onClick={handleRemoveCode}
              size="small"
              danger
              className="remove-button"
            />
          </div>
          
          <div className="discount-breakdown">
            <div className="price-row">
              <Text>Original Price:</Text>
              <Text className="original-price">
                {formatCurrency(originalAmount)}
              </Text>
            </div>
            <div className="price-row discount-row">
              <Text>Referral Discount (5%):</Text>
              <Text className="discount-amount">
                -{formatCurrency(discountAmount)}
              </Text>
            </div>
            <div className="price-row final-price-row">
              <Text strong>Final Price:</Text>
              <Text strong className="final-price">
                {formatCurrency(finalAmount)}
              </Text>
            </div>
          </div>
        </div>
      )}

      <div className="referral-info">
        <Text className="info-text">
          🎁 Get 5% off your purchase with a valid referral code from a TopCoach student!
        </Text>
      </div>
    </div>
  );
}; 