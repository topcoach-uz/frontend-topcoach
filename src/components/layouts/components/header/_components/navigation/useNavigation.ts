import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';

interface INavLink {
  path?: string;
  text: string;
  children?: INavLink[];
}

export default function useNavigation() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);

  const navLinks: INavLink[] = [
    {
      path: '/',
      text: t('header.home'),
    },
    {
      path: '/student-hub',
      text: t('header.studentHub', 'My Journey'),
    },
    {
      path: '/ai-assistant',
      text: t('header.aiAssistant', 'AI Assistant'),
    },
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
        {
          path: '/success-stories',
          text: t('header.blog'),
        },
        {
          path: '/faq',
          text: t('header.faq'),
        },
        {
          path: '/contact',
          text: t('header.contact'),
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
