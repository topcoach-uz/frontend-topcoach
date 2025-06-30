import { Breadcrumb, Flex, Form, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { EventFormTypeEnum } from "src/app/api/Api";
import { CustomButton } from "src/components/common";
import FormMaker from "src/components/form/FormMaker";
import { ArrowRight } from "src/components/icons";
import MainTitleDescription from "src/components/mainTitleDesc";
import CountDown from "src/pages/events/_components/countdown";
import { EVENT_DEADLINE } from "src/pages/events/_components/CurrentEventSection/useCurrentEvent";
import {
  hasFileUploadFields,
  sortFormItemsFileUploadLast,
  transformFormItems,
} from "src/utils/formTransformer";
import styles from "../apply.module.scss";
import useApply from "../useApply";
import useUndergraduate from "./useUndergraduate";

export default function ApplyToEventPage() {
  const { breadcrumbItems } = useApply();
  const { i18n } = useTranslation();

  const { submitLoading, form, onComplete, undergraduateForm } =
    useUndergraduate();

  const currentLocale = i18n.language as "en" | "kk" | "ru" | "uz";
  const dynamicFormItems = undergraduateForm
    ? transformFormItems(undergraduateForm, currentLocale)
    : null;

  if (dynamicFormItems?.formItems) {
    dynamicFormItems.formItems = sortFormItemsFileUploadLast(
      dynamicFormItems.formItems
    );
  }

  const showFileUploadWarning = undergraduateForm
    ? hasFileUploadFields(undergraduateForm)
    : false;

  return (
    <main>
      <div className={"container " + styles.container}>
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
          scrollToFirstError={{ behavior: "smooth", block: "center" }}
        >
          <FormMaker formItems={dynamicFormItems?.formItems || []} />

          {showFileUploadWarning && (
            <div className={styles.fileTypeInfo}>
              <p>
                Allowed file types are Text (TXT), PDF, Word Document
                (DOC), Word Document (DOCX), Image (JPEG/JPG), Image
                (PNG), Image (GIF)
              </p>
            </div>
          )}

          <FormMaker
            formItems={dynamicFormItems?.formItemEssay || []}
          />
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
            {submitLoading && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
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
