import { Form, message } from "antd";
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
import { ArrowLeft, ShieldTick, Card, Mobile } from "iconsax-react";
import CustomSelect from "src/components/common/select";
import { Spin } from "antd";
import { useGetPlansQuery } from "src/app/services/mentors";
import { useGetMentorDetailQuery } from "src/app/services/mentors";
import { ReferralCodeInput } from "src/components/referral/ReferralCodeInput";

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
  
  // Debug logging
  console.log('Payment page params:', {
    amount,
    currencyName,
    sessionId,
    planId,
    mentorId,
    enrollmentId,
    paymentType,
    buyType
  });
  
  // Determine payment scenario
  const paymentScenario = (() => {
    if (paymentType === 'course' && enrollmentId) {
      return 'COURSE_PAYMENT';
    } else if (paymentType === 'subscription' || (planId && !sessionId && !mentorId)) {
      return 'SUBSCRIPTION_PAYMENT';
    } else if (sessionId && mentorId && planId) {
      return 'SESSION_BOOKING';
    } else if (planId && mentorId && !sessionId) {
      return 'PACKAGE_PURCHASE';
    } else {
      return 'UNKNOWN';
    }
  })();
  
  console.log('Payment scenario detected:', paymentScenario);
  
  // Determine return URL based on payment type
  const getReturnUrl = () => {
    if (paymentType === "course" && enrollmentId) {
      return "https://topcoachuni.com/programs/success?success=true";
    } else if (paymentType === "subscription" || (planId && !sessionId && !mentorId)) {
      return "https://topcoachuni.com/?payment_status=success&type=subscription";
    } else if (sessionId && mentorId) {
      return "https://topcoachuni.com/?payment_status=success&type=session";
    } else {
      return "https://topcoachuni.com/?payment_status=success";
    }
  };

  const returnUrl = getReturnUrl();

  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [calculatedCurrency, setCalculatedCurrency] = useState<string>("USD");
  
  // Referral code state
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
        
        // Redirect based on payment type - avoid infinite loops
        if (paymentType === 'subscription') {
          // Clear the URL parameters and redirect to home
          window.history.replaceState({}, document.title, '/');
          navigate('/?payment_status=success&type=subscription');
        } else if (paymentType === 'session') {
          // Clear the URL parameters and redirect to home
          window.history.replaceState({}, document.title, '/');
          navigate('/?payment_status=success&type=session');
        } else if (paymentType === 'course') {
          navigate('/programs/success?success=true');
        } else {
          // Default redirect - clear parameters first
          window.history.replaceState({}, document.title, '/');
          navigate('/');
        }
      } else if (error) {
        console.log('Payment error detected:', error);
        // Don't show error message immediately - let user try again
        // message.error('Payment was not completed. Please try again.');
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
        // If amount is not in URL, calculate it
        if (!amount) {
          const sessionAmount = (plan.prices as any)[mentorLevel];
          setCalculatedAmount(sessionAmount);
          
          // Determine currency based on amount size and plan currency
          let currency = (plan.currency as any)?.name;
          if (!currency) {
            // If no currency specified, determine based on amount size
            // Large amounts (>1000) are likely UZS, smaller amounts are likely USD
            currency = sessionAmount > 1000 ? 'UZS' : 'USD';
          }
          
          setCalculatedCurrency(currency);
          console.log('Calculated session amount:', {
            planType: plan.type,
            mentorLevel,
            amount: sessionAmount,
            currency: currency,
            originalCurrency: (plan.currency as any)?.name
          });
        } else {
          // If amount is in URL, just determine the currency
          let currency = (plan.currency as any)?.name;
          if (!currency) {
            // Determine currency based on the amount in URL
            const urlAmount = parseFloat(amount);
            currency = urlAmount > 1000 ? 'UZS' : 'USD';
          }
          
          setCalculatedCurrency(currency);
          console.log('URL amount currency detection:', {
            planType: plan.type,
            mentorLevel,
            urlAmount: amount,
            currency: currency,
            originalCurrency: (plan.currency as any)?.name
          });
        }
      }
    }
  }, [sessionId, planId, mentorId, mentorDetail, plans, amount]);

  // Check if we have required parameters
  if (!planId && !sessionId && !enrollmentId) {
    message.error('Missing payment information.');
    return;
  }

  // For course payments, we need to get the enrollment details to show proper amount
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch enrollment details for course payments
  useEffect(() => {
    if (enrollmentId && paymentType === 'course') {
      setLoadingDetails(true);
      // You can add an API call here to get enrollment details if needed
      // For now, we'll use the amount from URL params
      setLoadingDetails(false);
    }
  }, [enrollmentId, paymentType]);

  // Show loading while fetching details
  if (loadingDetails) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Spin size="large" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
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
    // If amount is very large (>10000), it's definitely UZS
    if (amountValue > 10000) {
      displayCurrency = 'UZS';
    }
    // If amount is between 1000-10000 and no currency specified, likely UZS
    else if (amountValue > 1000 && !currencyName && !calculatedCurrency) {
      displayCurrency = 'UZS';
    }
    // If amount is small (<100) and no currency specified, likely USD
    else if (amountValue < 100 && !currencyName && !calculatedCurrency) {
      displayCurrency = 'USD';
    }
  }
  
  // Debug logging
  console.log('Payment display debug:', {
    amount,
    calculatedAmount,
    currencyName,
    calculatedCurrency,
    displayAmount,
    displayCurrency,
    paymentType
  });

  const handleSubmit = async () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values);
      
      const payload = {
        cardNumber: values.cardNumber.replace(/\s/g, ""),
        expireDate: values.expireDate.replace("/", ""), // Fixed: was using values.phone
        cardType: values.cardType,
      };

      console.log('Payment payload:', payload);
      setIsLoading(true);

      const response = api.payments
        // @ts-ignore
        .initPayment(method, payload)
        .then((res) => {
          console.log('Payment init successful:', res);
          // @ts-ignore
          navigate(
            // @ts-ignore
            `/payment/sms?cardToken=${res.data?.cardToken}&${searchParams.toString()}`,
          );
        })
        .catch((err) => {
          console.error('Payment init failed:', err);
          message.error(err.response?.data?.message || 'Payment initialization failed');
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  };

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

  // Helper to POST to backend and redirect (for subscription and session payments)
  const handleProviderRedirect = async (provider: string) => {

    if (!planId && !sessionId && !enrollmentId) {
      message.error('No payment information found');
      return;
    }

    setIsLoading(true);
    try {
      let payload;
      
      if (paymentType === 'course' && enrollmentId) {
        // Course payment: only send enrollmentId
        payload = { 
          enrollmentId,
          returnUrl,
          ...(referralCode && { referralCode })
        };
      } else {
        // Subscription/session payment: send planId and other fields
        payload = { 
          planId, 
          returnUrl,
          ...(sessionId && { sessionId }),
          ...(mentorId && { mentorId }),
          ...(referralCode && { referralCode })
        };
      }
      
      console.log('Payment payload:', payload);
      console.log('Payment provider:', provider);
      
      const res = await api.payments.getRedirectUrl(provider, payload);
      
      if (res.data?.url || res.data?.redirectUrl) {
        const redirectUrl = res.data.url || res.data.redirectUrl;
        console.log('Redirecting to:', redirectUrl);
        
        // For Paycom, add a small delay to ensure backend processing
        if (provider === 'payme') {
          message.info('Redirecting to secure payment page...');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        } else {
          window.location.href = redirectUrl;
        }
      } else {
        message.error('No redirect URL received.');
      }
    } catch (err: any) {
      console.error('Payment redirect error:', err);
      
      // More specific error messages
      if (err.response?.status === 400) {
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

  const cardType = [
    { label: "Humo", value: "humo" },
    { label: "Uzcard", value: "uzcard" },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <CustomButton
          icon={<ArrowLeft />}
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          Back
        </CustomButton>
      </div>

      {/* Main Payment Container */}
      <div className={styles.paymentContainer}>
        {/* Payment Summary and Methods Row */}
        <div className={styles.mainRow}>
          {/* Payment Summary Card - Left Side */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h2>Payment Summary</h2>
              <div className={styles.secureBadge}>
                <ShieldTick size={16} />
                <span>Secure Payment</span>
              </div>
            </div>
            
            <div className={styles.amountSection}>
              <div className={styles.amountDisplay}>
                <span className={styles.currency}>
                  {displayCurrency === 'UZS' ? 'UZS' : '$'}
                </span>
                <span className={styles.amount}>
                  {finalDisplayAmount.toFixed(2)}
                </span>
              </div>
              <div className={styles.paymentType}>
                {paymentType === 'course' ? 'Course Enrollment' : 
                 paymentType === 'subscription' ? 'Subscription Plan' : 
                 'Mentor Session'}
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

          {/* Payment Methods - Right Side */}
          <div className={styles.paymentMethods}>
            <div className={styles.methodsHeader}>
              <h3>Choose Payment Method</h3>
              <p>Select your preferred way to pay</p>
            </div>
            
            <div className={styles.methodsGrid}>
              <div 
                className={`${styles.methodCard} ${isLoading ? styles.disabled : ''}`}
                onClick={() => !isLoading && handleProviderRedirect('click')}
              >
                <div className={styles.methodIcon}>
                  <img src="/img/click.jpg" alt="Click" />
                </div>
                <div className={styles.methodInfo}>
                  <h4>Click</h4>
                  <p>Pay with Click</p>
                </div>
                <div className={styles.methodArrow}>
                  <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                </div>
              </div>

              <div 
                className={`${styles.methodCard} ${isLoading ? styles.disabled : ''}`}
                onClick={() => !isLoading && handleProviderRedirect('atmos')}
              >
                <div className={styles.methodIcon}>
                  <img src="/img/atmos.png" alt="Atmos" />
                </div>
                <div className={styles.methodInfo}>
                  <h4>Atmos</h4>
                  <p>Pay with Atmos</p>
                </div>
                <div className={styles.methodArrow}>
                  <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
