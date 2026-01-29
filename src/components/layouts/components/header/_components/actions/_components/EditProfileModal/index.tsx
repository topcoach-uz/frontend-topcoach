import { Checkbox, Flex, Form, Modal } from 'antd';
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
import { Link } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';

interface Props {
  isModalVisible: boolean;
  setIsModalVisible: Dispatch<SetStateAction<boolean>>;
}

export default function EditProfileModal({
  isModalVisible,
  setIsModalVisible,
}: Props) {
  const {
    form,
    handleCancel,
    handleUpdateProfile,
    loading: loadingObj,
    universityList,
    showManualUniversity,
    fileList,
  } = useEditProfile({ isModalVisible, setIsModalVisible });

  const colors = useColors();
  const { t } = useTranslation();

  const loading = Object.values(loadingObj).some((value) => value);

  const userData = useTypedSelector((state) => state.auth.profile);
  const role = userData?.profile?.role;
  const customUniversityValue = Form.useWatch('customUniversity', form);

  const formItems = getFormItems(t);

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        title={t('editProfile.title')}
        okText="Update profile"
        okButtonProps={{ loading: loading }}
        maskClosable={false}
        onOk={handleUpdateProfile}
        destroyOnClose={true}
        style={{ top: 48 }}
      >
        <Form layout="vertical" form={form}>
          <Flex
            justify="space-between"
            align="center"
            style={{ height: 'max-content' }}
            vertical={fileList?.length >= 1}
          >
            {role !== 'Student' && (
              <>
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
              </>
            )}
          </Flex>

          {/* Only show full name and phone number for students */}
          {role === 'Student' ? (
            <>
              <InputFormItem
                name="name"
                label={t('shared.fullNameLabel')}
                inputType="text"
                message={"You can't leave this field empty"}
              />
            </>
          ) : (
            <>
          <FormMaker formItems={formItems} />
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
                    checked={customUniversityValue}
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
          <SelectFormItem
            name="tags"
            label={t('signUp.tags') || 'Specializations'}
            placeholder={t('signUp.tagsPlaceholder') || 'Select your areas of specialization (optional)'}
            options={[
              { label: 'Business & MBA', value: 'business' },
              { label: 'Computer Science & Engineering', value: 'computer-science' },
              { label: 'Medicine & Health Sciences', value: 'medicine' },
              { label: 'Law', value: 'law' },
              { label: 'Humanities & Social Sciences', value: 'humanities' },
              { label: 'Arts & Design', value: 'arts' },
              { label: 'Natural Sciences', value: 'natural-sciences' },
              { label: 'Mathematics & Statistics', value: 'mathematics' },
              { label: 'Economics & Finance', value: 'economics' },
              { label: 'Engineering', value: 'engineering' },
              { label: 'Education', value: 'education' },
              { label: 'International Relations', value: 'international-relations' },
            ]}
            mode="multiple"
            col={24}
            showSearch
            filterOption={(input, option) => {
              const label = String(option?.label ?? '');
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          />
          <Link to="/auth/forgot-password/sent">Reset Password</Link>
          <VideoUploadFormItems form={form} />
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}

const getFormItems = (t: TFunction): IFormItemType[] => [
  {
    name: 'name',
    type: 'input',
    label: t('shared.fullNameLabel'),
    placeholder: t('shared.fullNamePlaceholder'),
    inputType: 'text',
    message: "You can't leave this field empty",
  },
  {
    name: 'major',
    type: 'input',
    label: t('shared.major'),
    placeholder: t('shared.majorPlaceholder'),
    inputType: 'text',
    col: 24,
    message: "You can't leave this field empty",
  },
  {
    name: 'summary',
    type: 'input',
    label: t('signUp.aboutMe') || 'About Me',
    placeholder: t('signUp.aboutMePlaceholder') || 'Introduce yourself briefly...',
    inputType: 'textarea',
    col: 24,
    row: 4,
    message: "Please provide a brief introduction",
  },
  {
    name: 'whyDoICoach',
    type: 'input',
    label: t('signUp.whyDoICoach') || 'Why do I coach?',
    placeholder: t('signUp.whyDoICoachPlaceholder') || 'Share your motivation...',
    inputType: 'textarea',
    col: 24,
    row: 4,
    message: "Please share your motivation",
  },
  {
    name: 'mentorshipValue',
    type: 'input',
    label: t('signUp.value') || 'What value can you provide?',
    placeholder: t('signUp.valuePlaceholder') || 'Describe how you can support mentees...',
    inputType: 'textarea',
    col: 24,
    row: 4,
    message: "Please describe your value",
  },
  {
    name: 'mentoringExperience',
    type: 'input',
    label: t('signUp.experience') || 'Mentoring experience',
    placeholder: t('signUp.experiencePlaceholder') || 'If you have mentoring experience...',
    inputType: 'textarea',
    col: 24,
    row: 4,
    message: "Please describe your experience",
  },
  {
    name: 'linkedin',
    type: 'input',
    label: t('shared.linkedIn'),
    placeholder: t('shared.linkedInPlaceholder'),
    inputType: 'text',
    col: 24,
    message: "You can't leave this field empty",
  },
];
