import { FormInstance } from 'antd/lib';
import { useTranslation } from 'react-i18next';
import { IFormItemType } from 'src/components/form/type';

interface Props {
  form: FormInstance;
}

export default function useSignUp({ form }: Props) {
  const { t } = useTranslation();

  const formItems: IFormItemType[] = [
    {
      name: 'name',
      label: t('shared.fullNameLabel'),
      type: 'input',
      inputType: 'text',
      placeholder: t('shared.fullNamePlaceholder'),
      col: 24,
      message: t('signUp.nameError'),
    },
    {
      col: 24,
      name: 'email',
      label: t('signUp.email'),
      type: 'input',
      inputType: 'text',
      placeholder: t('signUp.emailPlaceholder'),
      message: t('signUp.emailError'),
    },
    {
      col: 24,
      name: 'phone_number',
      label: t('signUp.phoneNumber'),
      type: 'input',
      inputType: 'text',
      placeholder: t('signUp.phoneNumberPlaceholder'),
      message: t('signUp.phoneNumberError'),
      formItemProps: {
        rules: [
          { required: true, message: t('signUp.phoneNumberError') },
          { pattern: /^\+?\d{9,15}$/, message: t('signUp.phoneNumberFormatError') },
        ],
      },
    },
    {
      col: 24,
      name: 'password',
      label: t('signUp.password'),
      type: 'input',
      htmlType: 'password',
      placeholder: t('signUp.passwordPlaceholder'),
      message: t('signUp.passwordError'),
      inputType: 'password',
      formItemProps: {
        rules: [
          { required: true, message: t('signUp.passwordError') },
          { min: 8, message: t('signUp.paswordRule1') },
          {
            pattern: /[A-Z]/,
            message: t('signUp.paswordRule2'),
          },
          {
            pattern: /[a-z]/,
            message: t('signUp.paswordRule3'),
          },
          { pattern: /\d/, message: t('signUp.paswordRule4') },
          {
            pattern: /[@$!%*?&]/,
            message: t('signUp.paswordRule5'),
          },
        ],
      },
    },
    {
      col: 24,
      name: 'confirm_password',
      label: t('signUp.confirmPassword'),
      type: 'input',
      htmlType: 'password',
      placeholder: t('signUp.confirmPasswordPlaceholder'),
      inputType: 'password',
      formItemProps: {
        required: true,
        rules: [
          {
            required: true,
            message: t('signUp.confirmPasswordError'),
          },
          {
            validator: (_, value) => {
              if (!value || form.getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('signUp.confirmPasswordRule')));
            },
          },
        ],
      },
    },
  ];

  return { formItems, form };
}
