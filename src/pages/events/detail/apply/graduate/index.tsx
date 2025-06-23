import { App, Breadcrumb, Flex, Form, Spin } from 'antd';
import FormMaker from 'src/components/form/FormMaker';
import MainTitleDescription from 'src/components/mainTitleDesc';

import styles from './apply.module.scss';
import { CustomButton, CustomText } from 'src/components/common';
import { ArrowRight } from 'src/components/icons';
import useApply from '../useApply';
import CountDown from 'src/pages/events/_components/countdown';
import useGraduate from './useGraduate';
import { EVENT_DEADLINE } from 'src/pages/events/_components/CurrentEventSection/useCurrentEvent';
import ApplicationClosed from '../../_components/application-closed';

export default function ApplyToEventGraduagePage() {
  const { graduateFormItems, breadcrumbItems, eventId } = useApply();

  const { onComplete, form, loading } = useGraduate();

  return <ApplicationClosed breadcrumbItems={breadcrumbItems} />;

  return (
    <main>
      <div className={'container ' + styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <Flex justify="space-between" align="center">
          <MainTitleDescription
            title="Top 100 Uni Camp 2025 Masters'"
            description="Deadline: May 26th, 2025"
          />
          <Flex vertical align="center" gap={10}>
            <CountDown targetDate={EVENT_DEADLINE} />
          </Flex>
        </Flex>
        <Form
          onFinish={onComplete}
          form={form}
          layout="vertical"
          scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
        >
          <FormMaker formItems={graduateFormItems.formItemsGraduate} />
          <div className={styles.fileTypeInfo}>
            <p>
              Allowed file types are Text (TXT), PDF, Word Document (DOC), Word
              Document (DOCX), Image (JPEG/JPG), Image (PNG), Image (GIF)
            </p>
          </div>
          <CustomText fontSize={24} fontWeight={600}>
            Essay Questions
          </CustomText>
          <FormMaker formItems={graduateFormItems.formItemEssay} />
          <Form.Item>
            <CustomButton
              type="primary"
              icon={<ArrowRight />}
              iconPosition="end"
              htmlType="submit"
              mt={40}
            >
              Submit
            </CustomButton>
            {loading && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Spin size="large" />
                <p>Submitting your form...</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </main>
  );
}
