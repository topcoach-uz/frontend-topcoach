import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { CheckListProps } from '../CheckListItem';
import { useTranslation } from 'react-i18next';
import { useConnectGoogleCalendar, GOOGLE_CALENDAR_SCOPES, scopes } from '../useConnectGoogleCalendar';

export default function useProfileStatus() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation();
  const { connectCalendar } = useConnectGoogleCalendar();

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
      onClick: () => connectCalendar(),
    },
  ];

  const allComplete = profileChecklist.every((c) => c.isComplete);

  return { profileChecklist, allComplete, modalOpen, handleCancel, setVideosUploaded };
}

export { GOOGLE_CALENDAR_SCOPES, scopes };
