import { message } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { IFormItemType } from 'src/components/form/type';
import useParamsHook from 'src/hooks/params';

export default function useSetNewPassword() {
  const [form] = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { searchParams } = useParamsHook();
  const token = searchParams.get('token');

  const formItems: IFormItemType[] = [
    {
      col: 24,
      name: 'newPassword',
      label: 'New Password',
      type: 'input',
      htmlType: 'password',
      inputType: 'password',
      placeholder: 'Enter your password',
      message: 'Password is required',
      formItemProps: {
        rules: [
          { required: true, message: 'Password is required' },
          { min: 8, message: 'Password must be at least 8 characters' },
          {
            pattern: /[A-Z]/,
            message: 'Include at least one uppercase letter',
          },
          {
            pattern: /[a-z]/,
            message: 'Include at least one lowercase letter',
          },
          { pattern: /\d/, message: 'Include at least one number' },
          {
            pattern: /[@$!%*?&]/,
            message: 'Include at least one special character (@$!%*?&)',
          },
        ],
      },
    },
    {
      name: 'confirmNewPassword',
      inputType: 'password',
      type: 'input',
      label: 'Confirm New password',
      htmlType: 'password',
      placeholder: 'Enter your password',
      col: 24,
      formItemProps: {
        required: true,
        rules: [
          {
            required: true,
            message: 'Confirm password is required',
          },
          {
            validator: (_, value) => {
              if (!value || form.getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match!'));
            },
          },
        ],
      },
    },
  ];

  const onFinish = (values: any) => {
    if (token) {
      setLoading(true);
      setError('');
      api.auth
        // @ts-ignore
        .resetPasswordConfirm({
          password: values.newPassword,
          token: token,
        })
        .then(() => {
          message.success(
            `Password reset successfully. You will be redirected to login page in a few seconds`,
            5
          );
          setTimeout(() => {
            navigate('/auth/signin');
          }, 5000);
          form.resetFields();
        })
        .catch((err: any) => {
          setError(err?.response?.data?.message || 'Something went wrong');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Token is missing');
      message.error('Token is missing');
    }
  };

  return { formItems, form, onFinish, token, error, loading };
}
