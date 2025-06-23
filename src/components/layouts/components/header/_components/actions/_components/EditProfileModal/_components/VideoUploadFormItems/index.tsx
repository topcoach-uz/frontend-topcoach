import { Flex, Form } from 'antd';
import { UploadFileStatus } from 'antd/es/upload/interface';
import { FormInstance, UploadFile } from 'antd/lib';
import { useEffect } from 'react';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import VideoPreview from 'src/components/common/video-preview';
import { UploadFormItem } from 'src/components/form';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { getLatestVideo } from 'src/utils';
import styles from './videoUpload.module.scss';

interface Props {
  form: FormInstance;
}

export default function VideoUploadFormItems({ form }: Props) {
  const userData = useTypedSelector((state) => state.auth.profile);
  const { screenSize } = useScreenSize();

  const setCurrentIntroVideo = () => {
    const introductionVideo = getLatestVideo(
      userData?.profile?.media || [],
      MEDIA_TAGS.IntroVideo
    );

    const introductionVideoFile: UploadFile = {
      uid: 'fromBackendIntroductionVideo',
      name: 'introductionVideo.mp4',
      status: 'done' as UploadFileStatus,
      url: introductionVideo,
    };

    form.setFieldValue('introductionVideo', introductionVideoFile);
  };

  const setCurrentDemoLesson = () => {
    const demoLesson = getLatestVideo(
      userData?.profile?.media || [],
      MEDIA_TAGS.DemoLession
    );

    const demoLessonFile: UploadFile = {
      uid: 'fromBackendDemoLesson',
      name: 'demoLesson.mp4',
      status: 'done' as UploadFileStatus,
      url: demoLesson,
    };

    form.setFieldValue('demoLesson', demoLessonFile);
  };

  useEffect(() => {
    setCurrentIntroVideo();
    setCurrentDemoLesson();
  }, []);

  return (
    <Flex
      className={styles.videoUpload}
      justify="space-between"
      align="center"
      vertical={screenSize < 560}
    >
      <Flex vertical>
        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const introductionVideo = getFieldValue('introductionVideo');

            if (introductionVideo?.file?.status == 'removed') {
              setCurrentIntroVideo();
              return;
            }

            return (
              <>
                {introductionVideo &&
                  introductionVideo?.uid === 'fromBackendIntroductionVideo' && (
                    <VideoPreview
                      title="Introduction Video Preview"
                      videoLink={introductionVideo.url}
                    />
                  )}
                {
                  // If the video is not a string, it means it's a file
                  introductionVideo && introductionVideo?.file && (
                    <VideoPreview
                      title="Introduction Video"
                      videoFile={introductionVideo?.file}
                    />
                  )
                }
              </>
            );
          }}
        </Form.Item>
        <UploadFormItem
          name="introductionVideo"
          label="Introduction video"
          maxCount={1}
          accept="video/*" // Only accept video files
        />
      </Flex>
      <Flex vertical>
        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const demoLesson = getFieldValue('demoLesson');

            if (demoLesson?.file?.status == 'removed') {
              setCurrentDemoLesson();
              return;
            }

            return (
              <>
                {demoLesson && demoLesson?.uid === 'fromBackendDemoLesson' && (
                  <VideoPreview
                    title="Demo Lesson Video Preview"
                    videoLink={demoLesson?.url}
                  />
                )}
                {
                  // If the video is not a string, it means it's a file
                  demoLesson && demoLesson?.file && (
                    <VideoPreview
                      title="Demo Lesson Video"
                      videoFile={demoLesson.file}
                    />
                  )
                }
              </>
            );
          }}
        </Form.Item>
        <UploadFormItem
          name="demoLesson"
          label="Demo lesson video"
          maxCount={1}
          accept="video/*" // Only accept video files
        />
      </Flex>
    </Flex>
  );
}
