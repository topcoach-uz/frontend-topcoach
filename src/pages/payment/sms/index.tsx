import { Form, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBuySubscriptionMutation,
  useValidateAndPayMutation,
} from 'src/app/services/sessions';
import { CustomButton, CustomText } from 'src/components/common';
import { InputFormItem } from 'src/components/form';
import { themeFontSize } from 'src/constants/theme';
import useParamsHook from 'src/hooks/params';
import styles from './payment-sms.module.scss';

export enum PaymentTypeEnum {
  Package = 'package',
  Individual = 'individual',
}

export default function PaymentSmsPage() {
  const [otpValue, setOtpValue] = useState('');
  const { searchParams } = useParamsHook();

  const cardToken = searchParams.get('cardToken') ?? '';
  const planId = searchParams.get('planId') ?? '';
  const mentorId = searchParams.get('mentorId') ?? '';
  const buyType = searchParams.get('type'); // 'subscription' for subscriptions
  const sessionId = searchParams.get('sessionId') ?? '';
  const navigate = useNavigate();
  const [validateAndPay, { isLoading }] = useValidateAndPayMutation();
  const [buySubscription, { isLoading: isSubscriptionLoading }] =
    useBuySubscriptionMutation();

  const handleConfirmPayment = async () => {
    form.validateFields().then(() => {
      if (buyType === 'subscription' || planId) {
        buySubscription({
          method: 'click',
          body: {
            cardToken,
            smsCode: otpValue,
            planId,
          },
        })
          .then((res) => {
            message.success(res.data?.message);
            navigate(-2);
          })
          .catch((err) => {
            message.error(err.response.data.message, 7);
          });
      } else {
        validateAndPay({
          method: 'click',
          body: {
            cardToken,
            smsCode: otpValue,
            planId,
            mentorId,
            sessionId,
          },
        })
          .unwrap()
          .then((res) => {
            message.success(res.data?.message);
            navigate('/');
          })
          .catch((err) => {
            message.error(err.response.data.message, 7);
          });
      }
    });
  };

  const [form] = Form.useForm();

  return (
    <main>
      <div className={'container ' + styles.container}>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle2}
          fontWeight="bold"
          mt={30}
        >
          Confirm Your Payment
        </CustomText>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle5}
          mt={20}
          centered
          mb={60}
          width={700}
          lineHeight={1.3}
        >
          We have sent an SMS with a verification code to your registered mobile
          number. Please enter the code below to confirm your payment.
        </CustomText>
        <Form
          form={form}
          className={styles.form}
          onFinish={handleConfirmPayment}
        >
          <InputFormItem
            name="otp"
            inputType="otp"
            length={6}
            message="Please enter the OTP"
            required
            value={otpValue}
            onChange={(value) => setOtpValue(value)}
          />
          <CustomButton
            htmlType="submit"
            type="primary"
            loading={isLoading || isSubscriptionLoading}
          >
            Confirm Payment
          </CustomButton>
        </Form>
      </div>
    </main>
  );
}
