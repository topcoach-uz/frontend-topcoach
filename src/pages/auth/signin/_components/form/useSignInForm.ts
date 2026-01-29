import { useForm } from 'antd/es/form/Form';
import { IFormItemType } from 'src/components/form/type';
import { useScreenSize } from 'src/hooks/useScreenSize';

export default function useSignInForm() {
  const { screenSize } = useScreenSize();

  const col = screenSize > 576 ? 12 : 24;

  const [form] = useForm();
  const formItems: IFormItemType[] = [
    {
      type: 'input',
      name: 'email',
      label: 'Email',
      htmlType: 'email',
      placeholder: 'example@gmail.com',
      message: 'You must enter your email address',
      col: col,
    },
    {
      type: 'input',
      name: 'password',
      label: 'Password',
      htmlType: 'password',
      placeholder: 'Password',
      message: 'Password is required',
      col: col,
    },
  ];
  return { formItems, form };
}
