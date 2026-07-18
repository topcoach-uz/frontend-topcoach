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

  // Org staff see ONLY the console — no marketing nav (Mentors / Programs /
  // Events / Learn More). Their entire experience is the organization
  // console; the site's mentee/mentor surfaces are not theirs to browse.
  // Platform staff are NOT org staff (see useOrgStaff) and keep the full nav.
  if (isOrgStaff) {
    const consoleNav: INavLink[] = [
      {
        path: '/counselor-console',
        text: t('header.counselorConsole', 'Counselor Console'),
      },
    ];
    return {
      navLinks: consoleNav,
      isActive: (linkPath?: string) =>
        !!linkPath && pathname.startsWith(linkPath),
    };
  }

  const navLinks: INavLink[] = [
    ...(showHome ? [{ path: '/', text: t('header.home', 'Home') }] : []),
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
