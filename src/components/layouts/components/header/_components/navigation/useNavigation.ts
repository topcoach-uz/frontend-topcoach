import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { UserRole } from 'src/app/services/users/type';

interface INavLink {
  path?: string;
  text: string;
  children?: INavLink[];
}

export default function useNavigation() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const userProfile = useTypedSelector((state) => state.auth.profile);
  const isMentor = userProfile?.profile?.role === UserRole.Mentor;
  
  // Exception: CEO email (oumarovna@gmail.com) should see "My Journey" even if they're a mentor
  // const isCEO = userProfile?.email === 'sheraliozodov03@gmail.com';
  const isCEO = userProfile?.email === 'oumarovna@gmail.com';
  const shouldShowMyJourney = !isMentor || isCEO;

  const navLinks: INavLink[] = [
    {
      path: '/',
      text: t('header.home'),
    },
    // Hide "My Journey" for mentors - it's only for students
    // Exception: CEO (oumarovna@gmail.com) can see it for pitching to schools
    ...(shouldShowMyJourney ? [
      {
        path: '/student-hub',
        text: t('header.studentHub', 'My Journey'),
      },
    ] : []),
    {
      path: '/mentors',
      text: t('header.mentors'),
    },
    {
      path: '/programs',
      text: t('header.programs', 'Programs'),
    },
    {
      path: '/events',
      text: t('header.events'),
    },
    {
      text: t('navigation.learnMore'),
      children: [
        {
          path: '/universities',
          text: t('header.universities'),
        },
        // {
        //   path: '/success-stories',
        //   text: t('header.blog'),
        // },
        {
          path: '/faq',
          text: t('header.faq'),
        },
      ],
    },
  ];

  const isActive = (linkPath?: string) => {
    if (!linkPath) return false;
    
    if (linkPath === '/') {
      return pathname === '/';
    } else if (linkPath !== '/' && pathname.startsWith(linkPath)) {
      return pathname.startsWith(linkPath);
    }
  };

  return { navLinks, isActive };
}
