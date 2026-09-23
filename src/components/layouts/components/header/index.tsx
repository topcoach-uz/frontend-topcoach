import styles from './header.module.scss';
import Navigation from './_components/navigation';
import Actions from './_components/actions';
import { Logo } from 'src/components/logos';
import { Link, useLocation } from 'react-router-dom';
import { isApplicantWorkspacePath } from 'src/lib/applicantWorkspace';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const applicant = isApplicantWorkspacePath(useLocation().pathname);
  const { screenSize } = useScreenSize();
  const { i18n } = useTranslation();
  const isMobileVersion =
    i18n.language === 'en' ? screenSize > 1024 : screenSize > 1400;

  return (
    <header data-applicant-workspace={applicant ? '' : undefined} className={`${styles.header} ${applicant ? styles.applicantHeader : ''}`}>
      <div className={'container ' + styles.container}>
        <Link to="/">
          <Logo color="white" />
        </Link>
        {isMobileVersion && <Navigation />}

        <Actions />
      </div>
    </header>
  );
}
