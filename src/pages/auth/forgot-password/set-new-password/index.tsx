import { Button, Flex, Form, message } from 'antd';
import { Unlock } from 'iconsax-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomButton, CustomText } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import { Logo } from 'src/components/logos';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './set-new-password.module.scss';
import useSetNewPassword from './useSetNewPassword';

export default function SetNewPasswordPage() {
  const colors = useColors();
  const { formItems, form, onFinish, token, error, loading } =
    useSetNewPassword();

  if (!token) {
    message.error('Something went wrong. Please try again', 10);
    return <></>;
  }

  return (
    <>
      <Link to="/" className={styles.logo}>
        <Logo />
      </Link>
      <Flex gap={20} align="center">
        <div className={styles.icon}>
          <Unlock size="100%" color={colors.green5} />
        </div>
        <CustomText
          color={colors.colorText}
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle5}
        >
          Set a new password
        </CustomText>
      </Flex>
      <CustomText
        color={colors.colorTextDescription}
        fontSize={themeFontSize.fontSizeTitle8}
        mt={8}
        mb={20}
      >
        Enter your new password below to complete the reset process. Ensure it's
        strong and secure.
      </CustomText>

      <Form form={form} onFinish={onFinish} layout="vertical">
        <FormMaker formItems={formItems} formError={error} />

        <CustomButton
          className={styles.sendButton}
          type="primary"
          size="middle"
          htmlType="submit"
          width="100%"
          loading={loading}
          mb={15}
          mt={15}
        >
          Submit
        </CustomButton>
      </Form>
    </>
  );
}
