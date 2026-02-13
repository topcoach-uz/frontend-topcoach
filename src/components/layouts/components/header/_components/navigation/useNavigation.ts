import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { UserRole } from 'src/app/services/users/type';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';

interface INavLink {
  path?: string;
  text: string;
  children?: INavLink[];
}

const SUPER_ADMIN_EMAIL = 'sheraliozodov6@gmail.com';
const MENTOR_EXCEPTION_EMAILS = ['oumarovna@gmail.com', 'sheraliozodov03@gmail.com'];

export default function useNavigation() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const authProfile = useTypedSelector((state) => state.auth.profile);
  const { data: getMeData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: orgsData } = useGetMyOrganizationsQuery(undefined, { skip: !isAuthenticated });
  const userProfile = getMeData ?? authProfile;
  const isMentor = userProfile?.profile?.role === UserRole.Mentor;
  const isCEO = MENTOR_EXCEPTION_EMAILS.includes(userProfile?.email || '');
  const isSuperAdmin = userProfile?.email === SUPER_ADMIN_EMAIL;
  const isCounselor = Array.isArray(orgsData) && orgsData.length > 0;
  // Counselors (non-superadmin): hide My Journey. Superadmins: full access.
  const shouldShowMyJourney =
    isSuperAdmin || ((!isMentor || isCEO) && !(isCounselor && !isSuperAdmin));
  // Mentors: Home. Counselors (non-superadmin): School Counselor as home.
  const showHome = isMentor && !(isCounselor && !isSuperAdmin);
  const showSchoolCounselor = isCounselor && !isSuperAdmin;

  const navLinks: INavLink[] = [
    ...(showHome ? [{ path: '/', text: t('header.home', 'Home') }] : []),
    ...(showSchoolCounselor ? [{ path: '/school-counselor', text: t('header.schoolCounselor', 'School Counselor') }] : []),
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
