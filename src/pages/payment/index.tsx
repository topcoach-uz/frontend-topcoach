import { Form, message } from "antd";
import { useForm } from "antd/es/form/Form";
import { useState } from "react";
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
  const returnUrl = "https://topcoach.uz/";

  const [isLoading, setIsLoading] = useState(false);

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

  // Helper to POST to backend and redirect (unified for session and subscription)
  const handleProviderRedirect = async (provider: 'payme' | 'click' | 'atmos') => {
    const planId = searchParams.get('planId');
    const sessionId = searchParams.get('sessionId');
    const mentorId = searchParams.get('mentorId');
    const returnUrl = 'https://topcoach.uz/';
    const isSubscription = !!planId && !mentorId && !sessionId;

    if (!planId && !sessionId) {
      message.error('Missing plan or session information.');
      return;
    }

    // Check authentication (assume JWT is handled globally, but can check user state)
    // If you have an auth state, check it here
    // if (!isAuthenticated) {
    //   message.error('You must be logged in to pay.');
    //   return;
    // }

    let payload: any = { returnUrl };
    if (isSubscription) {
      payload.planId = planId;
    } else {
      if (planId) payload.planId = planId;
      if (mentorId) payload.mentorId = mentorId;
      if (sessionId) payload.sessionId = sessionId;
    }

    setIsLoading(true);
    try {
      // Use the same API for both flows
      const res = await api.payments.getRedirectUrl(provider, payload);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        message.error('No redirect URL received.');
      }
    } catch (err: any) {
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
                  {amount} {currencyName}
                </CustomText>
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
                    <img src="/img/payme.png" alt="img error" />
                  </div>
                  <div
                    onClick={() => handleProviderRedirect('click')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/click.jpg" alt="img error" />
                  </div>
                  <div
                    onClick={() => handleProviderRedirect('atmos')}
                    className={styles.paymeImg}
                  >
                    <img src="/img/atmos.png" alt="img error" />
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
