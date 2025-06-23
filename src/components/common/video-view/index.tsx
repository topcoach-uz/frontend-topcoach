import useColors from 'src/hooks/useColors';
import CustomText from '../text';
import { Flex } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props {
  videoSrc: string;
  title?: string;
}

export default function VideoView({ videoSrc, title }: Props) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Flex gap={15} vertical>
      {title && <CustomText color={colors.colorText}>{title}</CustomText>}
      <video width="320" height="240" controls>
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        <source src={videoSrc} type="video/ogg" />
        {t('mentors.videoMessage')}
      </video>
    </Flex>
  );
}
