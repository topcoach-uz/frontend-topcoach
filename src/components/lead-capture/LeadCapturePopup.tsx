import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Radio, Space, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSubmitFormMutation } from 'src/app/services/contactApi';
import { useTypedSelector } from 'src/app/store';
import styles from './LeadCapturePopup.module.scss';

const { TextArea } = Input;

type ServiceType = 'mentors' | 'admissions' | 'myJourney' | 'workshops' | null;

interface LeadCapturePopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function LeadCapturePopup({ visible, onClose }: LeadCapturePopupProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceType>(null);
  const [submitForm, { isLoading }] = useSubmitFormMutation();
  const { isAuthenticated, profile } = useTypedSelector((state) => state.auth);

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (isAuthenticated && profile && visible) {
      form.setFieldsValue({
        fullName: profile.profile?.name || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [isAuthenticated, profile, visible, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCurrentStep(0);
      setSelectedService(null);
    }
  }, [visible, form]);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
      setSelectedService(null);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
    form.validateFields().then(() => {
      setCurrentStep(2);
    }).catch(() => {
      // Validation failed
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      // Prepare form data based on selected service
      const formData: any = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        country: values.country || 'Not specified',
        currentEducationLevel: values.educationLevel || 'Not specified',
        howDidYouHear: 'Landing Page Popup',
        additionalMessage: buildAdditionalMessage(selectedService, values),
      };

      await submitForm(formData).unwrap();
      
      // Mark as submitted so it will NEVER show again (persists across all sessions)
      localStorage.setItem('lead-capture-popup-submitted', 'true');
      sessionStorage.setItem('lead-capture-popup-closed', 'true');
      
      message.success(t('leadCapture.submitSuccess'));
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      message.error(error?.data?.message || t('leadCapture.submitError'));
    }
  };

  const buildAdditionalMessage = (service: ServiceType, values: any): string => {
    let message = `Service Interest: ${getServiceName(service)}\n`;
    
    if (service === 'mentors') {
      message += `Support Needed: ${values.supportType || 'Not specified'}\n`;
      message += `Preferred Mentor Level: ${values.mentorLevel || 'Not specified'}\n`;
    } else if (service === 'admissions') {
      message += `Goal: ${values.admissionGoal || 'Not specified'}\n`;
    } else if (service === 'myJourney') {
      message += `Need: ${values.journeyNeed || 'Not specified'}\n`;
    } else if (service === 'workshops') {
      message += `Interest: ${values.workshopInterest || 'Not specified'}\n`;
    }
    
    if (values.additionalNotes) {
      message += `Additional Notes: ${values.additionalNotes}`;
    }
    
    return message;
  };

  const getServiceName = (service: ServiceType): string => {
    const names: Record<string, string> = {
      mentors: t('leadCapture.services.mentors'),
      admissions: t('leadCapture.services.admissions'),
      myJourney: t('leadCapture.services.myJourney'),
      workshops: t('leadCapture.services.workshops'),
    };
    return names[service || ''] || 'Unknown';
  };

  const handleClose = () => {
    const isDev = import.meta.env.DEV;
    
    // Only set sessionStorage - this will clear on page reload/browser restart
    // So popup can show again after reopening page/browser (unless submitted)
    sessionStorage.setItem('lead-capture-popup-closed', 'true');
    
    if (isDev) {
      console.log('[LeadCapturePopup] Closed - sessionStorage set:', {
        'lead-capture-popup-closed': sessionStorage.getItem('lead-capture-popup-closed'),
        'lead-capture-popup-submitted': localStorage.getItem('lead-capture-popup-submitted'),
      });
    }
    
    form.resetFields();
    setCurrentStep(0);
    setSelectedService(null);
    onClose();
  };

  const serviceOptions = [
    { value: 'mentors', label: t('leadCapture.services.mentors'), icon: '👥', description: t('leadCapture.services.mentorsDesc') },
    { value: 'admissions', label: t('leadCapture.services.admissions'), icon: '🎓', description: t('leadCapture.services.admissionsDesc') },
    { value: 'myJourney', label: t('leadCapture.services.myJourney'), icon: '📚', description: t('leadCapture.services.myJourneyDesc') },
    { value: 'workshops', label: t('leadCapture.services.workshops'), icon: '📅', description: t('leadCapture.services.workshopsDesc') },
  ];

  const renderServiceSelector = () => (
    <div className={styles.service_selector}>
      <h3 className={styles.step_title}>{t('leadCapture.serviceQuestion')}</h3>
      <p className={styles.step_subtitle}>{t('leadCapture.serviceSubtitle')}</p>
      <div className={styles.service_grid}>
        {serviceOptions.map((option) => (
          <div
            key={option.value}
            className={styles.service_option}
            onClick={() => handleServiceSelect(option.value as ServiceType)}
          >
            <div className={styles.service_icon}>{option.icon}</div>
            <div className={styles.service_content}>
              <div className={styles.service_label}>{option.label}</div>
              <div className={styles.service_description}>{option.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConditionalQuestions = () => {
    if (!selectedService) return null;

    if (selectedService === 'mentors') {
      return (
        <div className={styles.questions_section}>
          <h3 className={styles.step_title}>{t('leadCapture.mentorMatching.title')}</h3>
          <p className={styles.step_subtitle}>{t('leadCapture.mentorMatching.subtitle')}</p>
          
          <Form.Item
            name="supportType"
            label={t('leadCapture.mentorMatching.supportQuestion')}
            rules={[{ required: true, message: t('leadCapture.mentorMatching.supportRequired') }]}
          >
            <Radio.Group className={styles.radio_group}>
              <Space direction="vertical">
                <Radio value="application_strategy">{t('leadCapture.mentorMatching.options.applicationStrategy')}</Radio>
                <Radio value="scholarship_search">{t('leadCapture.mentorMatching.options.scholarshipSearch')}</Radio>
                <Radio value="university_selection">{t('leadCapture.mentorMatching.options.universitySelection')}</Radio>
                <Radio value="interview_prep">{t('leadCapture.mentorMatching.options.interviewPrep')}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="mentorLevel"
            label={t('leadCapture.mentorMatching.levelQuestion')}
            rules={[{ required: true, message: t('leadCapture.mentorMatching.levelRequired') }]}
          >
            <Radio.Group className={styles.radio_group}>
              <Space direction="vertical">
                <Radio value="probono">{t('leadCapture.mentorMatching.options.probono')}</Radio>
                <Radio value="junior">{t('leadCapture.mentorMatching.options.junior')}</Radio>
                <Radio value="senior">{t('leadCapture.mentorMatching.options.senior')}</Radio>
                <Radio value="expert">{t('leadCapture.mentorMatching.options.expert')}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </div>
      );
    }

    if (selectedService === 'admissions') {
      return (
        <div className={styles.questions_section}>
          <h3 className={styles.step_title}>{t('leadCapture.admissions.title')}</h3>
          <p className={styles.step_subtitle}>{t('leadCapture.admissions.subtitle')}</p>
          
          <Form.Item
            name="admissionGoal"
            label={t('leadCapture.admissions.goalQuestion')}
            rules={[{ required: true, message: t('leadCapture.admissions.goalRequired') }]}
          >
            <Radio.Group className={styles.radio_group}>
              <Space direction="vertical">
                <Radio value="top_universities">{t('leadCapture.admissions.options.topUniversities')}</Radio>
                <Radio value="scholarships">{t('leadCapture.admissions.options.scholarships')}</Radio>
                <Radio value="essay_help">{t('leadCapture.admissions.options.essayHelp')}</Radio>
                <Radio value="complete_guidance">{t('leadCapture.admissions.options.completeGuidance')}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </div>
      );
    }

    if (selectedService === 'myJourney') {
      return (
        <div className={styles.questions_section}>
          <h3 className={styles.step_title}>{t('leadCapture.myJourney.title')}</h3>
          <p className={styles.step_subtitle}>{t('leadCapture.myJourney.subtitle')}</p>
          
          <Form.Item
            name="journeyNeed"
            label={t('leadCapture.myJourney.needQuestion')}
            rules={[{ required: true, message: t('leadCapture.myJourney.needRequired') }]}
          >
            <Radio.Group className={styles.radio_group}>
              <Space direction="vertical">
                <Radio value="track_applications">{t('leadCapture.myJourney.options.trackApplications')}</Radio>
                <Radio value="manage_essays">{t('leadCapture.myJourney.options.manageEssays')}</Radio>
                <Radio value="organize_documents">{t('leadCapture.myJourney.options.organizeDocuments')}</Radio>
                <Radio value="stay_organized">{t('leadCapture.myJourney.options.stayOrganized')}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </div>
      );
    }

    if (selectedService === 'workshops') {
      return (
        <div className={styles.questions_section}>
          <h3 className={styles.step_title}>{t('leadCapture.workshops.title')}</h3>
          <p className={styles.step_subtitle}>{t('leadCapture.workshops.subtitle')}</p>
          
          <Form.Item
            name="workshopInterest"
            label={t('leadCapture.workshops.interestQuestion')}
            rules={[{ required: true, message: t('leadCapture.workshops.interestRequired') }]}
          >
            <Radio.Group className={styles.radio_group}>
              <Space direction="vertical">
                <Radio value="university_applications">{t('leadCapture.workshops.options.universityApplications')}</Radio>
                <Radio value="scholarships">{t('leadCapture.workshops.options.scholarships')}</Radio>
                <Radio value="essay_writing">{t('leadCapture.workshops.options.essayWriting')}</Radio>
                <Radio value="general_guidance">{t('leadCapture.workshops.options.generalGuidance')}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </div>
      );
    }

    return null;
  };

  const renderContactForm = () => (
    <div className={styles.contact_section}>
      <h3 className={styles.step_title}>{t('leadCapture.contact.title')}</h3>
      <p className={styles.step_subtitle}>{t('leadCapture.contact.subtitle')}</p>

      <Form.Item
        name="fullName"
        label={t('leadCapture.contact.fullName')}
        rules={[
          { required: true, message: t('leadCapture.contact.fullNameRequired') },
          { min: 2, message: t('leadCapture.contact.fullNameMin') }
        ]}
      >
        <Input
          prefix={<UserOutlined className={styles.input_icon} />}
          placeholder={t('leadCapture.contact.fullNamePlaceholder')}
          size="large"
          className={styles.form_input}
        />
      </Form.Item>

      <Form.Item
        name="email"
        label={t('leadCapture.contact.email')}
        rules={[
          { required: true, message: t('leadCapture.contact.emailRequired') },
          { type: 'email', message: t('leadCapture.contact.emailInvalid') }
        ]}
      >
        <Input
          prefix={<MailOutlined className={styles.input_icon} />}
          placeholder={t('leadCapture.contact.emailPlaceholder')}
          size="large"
          className={styles.form_input}
        />
      </Form.Item>

      <Form.Item
        name="phoneNumber"
        label={t('leadCapture.contact.phoneNumber')}
        rules={[
          { required: true, message: t('leadCapture.contact.phoneRequired') }
        ]}
      >
        <Input
          prefix={<PhoneOutlined className={styles.input_icon} />}
          placeholder={t('leadCapture.contact.phonePlaceholder')}
          size="large"
          className={styles.form_input}
        />
      </Form.Item>

      <Form.Item
        name="country"
        label={t('leadCapture.contact.country')}
      >
        <Input
          placeholder={t('leadCapture.contact.countryPlaceholder')}
          size="large"
          className={styles.form_input}
        />
      </Form.Item>

      <Form.Item
        name="educationLevel"
        label={t('leadCapture.contact.educationLevel')}
      >
        <Radio.Group className={styles.radio_group}>
          <Space direction="vertical">
            <Radio value="high_school">{t('leadCapture.contact.educationOptions.highSchool')}</Radio>
            <Radio value="university">{t('leadCapture.contact.educationOptions.university')}</Radio>
            <Radio value="graduate">{t('leadCapture.contact.educationOptions.graduate')}</Radio>
            <Radio value="other">{t('leadCapture.contact.educationOptions.other')}</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="additionalNotes"
        label={t('leadCapture.contact.additionalNotes')}
      >
        <TextArea
          rows={3}
          placeholder={t('leadCapture.contact.additionalNotesPlaceholder')}
          className={styles.form_textarea}
        />
      </Form.Item>
    </div>
  );

  // Steps removed - no longer needed for display

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
      className={styles.lead_capture_modal}
      centered
      closeIcon={null}
    >
      <div className={styles.modal_content}>
        {/* Header */}
        <div className={styles.modal_header}>
          <h2 className={styles.modal_title}>{t('leadCapture.title')}</h2>
          <p className={styles.modal_subtitle}>{t('leadCapture.subtitle')}</p>
        </div>

        {/* Form Content */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={styles.lead_form}
        >
          <div className={styles.form_content}>
            {currentStep === 0 && renderServiceSelector()}
            {currentStep === 1 && renderConditionalQuestions()}
            {currentStep === 2 && renderContactForm()}
          </div>

          {/* Navigation Buttons */}
          <div className={styles.form_actions}>
            {currentStep > 0 && (
              <Button
                type="default"
                onClick={handleBack}
                className={styles.back_button}
              >
                {t('leadCapture.back')}
              </Button>
            )}
            
            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={currentStep === 0}
                className={styles.next_button}
                icon={<ArrowRightOutlined />}
              >
                {t('leadCapture.next')}
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className={styles.submit_button}
              >
                {t('leadCapture.submit')}
              </Button>
            )}
            
            {currentStep === 0 && (
              <Button
                type="text"
                onClick={handleClose}
                className={styles.skip_button}
              >
                {t('leadCapture.maybeLater')}
              </Button>
            )}
          </div>
        </Form>
      </div>
    </Modal>
  );
}

