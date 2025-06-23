import { SocialsLinkedin } from 'src/components/icons';
import styles from './mentor_socials.module.scss';
import { useTypedSelector } from 'src/app/store';

export default function MentorDetailsSocials() {
  const mentorData = useTypedSelector((state) => state.mentor.lastMentorData);
  const socials = [
    // {
    //   name: 'Telegram',
    //   icon: <SocialsTelegram className={styles.icon} />,
    //   link: 'https://t.me/example',
    // },
    // {
    //   name: 'Facebook',
    //   icon: <SocialsFaceBook className={styles.icon} />,
    //   link: 'https://www.facebook.com/',
    // },
    {
      name: 'LinkedIn',
      icon: <SocialsLinkedin className={styles.icon} />,
      //  @ts-ignore
      link: mentorData?.profile.contacts?.socials?.linkedin,
    },
    // {
    //   name: 'Instagram',
    //   icon: (
    //     <SocialsInstagram
    //       className={styles.icon}
    //       fill={colors.colorText}
    //       color={colors.colorBgLayout}
    //     />
    //   ),
    //   link: 'https://www.instagram.com/example/',
    // },
  ];
  return (
    <ul className={styles.socials}>
      {socials.map(
        (social) =>
          social.link && (
            <li key={social.link}>
              <a href={social.link}>{social.icon}</a>
            </li>
          )
      )}
    </ul>
  );
}
