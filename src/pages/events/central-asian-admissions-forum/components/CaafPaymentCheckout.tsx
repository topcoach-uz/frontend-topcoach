import React, { useState } from 'react';
import { Button, Card, Col, Divider, Radio, Row, Space, Tag, Typography, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import FontAwesomeIcon from 'src/components/common/icons/FontAwesomeIcon';
import { formatCaafRegistrationFeeUsd, REGISTRATION_FEE_USD_FALLBACK } from '../constants';
import { useGetCaafForumRegistrationConfigQuery } from 'src/app/services/caafForumApi';
import type { CaafDraft } from '../types';
import pay from '../../../payment/payment.module.scss';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';

const { Text, Paragraph } = Typography;

type PayMethod = 'click' | 'atmos';

type Props = {
  draft: CaafDraft;
  applicationId: string;
  onBackToReview: () => void;
};

const paymentRedirectWithTimeout = async (provider: string, payload: Record<string, unknown>) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const response = await axios.post(`${baseUrl}/payments/redirect/${provider}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });
  return response.data;
};

export default function CaafPaymentCheckout({ draft, applicationId, onBackToReview }: Props) {
  const { t } = useTranslation();
  const { data: regConfig } = useGetCaafForumRegistrationConfigQuery();
  const feeUsd = regConfig?.registrationFeeUsd ?? REGISTRATION_FEE_USD_FALLBACK;
  const [method, setMethod] = useState<PayMethod>('click');
  const [loading, setLoading] = useState(false);

  const returnUrl = `${window.location.origin}/events/central-asian-admissions-forum?caaf_payment=success`;

  const onContinue = async () => {
    setLoading(true);
    try {
      const res = await paymentRedirectWithTimeout(method, {
        caafApplicationId: applicationId,
        returnUrl,
      });
      const redirectUrl = res?.url || res?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        message.error(t('caafForum.payment.errorNoUrl'));
      }
    } catch (err: unknown) {
      const ax = err as { code?: string; response?: { status?: number; data?: { message?: string } } };
      if (ax.code === 'ECONNABORTED') {
        message.error(t('caafForum.payment.errorTimeout'));
      } else if (ax.response?.status === 400) {
        message.error(ax.response?.data?.message || t('caafForum.payment.errorInvalid'));
      } else {
        message.error(ax.response?.data?.message || t('caafForum.payment.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const continueLabel =
    method === 'click' ? t('caafForum.payment.continueClick') : t('caafForum.payment.continueAtmos');

  return (
    <div className={pay.pageContainer}>
      <div className={pay.header}>
        <Button icon={<ArrowLeft size={20} />} onClick={onBackToReview} className={pay.backButton} type="text">
          {t('caafForum.payment.back')}
        </Button>
      </div>

      <div className={pay.paymentContainer}>
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={10}>
            <Card className={pay.summaryCard} title={t('caafForum.payment.summaryTitle')}>
              <div className={pay.summaryContent}>
                <div className={pay.orderSummary}>
                  <Text className={pay.orderSummaryTitle}>{t('caafForum.payment.orderSummary')}</Text>
                  <div className={pay.orderSummaryRow}>
                    <Text type="secondary">{t('caafForum.payment.registrant')}</Text>
                    <Text strong>{draft.fullName || '—'}</Text>
                  </div>
                  <div className={pay.orderSummaryRow}>
                    <Text type="secondary">{t('caafForum.payment.email')}</Text>
                    <Text strong>{draft.email || '—'}</Text>
                  </div>
                  <div className={pay.orderSummaryRow}>
                    <Text type="secondary">{t('caafForum.payment.event')}</Text>
                    <Text>{t('caafForum.payment.eventValue')}</Text>
                  </div>
                  <div className={pay.orderSummaryRow}>
                    <Text type="secondary">{t('caafForum.payment.feeLine')}</Text>
                    <Text>{t('caafForum.payment.feeValue')}</Text>
                  </div>
                </div>

                <div className={pay.amountSection}>
                  <div className={pay.totalRow}>
                    <Text strong>{t('caafForum.payment.total')}</Text>
                    <Text className={pay.amount}>{formatCaafRegistrationFeeUsd(feeUsd)}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card className={pay.paymentMethodsCard} title={t('caafForum.payment.chooseMethod')}>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value as PayMethod)}
                className={pay.paymentMethodRadio}
                size="large"
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Radio.Button value="click" className={pay.methodOption}>
                    <div className={pay.methodOptionContent}>
                      <img src="/img/click.jpg" alt="" className={pay.paymentLogo} />
                      <div className={pay.methodText}>
                        <Text strong>Click</Text>
                        <Text type="secondary" className={pay.methodSubtext}>
                          {t('caafForum.payment.payWithClick')}
                        </Text>
                      </div>
                      <ArrowLeft size={20} className={pay.arrowIcon} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </Radio.Button>

                  <Radio.Button value="atmos" className={pay.methodOption}>
                    <div className={pay.methodOptionContent}>
                      <img src="/img/atmos.png" alt="" className={pay.paymentLogo} />
                      <div className={pay.methodText}>
                        <Text strong>Atmos</Text>
                        <Text type="secondary" className={pay.methodSubtext}>
                          {t('caafForum.payment.payWithAtmos')}
                        </Text>
                      </div>
                      <ArrowLeft size={20} className={pay.arrowIcon} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </Radio.Button>
                </Space>
              </Radio.Group>

              <div className={`${pay.methodOption} ${pay.methodOptionDisabled}`}>
                <div className={pay.methodOptionContent}>
                  <div className={pay.paymentLogoPlaceholder}>
                    <FontAwesomeIcon icon="wallet" className={pay.placeholderIcon} />
                  </div>
                  <div className={pay.methodText}>
                    <Text strong>{t('caafForum.payment.payme')}</Text>
                    <Text type="secondary" className={pay.methodSubtext}>
                      {t('caafForum.payment.paymeSoon')}
                    </Text>
                  </div>
                  <Tag color="default">{t('caafForum.payment.soonTag')}</Tag>
                </div>
              </div>

              <Divider style={{ margin: '24px 0' }} />

              <Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 13 }}>
                {t('caafForum.payment.redirectNote')}
              </Paragraph>

              <div className={pay.paymentAction}>
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={onContinue}
                  className={pay.submitButton}
                >
                  {continueLabel}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
