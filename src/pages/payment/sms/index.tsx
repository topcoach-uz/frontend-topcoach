import { Form, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBuySubscriptionMutation,
  useValidateAndPayMutation,
} from 'src/app/services/sessions';
import { BuySubscriptionPlanDto } from 'src/app/api/Api';
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
    console.log('=== SMS PAYMENT CONFIRMATION START ===');
    console.log('Card token:', cardToken);
    console.log('SMS code:', otpValue);
    console.log('Plan ID:', planId);
    console.log('Mentor ID:', mentorId);
    console.log('Session ID:', sessionId);
    console.log('Buy type:', buyType);
    
    form.validateFields().then(() => {
      if (buyType === 'subscription' || planId) {
        console.log('Processing subscription payment...');
        buySubscription({
          method: 'click',
          body: {
            cardToken,
            smsCode: otpValue,
            planId,
          },
        })
          .unwrap()
          .then((res) => {
            console.log('Subscription payment successful:', res);
            message.success('Payment successful!');
            navigate(-2);
          })
          .catch((err) => {
            console.error('Subscription payment failed:', err);
            console.error('Error details:', {
              status: err.status,
              data: err.data,
              message: err.message
            });
            message.error(err.data?.message || 'Payment failed', 7);
          });
      } else {
        console.log('Processing session payment...');
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
            console.log('Session payment successful:', res);
            message.success('Payment successful!');
            navigate('/');
          })
          .catch((err) => {
            console.error('Session payment failed:', err);
            console.error('Error details:', {
              status: err.status,
              data: err.data,
              message: err.message
            });
            
            // More specific error messages
            let errorMessage = 'Payment failed';
            if (err.data?.message) {
              errorMessage = err.data.message;
            } else if (err.status === 400) {
              errorMessage = 'Invalid payment request. Please check your details.';
            } else if (err.status === 500) {
              errorMessage = 'Payment service error. Please try again.';
            }
            
            message.error(errorMessage, 7);
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
