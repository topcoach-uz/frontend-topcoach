import { Checkbox, Flex, Form, Modal, Alert } from 'antd';
import { Dispatch, SetStateAction } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CustomText } from 'src/components/common';
import { InputFormItem, SelectFormItem } from 'src/components/form';
import AvatarFormItem from 'src/components/form/common/AvatarFormItem';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import useColors from 'src/hooks/useColors';
import VideoUploadFormItems from './_components/VideoUploadFormItems';
import useEditProfile from './useEditProfile';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from 'src/app/store';
import { logout } from 'src/app/slices/authSlice';

interface Props {
  isModalVisible: boolean;
  setIsModalVisible: Dispatch<SetStateAction<boolean>>;
  role: string; // UserRole.Mentor or UserRole.Student
}

export default function EditProfileModal({
  isModalVisible,
  setIsModalVisible,
  role,
}: Props) {
  const {
    form,
    handleCancel,
    handleUpdateProfile,
    loading: loadingObj,
    universityList,
    showManualUniversity,
    fileList,
    userData,
  } = useEditProfile({ isModalVisible, setIsModalVisible });

  const colors = useColors();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const loading = Object.values(loadingObj).some((value) => value);

  const formItems = getFormItems(t, role);

  const canCloseModal = true; // Assuming canCloseModal is always true

  const phoneNumberMissing = !userData?.phoneNumber || (userData as any)?.phone_number_missing;

  const handleForceClose = () => {
    Modal.confirm({
      title: 'Update Phone Number Required',
      content: 'You must update your phone number to continue. Would you like to go back to the login page or update your profile?',
      okText: 'Go to Login',
      cancelText: 'Update Profile',
      onOk: () => {
        dispatch(logout());
        navigate('/auth/login');
      },
      onCancel: () => {
        // Do nothing, keep modal open
      },
    });
  };

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={phoneNumberMissing ? handleForceClose : handleCancel}
        title={t('editProfile.title')}
        okText="Update profile"
        cancelText="Cancel"
        onOk={handleUpdateProfile}
        confirmLoading={loading}
        closable={true}
        maskClosable={true}
        style={{ top: 80 }}
      >
        <Form layout="vertical" form={form}>
          {role === 'Mentor' && (
            <Flex
              justify="space-between"
              align="center"
              style={{ height: 'max-content' }}
              vertical={fileList?.length >= 1}
            >
              <AvatarFormItem
                name="avatar"
                form={form}
                accept="image/*"
                uploadText={t('shared.uploadText')}
                replaceText={t('shared.replaceText')}
                message="You can't leave this field empty"
              />
              <CustomText
                fontSize={14}
                fontWeight={400}
                ml={10}
                color={colors.colorTextDescription}
              >
                {t('shared.imgUpload')}
              </CustomText>
            </Flex>
          )}

          {(userData?.phoneNumber === '' || (userData as any)?.phone_number_missing) && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('editProfile.phoneNumberRequired')}
            />
          )}

          <FormMaker formItems={formItems} />

          {role === 'Mentor' && (
            <>
              <SelectFormItem
                name="selectedUniversities"
                label={t('shared.university')}
                placeholder={t('shared.universityPlaceholder')}
                optionFilterProp="label"
                col={24}
                allowClear
                showSearch
                required={!showManualUniversity}
                disabled={showManualUniversity}
                message={!showManualUniversity ? t('signUp.universityError') : ''}
                // @ts-ignore
                options={
                  universityList?.map((uni) => ({
                    // @ts-ignore
                    label: uni.name, // Ensure label is always a string
                    value: uni.id,
                  })) || []
                }
              />

              <Form.Item name="customUniversity" valuePropName="checked">
                <Flex gap={10} style={{ cursor: 'pointer' }}>
                  <Checkbox
                    defaultChecked={showManualUniversity}
                    checked={Form.useWatch('customUniversity', form)}
                  >
                    {t('shared.notListed')}
                  </Checkbox>
                </Flex>
              </Form.Item>

              {showManualUniversity && (
                <InputFormItem
                  name="university"
                  col={24}
                  label={t('shared.universityType')}
                  placeholder={t('shared.universityTypePlaceholder')}
                  inputType="text"
                  message={t('signUp.universityError')}
                />
              )}
            </>
          )}

          <Link to="/auth/forgot-password/sent">Reset Password</Link>

          {role === 'Mentor' && <VideoUploadFormItems form={form} />}
        </Form>
      </Modal>
    </>
  );
}

const getFormItems = (t: TFunction, role: string): IFormItemType[] => {
  const base: IFormItemType[] = [
    {
      name: 'name',
      type: 'input',
      label: t('shared.fullNameLabel'),
      placeholder: t('shared.fullNamePlaceholder'),
      inputType: 'text',
      message: "You can't leave this field empty",
    },
    {
      name: 'phoneNumber',
      type: 'input',
      label: t('editProfile.phoneNumberLabel'),
      inputType: 'text',
      htmlType: 'tel',
      placeholder: t('editProfile.phoneNumberPlaceholder'),
      message: "You can't leave this field empty",
    },
  ];
  if (role === 'Mentor') {
    return [
      ...base,
      {
        name: 'linkedin',
        type: 'input',
        label: t('shared.linkedIn'),
        inputType: 'text',
        placeholder: t('shared.linkedInPlaceholder'),
        message: t('signUp.linkedInError'),
      },
    ];
  }
  return base;
};
