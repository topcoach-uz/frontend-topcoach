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

  const handleRedirectToPayme = () => {
    console.log("clicked");
    api.payments
      .getRedirectUrl(
        "payme",
        // @ts-ignore
        sessionId
          ? {
              sessionId: sessionId,
              returnUrl,
              planId,
              mentorId,
            }
          : {
              returnUrl,
              planId,
              mentorId,
            },
      )
      .then((res) => {
        window.location.href = res.data?.url;
      });
  };

  const handleRedirectToClick = () => {
    api.payments
      .getRedirectUrl(
        "click",
        // @ts-ignore
        sessionId
          ? {
              sessionId,
              returnUrl,
              planId,
              mentorId,
            }
          : {
              returnUrl,
              planId,
              mentorId,
            },
      )
      .then((res) => {
        window.location.href = res.data?.url;
      });
  };

  const handleRedirectToAtmos = () => {
    api.payments
      .getRedirectUrl(
        "atmos",
        // @ts-ignore
        sessionId
          ? {
              sessionId,
              returnUrl,
              planId,
              mentorId,
            }
          : {
              returnUrl,
              planId,
              mentorId,
            },
      )
      .then((res) => {
        window.location.href = res.data?.url;
      });
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
                    onClick={() => handleRedirectToPayme()}
                    className={styles.paymeImg}
                  >
                    <img src="/img/payme.png" alt="img error" />
                  </div>
                  <div
                    onClick={() => handleRedirectToClick()}
                    className={styles.paymeImg}
                  >
                    <img src="/img/click.jpg" alt="img error" />
                  </div>
                  <div
                    onClick={() => handleRedirectToAtmos()}
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
