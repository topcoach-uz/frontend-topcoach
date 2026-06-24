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
        // Store where to return AFTER Google auth — but never an auth page,
        // otherwise we'd bounce the user right back to /auth/signin and they'd
        // have to sign in again. Auth pages → home ('/'), which routes by role.
        const currentUrl = window.location.pathname + window.location.search;
        const safeRedirect = currentUrl.startsWith('/auth') ? '/' : currentUrl;
        localStorage.setItem('redirectAfterLogin', safeRedirect);
        window.location.href = `${baseUrl}/auth/google`;
      }}
    >
      {text}
    </Button>
  );
}
