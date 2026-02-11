import { useGoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useLinkCalendarMutation } from 'src/app/services/users';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { CheckListProps } from '../CheckListItem';
import { setHasGoogleCredentials } from 'src/app/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { sendErrorToTelegram } from 'src/utils/telegramLogger';
import { isProduction } from 'src/utils';

export default function useProfileStatus() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleCancel = () => {
    setModalOpen(false);
  };

  const meRes = useTypedSelector((state) => state.auth.profile);

  // const areVideosUploaded = false;
  const media = meRes?.profile?.media ?? [];
  const areVideosUploaded =
    media.some((item) =>
      // @ts-ignore
      item.tags?.[0]?.includes(MEDIA_TAGS.DemoLession)
    ) &&
    media.some((item) =>
      // @ts-ignore
      item.tags?.[0]?.includes(MEDIA_TAGS.IntroVideo)
    );

  const [videosUploaded, setVideosUploaded] = useState<boolean>(
    areVideosUploaded ?? false
  );

  const profileChecklist: CheckListProps[] = [
    {
      stepName: t('homeMentor.profileInformation'),
      isComplete: meRes?.profile?.profileComplete || false,
      buttonText: t('homeMentor.profileInformationButton'),
      onClick: () => navigate('/auth/signup/mentor?step=1'),
    },
    {
      stepName: t('homeMentor.availableTime'),
      isComplete: true,
      buttonText: t('homeMentor.availableTimeButton'),
      onClick: () => {},
    },
    {
      stepName: t('homeMentor.video'),
      isComplete: videosUploaded,
      buttonText: t('homeMentor.videoButton'),
      onClick: () => {
        setModalOpen(true);
      },
    },
    {
      stepName: t('homeMentor.googleCalendar'),
      isComplete: !!meRes?.hasGoogleCredentials,
      buttonText: t('homeMentor.googleCalendarButton'),
      onClick: () => login(),
    },
  ];

  const allComplete = profileChecklist.every((c) => c.isComplete);

  const [linkCalendar, { isLoading }] = useLinkCalendarMutation();
  const login = useGoogleLogin({
    scope: scopes,
    // prompt: 'consent',
    flow: 'auth-code',
    redirect_uri: 'http://localhost:3000/api/auth/google/callback',
    onSuccess: (tokenResponse) => {
      tokenResponse.code;
      const code = tokenResponse.code;
      linkCalendar({ authCode: code })
        .unwrap()
        .then(() => {
          message.success('Google Calendar connected successfully');
          dispatch(setHasGoogleCredentials(true));
        })
        .catch((err) => {
          message.error(err.data.message);
          if (isProduction()) {
            sendErrorToTelegram(err);
          }
        });
    },
    onError: (error) => console.log(error),
  });

  return { profileChecklist, allComplete, modalOpen, handleCancel, setVideosUploaded };
}

/**
 * Calendar scopes for the "Connect Google Calendar" flow (mentor-only).
 * This is separate from login scopes — only requested when mentor explicitly connects their calendar.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

export const scopes = GOOGLE_CALENDAR_SCOPES.join(' ');
