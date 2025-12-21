import { useLocation } from 'react-router-dom';
import { useGetMySessionsQuery } from 'src/app/services/sessions';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import { themeFontSize } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { useTypedSelector } from 'src/app/store';
import { useTranslation } from 'react-i18next';
import { SessionTypeEnum } from 'src/app/api/Api';
import dayjs from 'dayjs';

interface Props {}

export default function PackageBalance({}: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: response } = useGetMySessionsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Extract sessions array from response - handle RTK Query response structure
  // Response might be directly an array or wrapped in { data: [...] }
  const allSessions = ((response as any)?.data ?? (Array.isArray(response) ? response : [])) as any[];

  // Filter sessions by mentor and only completed/past sessions
  const currentDay = dayjs();
  const completedSessionsWithMentor = allSessions.filter((session) => {
    // Check if session belongs to this mentor
    const sessionMentorId = (session.mentor as any)?.id;
    if (sessionMentorId !== mentorId) return false;

    // Check if session is completed (in the past)
    const sessionDateTime = dayjs.utc(session.date);
    const sessionDuration = session.type === SessionTypeEnum.Individual30M ? 30 : 60;
    const sessionEndTime = sessionDateTime.add(sessionDuration, 'minute');
    return sessionEndTime.isBefore(currentDay) && session.cancelStatus === null;
  });

  // Count sessions by type
  const sessions30Min = completedSessionsWithMentor.filter(
    (s) => s.type === SessionTypeEnum.Individual30M
  ).length;
  const sessions60Min = completedSessionsWithMentor.filter(
    (s) => s.type === SessionTypeEnum.Individual60M
  ).length;
  const totalSessions = sessions30Min + sessions60Min;

  // Don't show if no completed sessions
  if (!isAuthenticated || totalSessions === 0) {
    return <></>;
  }

  return (
    <CustomCard shadowed={false} bordered borderRadius={16}>
      <CustomText
        style={{ display: 'block', lineHeight: 1.5 }}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
      >
        {t('mentors.hadSessions') || 'You have had'}{' '}
        {totalSessions} {totalSessions === 1 
          ? (t('mentors.session') || 'session') 
          : (t('mentors.sessions') || 'sessions')} {t('mentors.withThisMentor') || 'with this mentor'}
        {totalSessions > 0 && (
          <>
            {': '}
            {sessions30Min > 0 && (
              <strong>{sessions30Min} {sessions30Min === 1 ? (t('mentors.type30Min') || '30-minute session') : (t('mentors.type30MinPlural') || '30-minute sessions')}</strong>
            )}
            {sessions30Min > 0 && sessions60Min > 0 && ' and '}
            {sessions60Min > 0 && (
              <strong>{sessions60Min} {sessions60Min === 1 ? (t('mentors.type60Min') || '60-minute session') : (t('mentors.type60MinPlural') || '60-minute sessions')}</strong>
            )}
          </>
        )}
      </CustomText>
    </CustomCard>
  );
}
