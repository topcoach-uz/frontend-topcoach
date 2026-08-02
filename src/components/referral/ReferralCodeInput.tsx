import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, message, Tag, Typography } from 'antd';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import { useValidateReferralCodeMutation } from '../../app/services/referralApi';
import { REFERRAL_DEFAULT_PERCENT } from '../../constants/referral';
import './ReferralCodeInput.scss';

const { Text, Title } = Typography;

const roundToCents = (value: number) => Math.round(value * 100) / 100;

/**
 * A real gift box, drawn rather than borrowed.
 *
 * lucide's <Gift /> is a single-stroke outline, so every part of it inherits
 * one `currentColor` and it cannot be made multi-coloured from CSS. This is a
 * flat gift: gold box, lighter lid, red ribbon and bow.
 */
function GiftBoxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="26"
      height="26"
      aria-hidden="true"
      focusable="false"
    >
      {/* Bow, sitting above the lid */}
      <path
        d="M12 6.9C10.7 3.9 9.2 2.6 7.7 3.1a2.05 2.05 0 0 0-.35 3.62c.9.58 2.4.83 4.65.98Z"
        fill="#D64541"
      />
      <path
        d="M12 6.9c1.3-3 2.8-4.3 4.3-3.8a2.05 2.05 0 0 1 .35 3.62c-.9.58-2.4.83-4.65.98Z"
        fill="#D64541"
      />
      {/* Box body, then the lid over it */}
      <rect x="4" y="11.2" width="16" height="9.8" rx="1.3" fill="#EFA53A" />
      <rect x="2.6" y="6.8" width="18.8" height="4.6" rx="1.15" fill="#F7C566" />
      {/* Ribbon runs over both */}
      <rect x="10.35" y="6.8" width="3.3" height="14.2" fill="#D64541" />
    </svg>
  );
}

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
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(
    REFERRAL_DEFAULT_PERCENT,
  );

  const [validateCode, { isLoading }] = useValidateReferralCodeMutation();

  // The parent recreates these handlers on every render, and calling one of
  // them sets parent state. Holding them in a ref keeps them out of the effect
  // dependencies below; with them in, applying a code re-rendered the parent,
  // which re-ran the effect, which called the parent again, forever.
  const callbacks = useRef({ onCodeApplied, onCodeRemoved });
  callbacks.current = { onCodeApplied, onCodeRemoved };

  const discountAmount = appliedCode
    ? roundToCents(originalAmount * (discountPercentage / 100))
    : 0;
  const finalAmount = roundToCents(originalAmount - discountAmount);

  // Keep the parent's total in step when the price changes underneath us, for
  // instance when a currency rate resolves. Recomputed locally from the rate
  // the server already returned rather than re-validating: the code has not
  // changed, so there is nothing new to ask.
  useEffect(() => {
    if (appliedCode) {
      callbacks.current.onCodeApplied(appliedCode, discountAmount, finalAmount);
    } else {
      callbacks.current.onCodeRemoved();
    }
  }, [appliedCode, discountAmount, finalAmount]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
  };

  const handleApplyCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      message.error('Enter a referral code to apply it.');
      return;
    }

    try {
      const result = await validateCode({ code: trimmed }).unwrap();

      if (!result.valid) {
        message.error(result.message || "That code isn't valid.");
        return;
      }

      setDiscountPercentage(
        result.discountPercentage || REFERRAL_DEFAULT_PERCENT,
      );
      setAppliedCode(trimmed);
      message.success(result.message || 'Referral code applied.');
    } catch (error: any) {
      message.error(
        error?.data?.message || "We couldn't check that code. Try again.",
      );
    }
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setDiscountPercentage(REFERRAL_DEFAULT_PERCENT);
    setCode('');
    message.info('Referral code removed.');
  };

  const handleCopyCode = () => {
    if (appliedCode) {
      navigator.clipboard.writeText(appliedCode);
      message.success('Code copied.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="referral-code-container">
      <div className="referral-code-header">
        <GiftBoxIcon className="referral-icon" />
        <Title level={5} className="referral-title">
          Have a referral code?
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
            loading={isLoading}
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
              icon={<CheckCircle2 size={16} />}
              className="applied-code-tag"
            >
              {appliedCode}
            </Tag>
            <Button
              type="text"
              icon={<Copy size={16} />}
              onClick={handleCopyCode}
              size="small"
              className="copy-button"
              aria-label="Copy referral code"
            />
            <Button
              type="text"
              icon={<XCircle size={16} />}
              onClick={handleRemoveCode}
              size="small"
              danger
              className="remove-button"
              aria-label="Remove referral code"
            />
          </div>

          <div className="discount-breakdown">
            <div className="price-row">
              <Text>Original price</Text>
              <Text className="original-price">
                {formatCurrency(originalAmount)}
              </Text>
            </div>
            <div className="price-row discount-row">
              <Text>Referral discount ({discountPercentage}%)</Text>
              <Text className="discount-amount">
                -{formatCurrency(discountAmount)}
              </Text>
            </div>
            <div className="price-row final-price-row">
              <Text strong>Final price</Text>
              <Text strong className="final-price">
                {formatCurrency(finalAmount)}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Only shown before a code is applied. Once one is on, the receipt above
          already states the discount, so repeating the offer is noise. */}
      {!appliedCode && (
        <div className="referral-info">
          <Text className="info-text">
            A code from another student takes {REFERRAL_DEFAULT_PERCENT}% off.
          </Text>
        </div>
      )}
    </div>
  );
};
