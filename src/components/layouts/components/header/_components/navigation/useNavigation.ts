import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { UserRole } from 'src/app/services/users/type';
import { useGetMeQuery } from 'src/app/services/users';
import useOrgStaff from 'src/hooks/useOrgStaff';

interface INavLink {
  path?: string;
  text: string;
  children?: INavLink[];
}

export default function useNavigation() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const authProfile = useTypedSelector((state) => state.auth.profile);
  const { data: getMeData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { isOrgStaff } = useOrgStaff();
  const userProfile = getMeData ?? authProfile;
  const isMentor = userProfile?.profile?.role === UserRole.Mentor;
  // "My Journey" (the student/mentee hub) is a student surface: mentors
  // never get the link — including mentors with SuperAdmin access, who
  // work from their mentor dashboard. Non-mentor SuperAdmins keep it;
  // org staff get the console as home instead.
  const shouldShowMyJourney = !isMentor && !isOrgStaff;
  // Mentors: Home. Org staff: the console is home.
  const showHome = isMentor && !isOrgStaff;

  const navLinks: INavLink[] = [
    ...(showHome ? [{ path: '/', text: t('header.home', 'Home') }] : []),
    // Org staff keep the FULL site nav — they are ordinary users who happen to
    // run an organization, and they browse Mentors/Programs/Events like anyone
    // else. Landing them on the console is the gates' job (HomeRouter); the nav
    // only adds the console as an extra destination. What they don't get is
    // "My Journey", which is the mentee surface — see shouldShowMyJourney.
    ...(isOrgStaff
      ? [
          {
            path: '/counselor-console',
            text: t('header.counselorConsole', 'Counselor Console'),
          },
        ]
      : []),
    ...(shouldShowMyJourney
      ? [{ path: '/student-hub', text: t('header.studentHub', 'My Journey') }]
      : []),
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
