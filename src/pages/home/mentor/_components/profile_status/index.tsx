import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import CheckListItem from '../CheckListItem';
import MentorProfileStatus from '../MentorProfileStatus';
import VideoUploadModal from '../VideoUploadModal';
import styles from './profile_status.module.scss';
import useProfileStatus from './useProfileStatus';
import { useTranslation } from 'react-i18next';

export default function ProfileStatusSection() {
  const colors = useColors();
  const { t } = useTranslation();

  const { profileChecklist, modalOpen, handleCancel, setVideosUploaded } =
    useProfileStatus();

  return (
    <div className={'container ' + styles.container}>
      <MentorProfileStatus />
      <div>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle5}
          fontWeight={themeFontWeight.fontWeightSemibold}
          color={colors.colorTextBase}
        >
          {t('homeMentor.completeProfile')}
        </CustomText>
        <ul className={styles.profile_check_list}>
          {profileChecklist.map((check) => (
            <CheckListItem key={check.stepName} {...check} />
          ))}
        </ul>
      </div>
      <VideoUploadModal
        setVideosUploaded={setVideosUploaded}
        handleCancel={handleCancel}
        modalOpen={modalOpen}
      />
    </div>
  );
}
