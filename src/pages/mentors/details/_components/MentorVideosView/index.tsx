import { Flex } from 'antd';
import { useTranslation } from 'react-i18next';
import VideoView from 'src/components/common/video-view';
import { useScreenSize } from 'src/hooks/useScreenSize';

interface Props {
  demoLesson: string;
  introductionVideo: string;
}

export default function MentorVideosView({
  demoLesson,
  introductionVideo,
}: Props) {
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  return (
    <Flex gap={10} vertical={screenSize < 700}>
      {introductionVideo && (
        <VideoView title={t('mentors.intro')} videoSrc={introductionVideo} />
      )}
      {demoLesson && (
        <VideoView title={t('mentors.demo')} videoSrc={demoLesson} />
      )}
    </Flex>
  );
}
