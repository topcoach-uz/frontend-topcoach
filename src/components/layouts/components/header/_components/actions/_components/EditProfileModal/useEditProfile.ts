import { message, UploadFile } from 'antd';
import { useForm, useWatch } from 'antd/es/form/Form';
import { UploadFileStatus } from 'antd/es/upload/interface';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { api } from 'src/app/api';
import { MEDIA_TAGS, UpdateUserDto } from 'src/app/api/Api';
import { useInvalidateGetMeMutation } from 'src/app/services/users';
import { setProfileImage, updateProfile } from 'src/app/slices/authSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import useApi from 'src/hooks/useApi';
import { getLatestCreatedImg } from 'src/utils';
import axios from 'axios';
import { baseUrl } from 'src/app/services/api/const';

// Custom video upload function with longer timeout
const uploadVideoWithTimeout = async (formData: FormData, endpoint: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await axios.post(`${baseUrl}${endpoint}`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes timeout for video uploads
  });
  
  return response.data;
};

interface Props {
  isModalVisible: boolean;
  setIsModalVisible: Dispatch<SetStateAction<boolean>>;
}

export default function useEditProfile({
  isModalVisible,
  setIsModalVisible,
}: Props) {
  const [form] = useForm();
  const [loading, setLoading] = useState({
    dataLoading: false,
    pictureLoading: false,
    demoLessonLoading: false,
    introVideoLoading: false,
  });
  const [success, setSuccess] = useState({
    data: false,
    picture: false,
    demoLesson: false,
    introVideo: false,
  });

  const { response } = useApi(
    () => api.university.getUnivsList(),
    [isModalVisible],
    isModalVisible
  );
  const universityList = response?.data;

  const userData = useTypedSelector((state) => state.auth.profile);
  const dispatch = useAppDispatch();
  const showManualUniversity = form.getFieldValue('customUniversity');
  const [invalidateGetMe, {}] = useInvalidateGetMeMutation();

  const fileList = useWatch('avatar', form) as UploadFile[];
  const profileImage = getLatestCreatedImg(userData?.profile?.media || []);

  const image: UploadFile = {
    uid: 'fromBackend',
    name: 'profile.png',
    status: 'done' as UploadFileStatus,
    url: profileImage,
  };

  useEffect(() => {
    // If all the loading states are set to false and at least one success state is true, close the modal
    if (
      !loading.dataLoading &&
      !loading.pictureLoading &&
      !loading.demoLessonLoading &&
      !loading.introVideoLoading &&
      (success.data ||
        success.picture ||
        success.demoLesson ||
        success.introVideo)
    ) {
      setIsModalVisible(false);
      invalidateGetMe();
    }
  }, [loading, success]);

  useEffect(() => {
    if (userData?.profile) {
      // Always set name and phoneNumber
      form.setFieldsValue({
        name: userData?.profile?.name,
        phoneNumber: userData?.phoneNumber,
      });
      // Only set mentor-specific fields for mentors
      if (userData.profile.role !== 'Student') {
        form.setFieldsValue({
          email: userData?.email,
          major: userData?.mentorProfile?.major,
          summary: userData?.mentorProfile?.summary,
          selectedUniversities: userData?.selectedUniversities?.[0]?.id,
          // @ts-ignore
          linkedin: userData?.profile?.contacts?.socials?.linkedin,
          avatar: [image],
        });
        if (userData.mentorProfile?.university) {
          form.setFieldsValue({
            customUniversity: true,
            university: userData?.mentorProfile?.university,
            selectedUniversities: [],
          });
        } else {
          form.setFieldsValue({
            customUniversity: false,
            university: undefined,
          });
        }
      }
    }
  }, [isModalVisible]);

  const handleUpdateProfile = async () => {
    const values = await form.validateFields();
    // If student, only update name and phoneNumber
    if (userData?.profile?.role === 'Student') {
      const data: UpdateUserDto = {
        phoneNumber: values.phoneNumber?.trim(),
        // @ts-ignore
        profile: {
          name: values.name?.trim(),
        },
      };
      setLoading((prev) => ({ ...prev, dataLoading: true }));
      dispatch(updateProfile(data))
        .unwrap()
        .then(() => {
          message.success('Profile updated successfully');
        })
        .catch((err) => {
          message.error(err.message);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, dataLoading: false }));
          setSuccess((prev) => ({ ...prev, data: true }));
        });
      return;
    }

    const university = values.customUniversity
      ? { university: values.university?.trim() }
      : { university: '' };

    const selectedUniversitiesForUpdate = values.customUniversity
      ? undefined
      : [{ id: values.selectedUniversities }];

    const phoneNumber = values.phoneNumber?.trim()
      ? { phoneNumber: values.phoneNumber?.trim() }
      : undefined;

    const data: UpdateUserDto = {
      ...phoneNumber,
      // @ts-ignore
      mentorProfile: {
        major: values.major?.trim(),
        summary: values.summary?.trim(),
        ...university,
      },
      // @ts-ignore
      profile: {
        name: values.name?.trim(),
        contacts: {
          // @ts-ignore
          socials: {
            linkedin: values.linkedin?.trim(),
          },
        },
      },
      // @ts-ignore
      selectedUniversities: selectedUniversitiesForUpdate,
    };

    const isImageChanged =
      fileList.length > 0 && fileList[0].uid !== 'fromBackend';

    const normalizeValue = (value: any) => value?.trim?.() || '';

    // Updated isDataChanged logic
    const isDataChanged =
      normalizeValue(values.phoneNumber) !==
        normalizeValue(userData?.phoneNumber) ||
      normalizeValue(values.university) !==
        normalizeValue(userData?.mentorProfile?.university) ||
      normalizeValue(values.major) !==
        normalizeValue(userData?.mentorProfile?.major) ||
      normalizeValue(values.summary) !==
        normalizeValue(userData?.mentorProfile?.summary) ||
      normalizeValue(values.name) !== normalizeValue(userData?.profile?.name) ||
      normalizeValue(values.selectedUniversities) !==
        normalizeValue(userData?.selectedUniversities?.[0]?.id) ||
      normalizeValue(values.linkedin) !==
        normalizeValue(userData?.profile?.contacts?.socials?.linkedin);

    const isDemoLessonChanged =
      values.demoLesson?.uid !== 'fromBackendDemoLesson' && 
      values.demoLesson?.file?.status !== 'removed';

    const isIntroductionVideoChanged =
      values.introductionVideo?.uid !== 'fromBackendIntroductionVideo' && 
      values.introductionVideo?.file?.status !== 'removed';

    console.log('Change detection:', {
      isImageChanged,
      isDataChanged,
      isDemoLessonChanged,
      isIntroductionVideoChanged,
      demoLessonUid: values.demoLesson?.uid,
      introVideoUid: values.introductionVideo?.uid,
      demoLessonFileStatus: values.demoLesson?.file?.status,
      introVideoFileStatus: values.introductionVideo?.file?.status
    });

    if (
      !isImageChanged &&
      !isDataChanged &&
      !isDemoLessonChanged &&
      !isIntroductionVideoChanged
    ) {
      message.info('No changes detected');
      return;
    }

    if (isImageChanged) {
      const formData = new FormData();
      formData.append('profileImage', fileList[0].originFileObj as Blob);
      setLoading((prev) => ({ ...prev, pictureLoading: true }));
      api.users
        .updateProfileImage(formData as any)
        .then(() => {
          message.success('Profile photo updated successfully');
          setIsModalVisible(false);
          dispatch(
            setProfileImage(
              URL.createObjectURL(fileList[0].originFileObj as File)
            )
          );
        })
        .catch((err) => {
          message.error(err.message);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, pictureLoading: false }));
          setSuccess((prev) => ({ ...prev, picture: true }));
        });
    }

    if (isDataChanged) {
      setLoading((prev) => ({ ...prev, dataLoading: true }));
      dispatch(updateProfile(data))
        .unwrap()
        .then(() => {
          message.success('Profile updated successfully');
        })
        .catch((err) => {
          message.error(err.message);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, dataLoading: false }));
          setSuccess((prev) => ({ ...prev, data: true }));
        });
    }

    if (isDemoLessonChanged) {
      console.log('Uploading demo lesson video:', values.demoLesson);
      console.log('Demo lesson file:', values.demoLesson?.file);
      console.log('Demo lesson uid:', values.demoLesson?.uid);
      const formData = new FormData();
      formData.append('video', values.demoLesson.file as Blob);
      formData.append('tags', MEDIA_TAGS.DemoLession);
      setLoading((prev) => ({ ...prev, demoLessonLoading: true }));
      
      uploadVideoWithTimeout(formData, '/users/mentor/videos')
        .then(() => {
          message.success('Demo lesson uploaded');
        })
        .catch((err) => {
          console.error('Demo lesson upload error:', err);
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to upload demo lesson video';
          message.error(errorMessage);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, demoLessonLoading: false }));
          setSuccess((prev) => ({ ...prev, demoLesson: true }));
        });
    }

    if (isIntroductionVideoChanged) {
      console.log('Uploading introduction video:', values.introductionVideo);
      console.log('Introduction video file:', values.introductionVideo?.file);
      console.log('Introduction video uid:', values.introductionVideo?.uid);
      const formData = new FormData();
      formData.append('video', values.introductionVideo.file as Blob);
      formData.append('tags', MEDIA_TAGS.IntroVideo);
      setLoading((prev) => ({ ...prev, introVideoLoading: true }));
      
      uploadVideoWithTimeout(formData, '/users/mentor/videos')
        .then(() => {
          message.success('Introduction video uploaded');
        })
        .catch((err) => {
          console.error('Introduction video upload error:', err);
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to upload introduction video';
          message.error(errorMessage);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, introVideoLoading: false }));
          setSuccess((prev) => ({ ...prev, introVideo: true }));
        });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return {
    handleCancel,
    handleUpdateProfile,
    form,
    loading,
    universityList,
    showManualUniversity,
    fileList,
  };
}
