import { Button } from 'antd';
import { GoogleIcon } from '../icons';
import { baseUrl } from 'src/app/services/api/const';
import styles from './RegisterGoogleButton.module.scss';
import { useTranslation } from 'react-i18next';

interface Props {
  text?: string;
}

export default function RegisterGoogleButton({
  text = 'Sign in with Google',
}: Props) {
  const { t } = useTranslation();
  return (
    <Button
      className={styles.google_button}
      icon={<GoogleIcon />}
      onClick={() => {
        window.location.href = `${baseUrl}/auth/google`;
      }}
    >
      {text}
    </Button>
  );
}
