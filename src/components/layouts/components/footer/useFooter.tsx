import { useTranslation } from 'react-i18next';
import {
  FacebookSvg,
  InstagramSvg,
  MailSvg,
  PhoneSvg,
  TelegramSvg,
  YouTubeSvg,
} from 'src/assets/svg';
import { LinkedinOutlined } from '@ant-design/icons';

export default function useFooter() {
  const { t } = useTranslation();

  const footerData = [
    {
      title: t('footer.information'),
      descriptions: [
        t('footer.privacyPolicy'),
        t('footer.termsAndConditions'),
        t('header.faq'),
      ],
      links: ['/privacy-policy', '/terms-and-conditions', '/faq'],
    },
    {
      title: t('footer.navigation'),
      descriptions: [
        t('header.universities'),
        t('header.mentors'),
        t('header.events'),
        t('header.blog'),
        t('header.contacts'),
      ],
      links: [
        '/universities',
        '/mentors',
        '/events',
        '/success-stories',
        '/contact',
      ],
    },
    {
      title: t('footer.socialMedia'),
      descriptions: [
        t('footer.telegram'),
        t('footer.youTube'),
        t('footer.instagram'),
        t('footer.facebook'),
      ],
      links: [
        'https://t.me/Top100_Uni',
        'https://youtube.com/@top100uni?si=VcJXZa3zWttqsZUo',
        'https://www.instagram.com/topcoach__/',
        'https://www.linkedin.com/company/topcoachuz/posts/?feedView=all',
      ],
      icons: [
        <TelegramSvg />,
        <YouTubeSvg />,
        <InstagramSvg />,
        <LinkedinOutlined />,
        // <FacebookSvg />,
      ],
    },
    {
      title: t('footer.contact'),
      descriptions: [
        // '+998 71 209 01 04',
        'support@topcoach.uz',
      ],
      icons: [
        // <PhoneSvg />,
        <MailSvg />,
        <TelegramSvg />,
      ],
      links: [
        // 'tel:+998712090104',
        'mailto:support@topcoach.uz',
      ],
    },
  ];

  return { footerData };
}
