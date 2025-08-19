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
  
  const returnUrl = paymentType === "course" 
    ? "https://topcoach.uz/programs/success?success=true" 
    : "https://topcoach.uz/";

  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [calculatedCurrency, setCalculatedCurrency] = useState<string>("USD");

  // Fetch data for session payments
  const { data: plans } = useGetPlansQuery();
  const { data: mentorData } = useGetMentorDetailQuery(
    { mentorId },
    { skip: !mentorId || paymentType === 'course' }
  );

  // Calculate amount for session payments
  useEffect(() => {
    if (sessionId && planId && mentorId && mentorData && plans) {
      const plan = plans.find(p => p.id === planId);
      const mentorLevel = mentorData?.mentorProfile?.level;
      
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
  }, [sessionId, planId, mentorId, mentorData, plans, amount]);

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
      const payload = {
        cardNumber: values.cardNumber.replace(/\s/g, ""),
        expireDate: values.phone.replace("/", ""),
        cardType: values.cardType,
      };

      setIsLoading(true);

      const response = api.payments
        // @ts-ignore
        .initPayment(method, payload)
        .then((res) => {
          // @ts-ignore
          navigate(
            // @ts-ignore
            `/payment/sms?cardToken=${res.data?.cardToken}&${searchParams.toString()}`,
          );
        })
        .catch((err) => {
          message.error(err.response.data.message);
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
      
      const res = await api.payments.getRedirectUrl(provider, payload);
      
      if (res.data?.url || res.data?.redirectUrl) {
        window.location.href = res.data.url || res.data.redirectUrl;
      } else {
        message.error('No redirect URL received.');
      }
    } catch (err: any) {
      console.error('Payment redirect error:', err);
      message.error(err.response?.data?.message || 'Payment redirect failed.');
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
        mt={100}
        mb={10}
      >
        Back
      </CustomButton>
      <div className={styles.payment + " container"}>
        <CustomText fontSize={36} fontWeight={500} color={colors.colorText}>
          Payment
        </CustomText>
        <div className={styles.details}>
          <CustomText color={colors.colorText} p={8}>
            Payment info
          </CustomText>
          <div className={styles.type}>
            <div className={styles.card}>
              <div style={{ display: "flex", gap: "5px" }}>
                <CustomText
                  fontSize={themeFontSize.fontSizeTitle4}
                  fontWeight={themeFontWeight.fontWeightSemibold}
                  color={colors.colorText}
                >
                  Amount:
                </CustomText>
                <CustomText
                  fontSize={themeFontSize.fontSizeTitle4}
                  color={colors.colorText}
                  // fontWeight={themeFontWeight.fontWeightSemibold}
                >
                  {paymentType === 'course' 
                    ? `$${displayAmount || '0'}` 
                    : displayCurrency === 'UZS' 
                      ? `${displayAmount || '0'} UZS`
                      : `$${displayAmount || '0'}`
                  }
                </CustomText>
                {paymentType === 'course' && (
                  <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <CustomText
                      fontSize={themeFontSize.fontSizeTitle5}
                      color={colors.colorTextSecondary || '#666'}>                    
                    </CustomText>
                  </div>
                )}
              </div>
              <div className={styles.cardDetails}>
                <Form form={form} layout="vertical">
                  <InputFormItem
                    inputType="mask"
                    name="cardNumber"
                    label="Card number"
                    message="Please enter your card number"
                    mask="0000 0000 0000 0000"
                    placeholder="0000 0000 0000 0000"
                  />

                  <InputFormItem
                    inputType="mask"
                    name="phone"
                    label="Card expiry date"
                    message="Telefon raqamni kiriting"
                    mask="00/00"
                    placeholder="12/2029"
                  />
                  <Form.Item
                    name="cardType"
                    label="Enter card type"
                    rules={[
                      {
                        required: true,
                        message: "Please, choose your meeting type",
                      },
                    ]}
                    required={true}
                  >
                    <CustomSelect
                      options={cardType}
                      style={{ width: 200, height: 40 }}
                      placeholder="Humo or Uzcard"
                    />
                  </Form.Item>
                </Form>
              </div>
            </div>
            <div style={{ width: "100%" }}>
              <div className={styles.payme}>
                <CustomText color={colors.colorText}>
                  Pay via the app
                </CustomText>
                <div className={styles.paymentImages}>
                  <div
                    onClick={() => handleProviderRedirect('payme')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/payme.png" alt="img error" loading="lazy" />
                  </div>
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
        <CustomButton type="primary" onClick={handleSubmit} loading={isLoading}>
          Next
        </CustomButton>
      </div>
    </div>
  );
}

export default PaymentPage;
