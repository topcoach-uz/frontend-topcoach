import styles from './header.module.scss';
import Navigation from './_components/navigation';
import Actions from './_components/actions';
import { Logo } from 'src/components/logos';
import { Link, useLocation } from 'react-router-dom';
import { isApplicantWorkspacePath } from 'src/lib/applicantWorkspace';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';

export default function Header({ workspace = false }: { workspace?: boolean }) {
  const { pathname } = useLocation();
  const applicant = isApplicantWorkspacePath(pathname) || workspace;
  const mentor = pathname === '/mentor' || pathname.startsWith('/mentor/');
  const { screenSize } = useScreenSize();
  const { i18n } = useTranslation();
  const isMobileVersion =
    i18n.language === 'en' ? screenSize > 1024 : screenSize > 1400;

  return (
    <header data-applicant-workspace={applicant ? '' : undefined} data-mentor-workspace={mentor ? '' : undefined} className={`${styles.header} ${applicant ? styles.applicantHeader : ''} ${mentor ? styles.mentorHeader : ''}`}>
      <div className={'container ' + styles.container}>
        <Link to="/">
          <Logo color="white" {...(mentor ? { width: 104, height: 36 } : {})} />
        </Link>
        {isMobileVersion && !mentor && <Navigation />}

        <Actions />
      </div>
    </header>
  );
}
