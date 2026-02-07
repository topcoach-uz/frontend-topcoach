import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Form, message, Card, Row, Col, Input, Select, Button, Space, Typography, Tag, Divider, Radio } from "antd";

dayjs.extend(utc);
dayjs.extend(timezone);
import { useForm } from "antd/es/form/Form";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "src/app/api";
import { useTypedSelector } from "src/app/store";
import { CustomButton, CustomText } from "src/components/common";
import { InputFormItem } from "src/components/form";
import styles from "./payment.module.scss";
import useParamsHook from "src/hooks/params";
import { themeFontSize, themeFontWeight } from "src/constants/theme";
import { ArrowLeft, Card as CardIcon, Mobile, Lock } from "iconsax-react";
import CustomSelect from "src/components/common/select";
import { Spin } from "antd";
import { useGetPlansQuery } from "src/app/services/mentors";
import { useGetMentorDetailQuery } from "src/app/services/mentors";
import { ReferralCodeInput } from "src/components/referral/ReferralCodeInput";
import FontAwesomeIcon from "src/components/common/icons/FontAwesomeIcon";
import axios from "axios";
import { baseUrl } from "src/app/services/api/const";
import { ACCESS_TOKEN } from "src/constants/storage";

// Custom payment redirect function with longer timeout (2 minutes)
// Payment processing can take up to 30+ seconds for booking creation
const paymentRedirectWithTimeout = async (provider: string, payload: any) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  
  const response = await axios.post(`${baseUrl}/payments/redirect/${provider}`, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minutes timeout for payment processing
  });
  
  return response.data;
};

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

function PaymentPage() {
  const colors = useTypedSelector((state) => state.layout.colors);
  const [form] = useForm();
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const amount = searchParams.get("amount");
  const currencyName = searchParams.get("currencyName");
  const method = "click";
  const sessionId = searchParams.get("sessionId") ?? "";
  const planId = searchParams.get("planId") ?? "";
  const mentorId = searchParams.get("mentorId") ?? "";
  const enrollmentId = searchParams.get("enrollmentId") ?? "";
  const paymentType = searchParams.get("type") ?? "";
  const buyType = searchParams.get("buyType") ?? "";
  const slotStart = searchParams.get("slotStart") ?? "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'click' | 'atmos' | 'payme' | 'card'>('click');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [calculatedCurrency, setCalculatedCurrency] = useState<string>("USD");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);

  // Fetch data for session payments
  const { data: plans } = useGetPlansQuery();
  const { data: mentorDetail } = useGetMentorDetailQuery(
    { mentorId },
    { skip: !mentorId }
  );

  // Check for payment status on page load
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const paymentType = urlParams.get('type');
      const error = urlParams.get('error');
      
      if (paymentStatus === 'success') {
        message.success('Payment completed successfully!');
        
        if (paymentType === 'subscription') {
          window.history.replaceState({}, document.title, '/');
          navigate('/?payment_status=success&type=subscription');
        } else if (paymentType === 'session') {
          window.history.replaceState({}, document.title, '/');
          navigate('/?payment_status=success&type=session');
        } else if (paymentType === 'course') {
          navigate('/programs/success?success=true');
        } else {
          window.history.replaceState({}, document.title, '/');
          navigate('/');
        }
      } else if (error) {
        console.log('Payment error detected:', error);
      }
    };

    checkPaymentStatus();
  }, [navigate]);

  // Calculate dynamic pricing for session payments
  useEffect(() => {
    if (sessionId && planId && mentorId && mentorDetail && plans) {
      const plan = plans.find(p => p.id === planId);
      const mentorLevel = mentorDetail?.mentorProfile?.level;
      
      if (plan && mentorLevel && plan.prices && mentorLevel !== 'probono') {
        if (!amount) {
          const sessionAmount = (plan.prices as any)[mentorLevel];
          setCalculatedAmount(sessionAmount);
          let currency = (plan.currency as any)?.name;
          if (!currency) {
            currency = sessionAmount > 1000 ? 'UZS' : 'USD';
          }
          setCalculatedCurrency(currency);
        } else {
          let currency = (plan.currency as any)?.name;
          if (!currency) {
            const urlAmount = parseFloat(amount);
            currency = urlAmount > 1000 ? 'UZS' : 'USD';
          }
          setCalculatedCurrency(currency);
        }
      }
    }
  }, [sessionId, planId, mentorId, mentorDetail, plans, amount]);

  // Check if we have required parameters
  if (!planId && !sessionId && !enrollmentId) {
    message.error('Missing payment information.');
    return null;
  }

  // Determine the amount to display
  const displayAmount = paymentType === 'course' 
    ? amount 
    : (calculatedAmount !== null ? calculatedAmount.toString() : amount);
  
  // Determine the currency to display
  let displayCurrency = paymentType === 'course' ? 'USD' : (calculatedCurrency || currencyName || 'USD');
  
  // Calculate final amount with referral discount
  const originalAmount = parseFloat(displayAmount || '0');
  const finalDisplayAmount = finalAmount !== null ? finalAmount : originalAmount;
  
  // Enhanced currency detection for URL parameters
  if (!calculatedAmount && amount) {
    const amountValue = parseFloat(amount);
    if (amountValue > 10000) {
      displayCurrency = 'UZS';
    } else if (amountValue > 1000 && !currencyName && !calculatedCurrency) {
      displayCurrency = 'UZS';
    } else if (amountValue < 100 && !currencyName && !calculatedCurrency) {
      displayCurrency = 'USD';
    }
  }

  // Determine return URL based on payment type
  // Using topcoach.uz for payment return URLs since merchant accounts are configured for this domain
  const getReturnUrl = () => {
    if (paymentType === "course" && enrollmentId) {
      return "https://topcoach.uz/programs/success?success=true";
    } else if (paymentType === "subscription" || (planId && !sessionId && !mentorId)) {
      return "https://topcoach.uz/?payment_status=success&type=subscription";
    } else if (sessionId && mentorId) {
      return "https://topcoach.uz/?payment_status=success&type=session";
    } else {
      return "https://topcoach.uz/?payment_status=success";
    }
  };

  const returnUrl = getReturnUrl();

  // Referral code handlers
  const handleReferralCodeApplied = (code: string, discount: number, final: number) => {
    setReferralCode(code);
    setReferralDiscount(discount);
    setFinalAmount(final);
  };

  const handleReferralCodeRemoved = () => {
    setReferralCode(null);
    setReferralDiscount(0);
    setFinalAmount(null);
  };

  // Handle card payment submission
  const handleCardSubmit = async (values: any) => {
    try {
      console.log('Form values:', values);
      
      // Backend only uses cardNumber, expireDate, cardType
      // userId comes from current user (JWT), save defaults to false
      const payload = {
        cardNumber: values.cardNumber.replace(/\s/g, ""),
        expireDate: values.expireDate.replace("/", ""),
        cardType: values.cardType,
        userId: "", // Backend gets this from current user (@CurrentUser)
        save: false,
        ipAddress: "", // Optional, backend can get this from request
      } as any;

      console.log('Payment payload:', payload);
      setIsLoading(true);

      const res = await api.payments.initPayment(method, payload);
      console.log('Payment init successful:', res);
      
      navigate(`/payment/sms?cardToken=${res.data?.cardToken}&${searchParams.toString()}`);
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      console.error('Payment init failed:', error);
      message.error(error.response?.data?.message || 'Payment initialization failed');
    } finally {
      setIsLoading(false);
    }
  };


  // Handle provider redirect (Click, Atmos)
  const handleProviderRedirect = async (provider: 'click' | 'atmos') => {
    if (!planId && !sessionId && !enrollmentId) {
      message.error('No payment information found');
      return;
    }

    setIsLoading(true);
    try {
      let payload;
      
      if (paymentType === 'course' && enrollmentId) {
        payload = { 
          enrollmentId,
          returnUrl,
          ...(referralCode && { referralCode })
        };
      } else {
        payload = { 
          planId, 
          returnUrl,
          ...(sessionId && { sessionId }),
          ...(mentorId && { mentorId }),
          ...(referralCode && { referralCode })
        };
      }
      
      // Use custom function with longer timeout (2 min) for payment processing
      const res = await paymentRedirectWithTimeout(provider, payload);
      
      if (res?.url || res?.redirectUrl) {
        const redirectUrl = res.url || res.redirectUrl;
        window.location.href = redirectUrl;
      } else {
        message.error('No redirect URL received.');
      }
    } catch (err: any) {
      console.error('Payment redirect error:', err);
      
      if (err.code === 'ECONNABORTED') {
        message.error('Payment request timed out. Please try again.');
      } else if (err.response?.status === 400) {
        message.error('Invalid payment request. Please check your payment details.');
      } else if (err.response?.status === 500) {
        message.error('Payment service temporarily unavailable. Please try again.');
      } else {
        message.error(err.response?.data?.message || 'Payment redirect failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (e: any) => {
    setPaymentMethod(e.target.value);
  };

  const cardTypeOptions = [
    { label: "Humo", value: "humo" },
    { label: "Uzcard", value: "uzcard" },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <Button
          icon={<ArrowLeft size={20} />}
          onClick={() => navigate(-1)}
          className={styles.backButton}
          type="text"
        >
          Back
        </Button>
      </div>

      {/* Main Payment Container */}
      <div className={styles.paymentContainer}>
        <Row gutter={[32, 32]}>
          {/* Payment Summary - Left Side */}
          <Col xs={24} lg={10}>
            <Card className={styles.summaryCard} title="Payment Summary">
              <div className={styles.summaryContent}>
                {paymentType === 'session' && mentorDetail && (
                  <div className={styles.orderSummary}>
                    <Text className={styles.orderSummaryTitle}>Order Summary</Text>
                    <div className={styles.orderSummaryRow}>
                      <Text type="secondary">Mentor:</Text>
                      <Text strong>{mentorDetail.profile?.name || 'Mentor'}</Text>
                    </div>
                    <div className={styles.orderSummaryRow}>
                      <Text type="secondary">Session:</Text>
                      <Text>
                        {plans?.find((p) => p.id === planId)?.type === 'individual60m' ? '60 min' : '30 min'} mentor session
                      </Text>
                    </div>
                    {slotStart && (
                      <div className={styles.orderSummaryRow}>
                        <Text type="secondary">Date & Time:</Text>
                        <Text>
                          {dayjs.utc(slotStart).local().format('ddd, MMM D, YYYY • h:mm A')}
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.amountSection}>
                  <div className={styles.totalRow}>
                    <Text strong>Total:</Text>
                    <Text className={styles.amount}>
                      {displayCurrency === 'UZS' ? 'UZS ' : '$'}
                      {finalDisplayAmount.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </Text>
                  </div>
                </div>

                {/* Referral Code Section - Only for Course Payments */}
                {paymentType === 'course' && (
                  <div className={styles.referralSection}>
                    <ReferralCodeInput
                      onCodeApplied={handleReferralCodeApplied}
                      onCodeRemoved={handleReferralCodeRemoved}
                      originalAmount={originalAmount}
                      currency={displayCurrency}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Payment Methods - Right Side */}
          <Col xs={24} lg={14}>
            <Card className={styles.paymentMethodsCard} title="Choose Payment Method">
              <Radio.Group 
                value={paymentMethod} 
                onChange={handlePaymentMethodChange}
                className={styles.paymentMethodRadio}
                size="large"
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {/* Click Payment Option */}
                  <Radio.Button value="click" className={styles.methodOption}>
                    <div className={styles.methodOptionContent}>
                      <img src="/img/click.jpg" alt="Click" className={styles.paymentLogo} />
                      <div className={styles.methodText}>
                        <Text strong>Click</Text>
                        <Text type="secondary" className={styles.methodSubtext}>
                          Pay with Click
                        </Text>
                      </div>
                      <ArrowLeft size={20} className={styles.arrowIcon} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </Radio.Button>

                  {/* Atmos Payment Option */}
                  <Radio.Button value="atmos" className={styles.methodOption}>
                    <div className={styles.methodOptionContent}>
                      <img src="/img/atmos.png" alt="Atmos" className={styles.paymentLogo} />
                      <div className={styles.methodText}>
                        <Text strong>Atmos</Text>
                        <Text type="secondary" className={styles.methodSubtext}>
                          Pay with Atmos
                        </Text>
                      </div>
                      <ArrowLeft size={20} className={styles.arrowIcon} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </Radio.Button>

                  {/* Credit or Debit Card - commented out for now */}
                  {/* <Radio.Button value="card" className={styles.methodOption}>
                    <div className={styles.methodOptionContent}>
                      <div className={styles.methodIcon}>
                        <FontAwesomeIcon icon="credit-card" style={{ fontSize: '24px' }} />
                      </div>
                      <div className={styles.methodText}>
                        <Text strong>Credit or Debit Card</Text>
                        <Text type="secondary" className={styles.methodSubtext}>
                          Pay directly with your card
                        </Text>
                      </div>
                      <div className={styles.cardIcons}>
                        <img src="/img/visa.svg" alt="Visa" className={styles.cardIcon} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <img src="/img/mastercard.svg" alt="Mastercard" className={styles.cardIcon} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    </div>
                  </Radio.Button> */}
                </Space>
              </Radio.Group>

              {/* Payme - Coming Soon (Not a Radio Button) */}
              <div className={`${styles.methodOption} ${styles.methodOptionDisabled}`}>
                <div className={styles.methodOptionContent}>
                  <div className={styles.paymentLogoPlaceholder}>
                    <FontAwesomeIcon icon="wallet" className={styles.placeholderIcon} />
                  </div>
                  <div className={styles.methodText}>
                    <Text strong>Payme</Text>
                    <Text type="secondary" className={styles.methodSubtext}>
                      Coming Soon
                    </Text>
                  </div>
                  <Tag color="default">Soon</Tag>
                </div>
              </div>

              <Divider style={{ margin: '24px 0' }} />

              {/* Card Details Form - Shown when card is selected */}
              {paymentMethod === 'card' && (
                <div className={styles.cardForm}>
                  <Form form={form} layout="vertical" onFinish={handleCardSubmit}>
                    <Form.Item
                      name="cardNumber"
                      label="Card Number"
                      rules={[
                        { required: true, message: 'Card number is required' },
                        { pattern: /^[\d\s]{13,19}$/, message: 'Invalid card number' }
                      ]}
                    >
                      <Input
                        placeholder="1234 1234 1234 1234"
                        maxLength={19}
                        prefix={<CardIcon size={20} />}
                        className={styles.cardInput}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          form.setFieldsValue({ cardNumber: formatted.substring(0, 19) });
                        }}
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="expireDate"
                          label="Expiry Date"
                          rules={[
                            { required: true, message: 'Expiry date is required' },
                            { pattern: /^\d{2}\/\d{2}$/, message: 'Format: MM/YY' }
                          ]}
                        >
                          <Input
                            placeholder="MM/YY"
                            maxLength={5}
                            className={styles.cardInput}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              let formatted = value;
                              if (value.length >= 2) {
                                formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              form.setFieldsValue({ expireDate: formatted });
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
                            { pattern: /^\d{3,4}$/, message: 'Invalid CVC' }
                          ]}
                        >
                          <Input
                            placeholder="123"
                            maxLength={4}
                            prefix={<Lock size={16} />}
                            className={styles.cardInput}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                              form.setFieldsValue({ cvc: value });
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="cardType"
                      label="Card Type"
                      rules={[{ required: true, message: 'Card type is required' }]}
                    >
                      <Select 
                        placeholder="Select card type" 
                        className={styles.cardInput}
                        suffixIcon={null}
                      >
                        {cardTypeOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        size="large"
                        className={styles.submitButton}
                      >
                        Pay {displayCurrency === 'UZS' ? 'UZS' : '$'} {finalDisplayAmount.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )}

              {/* Payment Buttons for Click/Atmos */}
              {paymentMethod !== 'card' && paymentMethod !== 'payme' && (
                <div className={styles.paymentAction}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={isLoading}
                    onClick={() => handleProviderRedirect(paymentMethod)}
                    className={styles.submitButton}
                  >
                    Continue with {paymentMethod === 'click' ? 'Click' : 'Atmos'}
                  </Button>
                </div>
              )}

            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default PaymentPage;
