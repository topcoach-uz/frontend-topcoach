import { useLocation } from 'react-router-dom';
import { useGetMentorBalanceQuery } from 'src/app/services/mentors';
import { CustomCard } from 'src/components/cards';
import { CustomText } from 'src/components/common';
import { themeFontSize } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface Props {}

export default function PackageBalance({}: Props) {
  const colors = useColors();
  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const { data } = useGetMentorBalanceQuery({ mentorId });
  // @ts-ignore
  const totalMinutesLeft = data?.totalMinutes - data?.usedMinutes;

  const hoursLeft = Math.floor(totalMinutesLeft / 60);

  const minutesLeft = totalMinutesLeft % 60;

  return data?.totalMinutes && totalMinutesLeft ? (
    <CustomCard shadowed={false} bordered borderRadius={16}>
      <CustomText
        style={{ display: 'block' }}
        lineHeight={1.3}
        fontSize={themeFontSize.fontSizeTitle5}
        color={colors.colorText}
      >
        {hoursLeft > 0 ? (
          <>
            You have{' '}
            <strong>
              {hoursLeft} hours{' '}
              {minutesLeft ? `and ${minutesLeft} minutes` : ''}
            </strong>{' '}
          </>
        ) : (
          <>
            You have{' '}
            <strong>{minutesLeft ? `${minutesLeft} minutes` : ''}</strong>
          </>
        )}{' '}
        left with this mentor
      </CustomText>
    </CustomCard>
  ) : (
    <></>
  );
}
