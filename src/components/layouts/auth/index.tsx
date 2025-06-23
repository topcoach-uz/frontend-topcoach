import { Outlet } from 'react-router-dom';
import LanguageSelect from 'src/components/language_select';
import { useScreenSize } from 'src/hooks/useScreenSize';
import IllustrationPanel from './_components/illustration_panel';
import styles from './auth.module.scss';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  return (
    <main>
      <div className={styles.page_wrapper}>
        <div className={styles.left_side}>
          <div className={styles.language_select_wrapper}>
            <LanguageSelect />
          </div>
          <div className={styles.auth_wrapper}>
            {/* <Logo className={styles.logo} /> */}
            <Outlet />
          </div>
        </div>
        {screenSize > 1230 && (
          <IllustrationPanel title={t('signUp.rightText')} />
        )}
      </div>
    </main>
  );
}
