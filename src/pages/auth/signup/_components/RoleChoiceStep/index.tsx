import { Link } from 'react-router-dom';
import styles from './roleChoiceStep.module.scss';
import { Logo } from 'src/components/logos';
import TitleDescriptionPair from 'src/pages/auth/signin/_components/title_description_pair';
import RoleCard from '../role_card';
import { CustomButton } from 'src/components/common';
import { UserType } from 'src/app/type';
import { useTranslation } from 'react-i18next';
import AlreadyHaveAccount from 'src/components/AlreadyHaveAccount';

interface Props {
  handleChange: (role: UserType) => void;
  selected: UserType;
  handleSubmit: () => void;
}

export default function RoleChoiceStep({
  handleChange,
  selected,
  handleSubmit,
}: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <Link className={styles.logo} to="/">
        <Logo />
      </Link>
      <TitleDescriptionPair
        title={t('signUp.welcome')}
        description={t('signUp.role')}
      />

      <div className={styles.container}>
        <RoleCard handleChange={handleChange} selected={selected} />
        <CustomButton onClick={handleSubmit} type="primary" width="100%">
          {t('btn.continue')}
        </CustomButton>
      </div>
      <AlreadyHaveAccount />
    </div>
  );
}
