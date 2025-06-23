import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface INavLink {
  path: string;
  text: string;
}

export default function useNavigation() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const navLinks: INavLink[] = [
    {
      path: '/',
      text: t('header.home'),
    },
    {
      path: '/mentors',
      text: t('header.mentors'),
    },
    {
      path: '/universities',
      text: t('header.universities'),
    },
    {
      path: '/events',
      text: t('header.events'),
    },
    {
      path: '/success-stories',
      text: t('header.blog'),
    },
    {
      path: '/contact',
      text: t('header.contacts'),
    },
    {
      path: '/faq',
      text: t('header.faq'),
    },
  ];

  const isActive = (linkPath: string) => {
    if (linkPath === '/') {
      return pathname === '/';
    } else if (linkPath !== '/' && pathname.startsWith(linkPath)) {
      return pathname.startsWith(linkPath);
    }
  };

  return { navLinks, isActive };
}
