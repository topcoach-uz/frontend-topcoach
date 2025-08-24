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
import { ArrowLeft } from "iconsax-react";
import CustomSelect from "src/components/common/select";
import { Spin } from "antd";
import { useGetPlansQuery } from "src/app/services/mentors";
import { useGetMentorDetailQuery } from "src/app/services/mentors";

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

  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [calculatedCurrency, setCalculatedCurrency] = useState<string>("USD");

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
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
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
          returnUrl
        };
      } else {
        // Subscription/session payment: send planId and other fields
        payload = { 
          planId, 
          returnUrl,
          ...(sessionId && { sessionId }),
          ...(mentorId && { mentorId })
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
    <div className="container">
      <CustomButton
        icon={<ArrowLeft />}
        onClick={() => navigate(-1)}
        mt={80}
        mb={15}
      >
        Back
      </CustomButton>
      <div className={styles.payment + " container"}>
        <CustomText fontSize={36} fontWeight={600} color={colors.colorText} style={{ marginBottom: '8px' }}>
          Payment
        </CustomText>
        <CustomText fontSize={15} color={colors.colorTextSecondary} style={{ marginBottom: '25px', textAlign: 'center' }}>
          Choose your preferred payment method
        </CustomText>
        
        <div className={styles.details}>
          <CustomText color={colors.colorText} p={8} style={{ fontSize: '16px', fontWeight: '500' }}>
            Payment info
          </CustomText>
          <div className={styles.type}>
            {/* Payment Amount Display - Left Side */}
            <div style={{
              width: '40%',
              padding: '20px',
              borderRight: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '20px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                width: '100%',
                maxWidth: '260px'
              }}>
                <CustomText fontSize={13} color="rgba(255,255,255,0.9)" style={{ marginBottom: '6px' }}>
                  Payment Amount
                </CustomText>
                <CustomText fontSize={24} fontWeight={700} color="white" style={{ marginBottom: '3px' }}>
                  {paymentType === 'course' 
                    ? `$${displayAmount || '0'}` 
                    : displayCurrency === 'UZS' 
                      ? `${displayAmount || '0'} UZS`
                      : `$${displayAmount || '0'}`
                  }
                </CustomText>
                <CustomText fontSize={11} color="rgba(255,255,255,0.8)">
                  {paymentType === 'course' ? 'Course Enrollment' : 
                   paymentType === 'subscription' ? 'Subscription Plan' : 
                   'Mentor Session'}
                </CustomText>
              </div>
            </div>
            
            {/* Payment Providers - Right Side */}
            <div style={{ 
              width: '60%', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              <div className={styles.payme}>
                <CustomText color={colors.colorText} style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                  Pay via the app
                </CustomText>
                <div className={styles.paymentImages}>
                  {/* Payme - Temporarily Disabled
                  <div
                    onClick={() => handleProviderRedirect('payme')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/payme.png" alt="img error" loading="lazy" />
                  </div>
                  */}
                  <div
                    onClick={() => handleProviderRedirect('click')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/click.jpg" alt="img error" loading="lazy" />
                  </div>
                  <div
                    onClick={() => handleProviderRedirect('atmos')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/atmos.png" alt="img error" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Direct Card Payment Button - Temporarily Disabled
        <CustomButton type="primary" onClick={handleSubmit} loading={isLoading}>
          Next
        </CustomButton>
        */}
      </div>
    </div>
  );
}

export default PaymentPage;
