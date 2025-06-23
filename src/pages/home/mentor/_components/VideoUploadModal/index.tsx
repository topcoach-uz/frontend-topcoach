import { Form, message, Modal } from 'antd';
import { UploadFormItem } from 'src/components/form';
import styles from './VideoUploadModal.module.scss';
import { api } from 'src/app/api';
import { MEDIA_TAGS } from 'src/app/api/Api';
import VideoPreview from 'src/components/common/video-preview';
import { Dispatch, SetStateAction, useState } from 'react';

interface Props {
  modalOpen: boolean;
  handleCancel: () => void;
  setVideosUploaded: Dispatch<SetStateAction<boolean>>;
}

export default function VideoUploadModal({
  handleCancel,
  modalOpen,
  setVideosUploaded,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const introductionVideoFormData = new FormData();
      introductionVideoFormData.append('video', values.introductionVideo.file);
      introductionVideoFormData.append('tags', MEDIA_TAGS.IntroVideo);

      const demoLessonFormData = new FormData();
      demoLessonFormData.append('video', values.demoLesson.file);
      demoLessonFormData.append('tags', MEDIA_TAGS.DemoLession);

      setLoading(true);
      Promise.all([
        api.users.uploadMentorVideos(introductionVideoFormData as any),
        api.users.uploadMentorVideos(demoLessonFormData as any),
      ])
        .then((res) => {
          message.success('Videos uploaded successfully', 7);
          handleCancel();
          setVideosUploaded(true);
        })
        .catch((err) => {
          message.error(
            `Failed to upload the videos: ${err?.response?.data?.message}`,
            7
          );
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      onOk={handleOk}
      okButtonProps={{ loading }}
      okText="Submit"
      width={'max-content'}
      title="Upload your introduction video and demo lesson video."
      maskClosable={false}
      destroyOnClose
    >
      <ul className={styles.ul}>
        <li>The video files should not be more than 150MB each.</li>
      </ul>
      <Form form={form} layout="vertical">
        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const introductionVideo = getFieldValue('introductionVideo');
            return (
              <>
                {introductionVideo &&
                  introductionVideo.file &&
                  introductionVideo.file.status !== 'removed' && (
                    <VideoPreview
                      title="Introduction Video Preview"
                      videoFile={introductionVideo.file}
                    />
                  )}
              </>
            );
          }}
        </Form.Item>
        <UploadFormItem
          name="introductionVideo"
          required
          message="Please upload your introduction video"
          label="Introduction video"
          maxCount={1}
          accept="video/*" // Only accept video files
        />
        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const demoLesson = getFieldValue('demoLesson');

            return (
              <>
                {demoLesson &&
                  demoLesson?.file &&
                  demoLesson?.file?.status !== 'removed' && (
                    <VideoPreview
                      title="Demo Lesson Video Preview"
                      videoFile={demoLesson.file}
                    />
                  )}
              </>
            );
          }}
        </Form.Item>
        <UploadFormItem
          name="demoLesson"
          required
          message="Please upload your demo lesson video"
          label="Demo lesson video"
          maxCount={1}
          accept="video/*" // Only accept video files
        />
      </Form>
    </Modal>
  );
}
