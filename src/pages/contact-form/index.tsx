import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Card, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSubmitFormMutation } from 'src/app/services/contactApi';
import MainTitleDescription from 'src/components/mainTitleDesc';
import styles from './contactForm.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ContactFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  country: string;
  howDidYouHear?: string;
  currentEducationLevel?: string;
  additionalMessage?: string;
}

export default function ContactFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [submitForm, { isLoading }] = useSubmitFormMutation();

  const countries = [
    'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan',
    'Russia', 'Turkey', 'United States', 'United Kingdom', 'Canada',
    'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Other'
  ];

  const educationLevels = [
    'High School Student',
    'High School Graduate',
    'University Student',
    'University Graduate',
    'Master\'s Student',
    'Master\'s Graduate',
    'PhD Student',
    'PhD Graduate',
    'Other'
  ];

  const hearAboutUsOptions = [
    'Social Media (Instagram, Facebook, etc.)',
    'Google Search',
    'Friend/Family Recommendation',
    'University/College',
    'Online Advertisement',
    'TopCoach Event/Workshop',
    'Other'
  ];

  const handleSubmit = async (values: ContactFormData) => {
    try {
      await submitForm(values).unwrap();
      setSubmitted(true);
      message.success(t('contactForm.successMessage'));
    } catch (error: any) {
      if (error.status === 409) {
        message.warning(t('contactForm.alreadySubmitted'));
      } else {
        message.error(t('contactForm.errorMessage'));
      }
    }
  };

  const handleBackToPrograms = () => {
    navigate('/programs');
  };

  if (submitted) {
    return (
      <main className={styles.container}>
        <div className={'container ' + styles.content}>
          <Card className={styles.success_card}>
            <Space direction="vertical" size="large" style={{ textAlign: 'center', width: '100%' }}>
              <div className={styles.success_icon}>✓</div>
              <Title level={2}>{t('contactForm.successTitle')}</Title>
              <Text className={styles.success_message}>
                {t('contactForm.successDescription')}
              </Text>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleBackToPrograms}
                className={styles.back_button}
              >
                {t('contactForm.backToPrograms')}
              </Button>
            </Space>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={'container ' + styles.content}>
        <MainTitleDescription
          title={t('contactForm.title')}
          description={t('contactForm.description')}
          mb={32}
        />

        <Card className={styles.form_card}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.form}
            size="large"
          >
            <div className={styles.form_section}>
              <Title level={4}>{t('contactForm.requiredFields')}</Title>
              
              <Form.Item
                name="fullName"
                label={t('contactForm.fullName')}
                rules={[
                  { required: true, message: t('contactForm.fullNameRequired') }
                ]}
              >
                <Input placeholder={t('contactForm.fullNamePlaceholder')} />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label={t('contactForm.phoneNumber')}
                rules={[
                  { required: true, message: t('contactForm.phoneNumberRequired') }
                ]}
              >
                <Input placeholder={t('contactForm.phoneNumberPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('contactForm.email')}
                rules={[
                  { required: true, message: t('contactForm.emailRequired') },
                  { type: 'email', message: t('contactForm.emailInvalid') }
                ]}
              >
                <Input placeholder={t('contactForm.emailPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="country"
                label={t('contactForm.country')}
                rules={[
                  { required: true, message: t('contactForm.countryRequired') }
                ]}
              >
                <Select placeholder={t('contactForm.countryPlaceholder')}>
                  {countries.map(country => (
                    <Option key={country} value={country}>{country}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <div className={styles.form_section}>
              <Title level={4}>{t('contactForm.optionalFields')}</Title>
              
              <Form.Item
                name="howDidYouHear"
                label={t('contactForm.howDidYouHear')}
              >
                <Select placeholder={t('contactForm.howDidYouHearPlaceholder')} allowClear>
                  {hearAboutUsOptions.map(option => (
                    <Option key={option} value={option}>{option}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="currentEducationLevel"
                label={t('contactForm.currentEducationLevel')}
              >
                <Select placeholder={t('contactForm.currentEducationLevelPlaceholder')} allowClear>
                  {educationLevels.map(level => (
                    <Option key={level} value={level}>{level}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="additionalMessage"
                label={t('contactForm.additionalMessage')}
              >
                <TextArea 
                  rows={4} 
                  placeholder={t('contactForm.additionalMessagePlaceholder')}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>

            <Form.Item className={styles.submit_section}>
              <Space size="middle">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading}
                  size="large"
                  className={styles.submit_button}
                >
                  {t('contactForm.submit')}
                </Button>
                <Button 
                  size="large" 
                  onClick={handleBackToPrograms}
                  className={styles.cancel_button}
                >
                  {t('contactForm.cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </main>
  );
}