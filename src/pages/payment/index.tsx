import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Form, Select, Row, Col, message, Skeleton } from 'antd';
import { useForm } from 'antd/es/form/Form';
import {
  ArrowLeft,
  ChevronDown,
  CreditCard as CardIcon,
  Lock,
  ShieldCheck,
} from 'lucide-react';

import { api } from 'src/app/api';
import {
  fetchPaymentQuote,
  type PaymentQuote,
  type QuoteProductType,
} from 'src/app/services/paymentQuote';
import { paymentRedirectWithTimeout } from 'src/app/services/paymentRedirect';
import { ReferralCodeInput } from 'src/components/referral/ReferralCodeInput';
import { REFERRAL_INELIGIBLE_PAYMENT_TYPES } from 'src/constants/referral';
import { PAYMENT_MERCHANT_RETURN_ORIGIN } from 'src/constants/paymentMerchantReturn';
import useParamsHook from 'src/hooks/params';

import styles from './payment.module.scss';

const { Option } = Select;

type Provider = 'click' | 'atmos' | 'card';

const PROVIDERS: {
  id: Exclude<Provider, 'card'>;
  name: string;
  logo: string;
}[] = [
  { id: 'click', name: 'Click', logo: '/img/click.jpg' },
  { id: 'atmos', name: 'Atmos', logo: '/img/atmos.png' },
];

const formatAmount = (amount: number, currency: string) =>
  currency === 'UZS'
    ? `${Math.round(amount).toLocaleString('en-US')} UZS`
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount);

/**
 * Work out what is being bought from the URL.
 *
 * Kept in one place: the old page re-derived this in four separate spots (the
 * summary, the return URL, the payload and the amount), and they could disagree.
 */
function resolveProductType(params: {
  paymentType: string;
  enrollmentId: string;
  caafApplicationId: string;
  sessionId: string;
  planId: string;
  mentorId: string;
}): QuoteProductType | null {
  const { paymentType, enrollmentId, caafApplicationId, sessionId, planId, mentorId } =
    params;

  if (paymentType === 'caaf' || caafApplicationId) return 'caaf';
  if (enrollmentId) return 'course';
  if (planId && mentorId) return sessionId ? 'session' : 'package';
  return null;
}

function PaymentPage() {
  const { t } = useTranslation();
  const [form] = useForm();
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();

  const sessionId = searchParams.get('sessionId') ?? '';
  const planId = searchParams.get('planId') ?? '';
  const mentorId = searchParams.get('mentorId') ?? '';
  const enrollmentId = searchParams.get('enrollmentId') ?? '';
  const caafApplicationId = searchParams.get('caafApplicationId') ?? '';
  const paymentType = searchParams.get('type') ?? '';
  const slotStart = searchParams.get('slotStart') ?? '';

  const [provider, setProvider] = useState<Provider>('click');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const productType = useMemo(
    () =>
      resolveProductType({
        paymentType,
        enrollmentId,
        caafApplicationId,
        sessionId,
        planId,
        mentorId,
      }),
    [paymentType, enrollmentId, caafApplicationId, sessionId, planId, mentorId],
  );

  // Post-payment return. Providers send the user back here with a status, and
  // the destination differs per product.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_status') !== 'success') return;

    message.success(t('checkout.paid', 'Payment completed.'));
    const type = params.get('type');
    if (type === 'course') {
      navigate('/programs/success?success=true');
    } else {
      window.history.replaceState({}, document.title, '/');
      navigate(type ? `/?payment_status=success&type=${type}` : '/');
    }
  }, [navigate, t]);

  const loadQuote = useCallback(
    async (code?: string | null) => {
      if (!productType) return;
      setIsQuoteLoading(true);
      setQuoteError(null);
      try {
        setQuote(
          await fetchPaymentQuote({
            productType,
            ...(enrollmentId && { enrollmentId }),
            ...(planId && { planId }),
            ...(mentorId && { mentorId }),
            ...(sessionId && { sessionId }),
            ...(code && { referralCode: code }),
          }),
        );
      } catch (error: any) {
        setQuoteError(
          error?.response?.data?.message ||
            t('checkout.quoteFailed', "We couldn't load this purchase."),
        );
      } finally {
        setIsQuoteLoading(false);
      }
    },
    [productType, enrollmentId, planId, mentorId, sessionId, t],
  );

  useEffect(() => {
    void loadQuote(referralCode);
  }, [loadQuote, referralCode]);

  const returnUrl = useMemo(() => {
    const origin = PAYMENT_MERCHANT_RETURN_ORIGIN;
    if (productType === 'caaf') {
      return `${origin}/events/central-asian-admissions-forum?caaf_payment=success`;
    }
    if (productType === 'course') {
      return `${origin}/programs/success?success=true`;
    }
    if (productType === 'session' || productType === 'package') {
      return `${origin}/?payment_status=success&type=session`;
    }
    return `${origin}/?payment_status=success`;
  }, [productType]);

  const handleProviderRedirect = async () => {
    if (provider === 'card' || !productType) return;

    setIsRedirecting(true);
    try {
      let payload: Record<string, unknown>;
      if (productType === 'course') {
        payload = { enrollmentId, returnUrl, ...(referralCode && { referralCode }) };
      } else if (productType === 'caaf') {
        // Referral never applies to an event registration.
        payload = { caafApplicationId, returnUrl };
      } else {
        payload = {
          planId,
          returnUrl,
          ...(sessionId && { sessionId }),
          ...(mentorId && { mentorId }),
          ...(referralCode && { referralCode }),
        };
      }

      const res = await paymentRedirectWithTimeout(provider, payload);
      const redirectUrl = res?.url || res?.redirectUrl;
      if (!redirectUrl) {
        message.error(t('checkout.noRedirect', 'No payment link came back. Try again.'));
        return;
      }
      window.location.href = redirectUrl;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        message.error(t('checkout.timeout', 'That took too long. Try again.'));
      } else {
        message.error(
          err.response?.data?.message ||
            t('checkout.redirectFailed', "We couldn't start the payment. Try again."),
        );
      }
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleCardSubmit = async (values: any) => {
    try {
      setIsRedirecting(true);
      const res = await api.payments.initPayment('click', {
        cardNumber: values.cardNumber.replace(/\s/g, ''),
        expireDate: values.expireDate.replace('/', ''),
        cardType: values.cardType,
        userId: '',
        save: false,
        ipAddress: '',
      } as any);
      navigate(`/payment/sms?cardToken=${res.data?.cardToken}&${searchParams.toString()}`);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(
        error.response?.data?.message ||
          t('checkout.cardFailed', "We couldn't start the card payment."),
      );
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleBack = () => {
    if (productType === 'caaf') {
      window.location.assign('/events/central-asian-admissions-forum');
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    window.location.assign('/');
  };

  const showReferral =
    !REFERRAL_INELIGIBLE_PAYMENT_TYPES.includes(paymentType) &&
    productType !== 'caaf';

  // A bad link is a real page with a way out, not a blank screen and a toast.
  if (!productType) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <h1>{t('checkout.missingTitle', 'We lost track of this purchase')}</h1>
          <p>
            {t(
              'checkout.missingBody',
              "This checkout link is missing what you're buying. Head back and start again.",
            )}
          </p>
          <Button type="primary" onClick={handleBack}>
            {t('checkout.goBack', 'Go back')}
          </Button>
        </div>
      </div>
    );
  }

  const summary = (
    <div className={styles.summaryInner}>
      {isQuoteLoading && !quote ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : quote ? (
        <>
          <div className={styles.product}>
            <h2 className={styles.productTitle}>{quote.title}</h2>
            {quote.subtitle && (
              <p className={styles.productSubtitle}>{quote.subtitle}</p>
            )}
            {slotStart && productType === 'session' && (
              <p className={styles.productSubtitle}>
                {new Date(slotStart).toLocaleString()}
              </p>
            )}
          </div>

          <div className={styles.receipt}>
            {quote.lineItems.map((item, index) => (
              <div className={styles.row} key={`${item.label}-${index}`}>
                <span className={styles.rowLabel}>
                  {item.label}
                  {item.detail && (
                    <span className={styles.rowDetail}>{item.detail}</span>
                  )}
                </span>
                <span className={styles.rowAmount}>
                  {formatAmount(item.amount, quote.currency)}
                </span>
              </div>
            ))}

            {quote.discounts.length > 0 && (
              <>
                <div className={`${styles.row} ${styles.subtotalRow}`}>
                  <span className={styles.rowLabel}>
                    {t('checkout.subtotal', 'Subtotal')}
                  </span>
                  <span className={styles.rowAmount}>
                    {formatAmount(quote.subtotal, quote.currency)}
                  </span>
                </div>
                {quote.discounts.map((discount, index) => (
                  <div
                    className={`${styles.row} ${styles.discountRow}`}
                    key={`${discount.label}-${index}`}
                  >
                    <span className={styles.rowLabel}>
                      {discount.label}
                      {discount.detail && (
                        <span className={styles.rowDetail}>{discount.detail}</span>
                      )}
                    </span>
                    <span className={styles.rowAmount}>
                      -{formatAmount(discount.amount, quote.currency)}
                    </span>
                  </div>
                ))}
              </>
            )}

            <div className={`${styles.row} ${styles.totalRow}`}>
              <span className={styles.rowLabel}>{t('checkout.total', 'Total')}</span>
              <span className={styles.totalAmount}>
                {formatAmount(quote.total, quote.currency)}
              </span>
            </div>
          </div>

          {/* Providers bill in UZS. Saying so up front beats a surprise on the
              provider's own page. */}
          {quote.currency !== 'UZS' && (
            <p className={styles.chargeNote}>
              {t('checkout.chargedAs', 'Charged as')}{' '}
              {formatAmount(quote.charge.amount, 'UZS')}
              {quote.charge.usdToUzsRate
                ? ` · ${t('checkout.rate', "today's rate")} ${Math.round(
                    quote.charge.usdToUzsRate,
                  ).toLocaleString('en-US')}`
                : ''}
            </p>
          )}

          {showReferral && (
            <div className={styles.referralSection}>
              <ReferralCodeInput
                onCodeApplied={(code) => setReferralCode(code)}
                onCodeRemoved={() => setReferralCode(null)}
                originalAmount={quote.subtotal}
                currency={quote.currency}
                disabled={isRedirecting}
              />
            </div>
          )}
        </>
      ) : (
        <div className={styles.inlineError}>
          <p>{quoteError}</p>
          <Button onClick={() => loadQuote(referralCode)}>
            {t('checkout.retry', 'Try again')}
          </Button>
        </div>
      )}
    </div>
  );

  const activeProviderName =
    PROVIDERS.find((p) => p.id === provider)?.name ?? 'Click';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <ArrowLeft size={18} />
          {t('checkout.back', 'Back')}
        </button>
        <span className={styles.secure}>
          <ShieldCheck size={15} />
          {t('checkout.secure', 'Secure checkout')}
        </span>
      </header>

      {/* Mobile: the summary collapses but the total stays visible, so the
          number is never more than a glance away. */}
      <button
        type="button"
        className={styles.summaryToggle}
        aria-expanded={summaryOpen}
        onClick={() => setSummaryOpen((open) => !open)}
      >
        <span>
          {summaryOpen
            ? t('checkout.hideDetails', 'Hide details')
            : t('checkout.showDetails', 'Show details')}
          <ChevronDown
            size={16}
            className={summaryOpen ? styles.chevronOpen : styles.chevron}
          />
        </span>
        <strong>
          {quote ? formatAmount(quote.total, quote.currency) : '—'}
        </strong>
      </button>

      <div className={styles.container}>
        <Row gutter={[32, 24]}>
          <Col xs={24} lg={10}>
            <aside
              className={`${styles.summary} ${summaryOpen ? styles.summaryOpen : ''}`}
            >
              {summary}
            </aside>
          </Col>

          <Col xs={24} lg={14}>
            <section className={styles.methods}>
              <h3 className={styles.sectionLabel}>
                {t('checkout.methodLabel', 'Payment method')}
              </h3>

              <div role="radiogroup" aria-label="Payment method">
                {PROVIDERS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={provider === p.id}
                    className={`${styles.method} ${
                      provider === p.id ? styles.methodActive : ''
                    }`}
                    onClick={() => setProvider(p.id)}
                  >
                    <span className={styles.radio} aria-hidden="true" />
                    {/* The logo sits on a white tile: click.jpg is a JPEG with
                        no alpha, so on the cream panel it would otherwise show
                        as a white block. The tile makes that deliberate. */}
                    <span className={styles.logoTile}>
                      <img src={p.logo} alt="" className={styles.logo} />
                    </span>
                    <span className={styles.methodText}>
                      <strong>{p.name}</strong>
                      <small>
                        {t('checkout.payWith', 'Pay with')} {p.name}
                      </small>
                    </span>
                  </button>
                ))}
              </div>

              {/* Payme is not live. Commented out rather than deleted so
                  re-enabling is a one-line change once it works.
              <div className={`${styles.method} ${styles.methodDisabled}`}>
                <span className={styles.logoTile}>
                  <img src="/img/payme.png" alt="" className={styles.logo} />
                </span>
                <span className={styles.methodText}>
                  <strong>Payme</strong>
                  <small>{t('checkout.comingSoon', 'Coming soon')}</small>
                </span>
              </div>
              */}

              {/* Card form. Unreachable while the card option stays commented
                  out in the provider list above; left in place deliberately. */}
              {provider === 'card' && (
                <div className={styles.cardForm}>
                  <Form form={form} layout="vertical" onFinish={handleCardSubmit}>
                    <Form.Item
                      name="cardNumber"
                      label={t('checkout.cardNumber', 'Card number')}
                      rules={[
                        { required: true, message: 'Card number is required' },
                        { pattern: /^[\d\s]{13,19}$/, message: 'Invalid card number' },
                      ]}
                    >
                      <Input
                        placeholder="1234 1234 1234 1234"
                        maxLength={19}
                        prefix={<CardIcon size={18} />}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          form.setFieldsValue({
                            cardNumber: formatted.substring(0, 19),
                          });
                        }}
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="expireDate"
                          label={t('checkout.expiry', 'Expiry')}
                          rules={[
                            { required: true, message: 'Expiry date is required' },
                            { pattern: /^\d{2}\/\d{2}$/, message: 'Format: MM/YY' },
                          ]}
                        >
                          <Input
                            placeholder="MM/YY"
                            maxLength={5}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              form.setFieldsValue({
                                expireDate:
                                  value.length >= 2
                                    ? `${value.substring(0, 2)}/${value.substring(2, 4)}`
                                    : value,
                              });
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="cvc"
                          label="CVC"
                          rules={[
                            { required: true, message: 'CVC is required' },
                            { pattern: /^\d{3,4}$/, message: 'Invalid CVC' },
                          ]}
                        >
                          <Input
                            placeholder="123"
                            maxLength={4}
                            prefix={<Lock size={15} />}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="cardType"
                      label={t('checkout.cardType', 'Card type')}
                      rules={[{ required: true, message: 'Card type is required' }]}
                    >
                      <Select placeholder="Select card type">
                        <Option value="humo">Humo</Option>
                        <Option value="uzcard">Uzcard</Option>
                      </Select>
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isRedirecting}
                      block
                      size="large"
                    >
                      {t('checkout.pay', 'Pay')}{' '}
                      {quote ? formatAmount(quote.total, quote.currency) : ''}
                    </Button>
                  </Form>
                </div>
              )}

              {provider !== 'card' && (
                <div className={styles.action}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={isRedirecting}
                    disabled={!quote || isQuoteLoading}
                    onClick={handleProviderRedirect}
                    className={styles.payButton}
                  >
                    {t('checkout.continueTo', 'Continue to')} {activeProviderName}
                  </Button>
                  {/* Naming the destination up front: being bounced to an
                      unfamiliar domain mid-payment is a real abandonment cause. */}
                  <p className={styles.actionNote}>
                    {t(
                      'checkout.redirectNote',
                      "You'll finish payment on {{provider}}'s secure page and come back here.",
                      { provider: activeProviderName },
                    )}
                  </p>
                </div>
              )}
            </section>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default PaymentPage;
