import { Breadcrumb, Flex, Form, Spin } from 'antd';
import FormMaker from 'src/components/form/FormMaker';
import MainTitleDescription from 'src/components/mainTitleDesc';
import CountDown from '../../_components/countdown';
import styles from './apply.module.scss';
import useApply from './useApply';
import { CustomButton } from 'src/components/common';
import { ArrowRight } from 'src/components/icons';
import useUndergraduate from './useUndergraduate';
import { EVENT_DEADLINE } from '../../_components/CurrentEventSection/useCurrentEvent';
import ApplicationClosed from '../_components/application-closed';

export default function ApplyToEventPage() {
  const { breadcrumbItems, undergraduateFormItems } = useApply();

  const { loading, form, onComplete } = useUndergraduate();

  return <ApplicationClosed breadcrumbItems={breadcrumbItems} />;

  // Original form code (commented out)
  return (
    <main>
      <div className={'container ' + styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <Flex justify="space-between" align="center">
          <MainTitleDescription
            title="Top 100 Uni Camp 2025 Bachelor's"
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
          <FormMaker formItems={undergraduateFormItems.formItems} />
          <div className={styles.fileTypeInfo}>
            <p>
              Allowed file types are Text (TXT), PDF, Word Document (DOC), Word
              Document (DOCX), Image (JPEG/JPG), Image (PNG), Image (GIF)
            </p>
          </div>
          <FormMaker formItems={undergraduateFormItems.formItemEssay} />
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
