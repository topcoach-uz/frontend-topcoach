import { Breadcrumb, Flex, Form, Spin } from "antd";
import { useTranslation } from "react-i18next";
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
import { getLocalizedText } from "src/utils/translationUtils";
import styles from "../apply.module.scss";
import useApply from "../useApply";
import useUndergraduate from "./useUndergraduate";

export default function ApplyToEventPage() {
  const { breadcrumbItems, commonFormItems } = useApply();
  const { i18n, t } = useTranslation();

  const {
    submitLoading,
    form,
    onComplete,
    undergraduateForm,
    formRelatedData,
  } = useUndergraduate();

  const currentLocale = i18n.language as "en" | "kk" | "ru" | "uz";
  const dynamicFormItems = undergraduateForm
    ? transformFormItems(undergraduateForm, currentLocale, form)
    : null;

  // Concatenate static form items with dynamic additional responses
  const allFormItems = [
    ...commonFormItems,
    ...(dynamicFormItems?.formItems || []),
  ];

  // Sort all form items to put file uploads at the end
  const sortedFormItems = sortFormItemsFileUploadLast(allFormItems);

  const showFileUploadWarning = undergraduateForm
    ? hasFileUploadFields(undergraduateForm)
    : false;

  // Get dynamic title and description from API
  const eventTitle = formRelatedData?.data
    ? getLocalizedText(formRelatedData.data.title, currentLocale)
    : t("apply.undergraduate.title");
  const eventDeadline = formRelatedData?.data?.deadline
    ? new Date(formRelatedData.data.deadline).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "";
  const eventDeadlineDate = formRelatedData?.data?.deadline
    ? new Date(formRelatedData.data.deadline)
    : new Date(EVENT_DEADLINE);

  return (
    <main>
      <div className={"container " + styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <Flex justify="space-between" align="center">
          <MainTitleDescription
            title={eventTitle}
            description={`${t("apply.deadline")}: ${eventDeadline}`}
          />
          <Flex vertical align="center" gap={10}>
            <CountDown targetDate={eventDeadlineDate} />
          </Flex>
        </Flex>
        <Form
          onFinish={onComplete}
          form={form}
          layout="vertical"
          scrollToFirstError={{ behavior: "smooth", block: "center" }}
        >
          <FormMaker formItems={sortedFormItems} />

          {showFileUploadWarning && (
            <div className={styles.fileTypeInfo}>
              <p>{t("apply.fileTypeWarning")}</p>
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
              {t("apply.submit")}
            </CustomButton>
            {submitLoading && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Spin size="large" />
                <p>{t("apply.submitting")}</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </main>
  );
}
