import { Card, Checkbox, Flex } from 'antd';
import styles from './mentorship.module.scss';
import { CheckIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import { UserType } from 'src/app/type';
import { UserRole } from 'src/app/api/Api';
import { useTranslation } from 'react-i18next';

interface Props {
  selected: UserType;
  handleChange: (key: UserType) => void;
  /** 'onboarding' swaps the signup-era "Join as…" copy for post-signup wording */
  variant?: 'signup' | 'onboarding';
}

export default function RoleCard({ handleChange, selected, variant = 'signup' }: Props) {
  const colors = useColors();
  const { t } = useTranslation();

  const options =
    variant === 'onboarding'
      ? [
          {
            key: UserRole.Student,
            title: t('onboarding.role.studentTitle', "I'm a student"),
            description: [
              t('onboarding.role.studentBullet1', 'Book 1:1 sessions with mentors'),
              t('onboarding.role.studentBullet2', 'Join the student community'),
              t('onboarding.role.studentBullet3', 'Discover top universities'),
            ],
          },
          {
            key: UserRole.Mentor,
            title: t('onboarding.role.mentorTitle', "I'm a mentor"),
            description: [
              t('onboarding.role.mentorBullet1', 'Share your knowledge with students'),
              t('onboarding.role.mentorBullet2', 'Run sessions with your students'),
              t('onboarding.role.mentorBullet3', 'Guide ambitious applicants'),
            ],
          },
        ]
      : [
          {
            key: UserRole.Student,
            title: t('signUp.joinAsStudent'),
            description: [
              t('signUp.description1'),
              t('signUp.description2'),
              t('signUp.description3'),
            ],
          },
          {
            key: UserRole.Mentor,
            title: t('signUp.joinAsMentor'),
            description: [
              t('signUp.description4'),
              t('signUp.description5'),
              t('signUp.description6'),
            ],
          },
        ];
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <Card
          key={option.key}
          className={
            selected === option.key ? styles.selectedCard : styles.card
          }
          onClick={() => handleChange(option.key)}
          styles={{ body: { padding: 0 } }}
        >
          <Checkbox
            checked={selected === option.key}
            onChange={() => handleChange(option.key)}
          />
          <strong className={styles.title}>{option.title}</strong>
          <ul className={styles.list}>
            {option.description.map((desc, index) => (
              <li key={index}>
                <Flex gap={4} align="center">
                  <CheckIcon color={colors.colorIcon} />
                  {desc}
                </Flex>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
