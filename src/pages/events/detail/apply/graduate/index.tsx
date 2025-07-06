import { Breadcrumb, Flex, Form, Spin } from "antd";
import FormMaker from "src/components/form/FormMaker";
import MainTitleDescription from "src/components/mainTitleDesc";
import styles from "./apply.module.scss";
import { CustomButton, CustomText } from "src/components/common";
import { ArrowRight } from "src/components/icons";
import useApply from "../useApply";
import CountDown from "src/pages/events/_components/countdown";
import useGraduate from "./useGraduate";
import useApi from "src/hooks/useApi";
import { api } from "src/app/api";
import { EventFormTypeEnum, EventsSchema } from "src/app/api/Api";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import {
  transformFormItems,
  hasFileUploadFields,
  sortFormItemsFileUploadLast,
} from "src/utils/formTransformer";
import { getLocalizedText } from "src/utils/translationUtils";
import ApplicationClosed from "../../_components/application-closed";

export default function ApplyToEventGraduatePage() {
  const { breadcrumbItems, commonFormItems } = useApply();
  const { i18n, t } = useTranslation();

  const { onComplete, form, loading } = useGraduate();

  const { response: graduateData } = useApi<
    AxiosResponse<EventsSchema>
  >(() => api.camps.getCurrentActiveEvent());

  const graduateForm = graduateData?.data.forms.find(
    (form) => form.type === EventFormTypeEnum.Postgraduate
  );

  const currentLocale = i18n.language as "en" | "kk" | "ru" | "uz";
  const dynamicFormItems = graduateForm
    ? transformFormItems(graduateForm, currentLocale, form)
    : null;

  // Concatenate static form items with dynamic additional responses
  const allFormItems = [
    ...commonFormItems,
    ...(dynamicFormItems?.formItems || []),
  ];

  // Sort all form items to put file uploads at the end
  const sortedFormItems = sortFormItemsFileUploadLast(allFormItems);

  const showFileUploadWarning = graduateForm
    ? hasFileUploadFields(graduateForm)
    : false;

  // Get dynamic title and description from API
  const eventTitle = graduateData?.data
    ? getLocalizedText(graduateData.data.title, currentLocale)
    : t("apply.graduate.title");
  const eventDeadline = graduateData?.data?.deadline
    ? new Date(graduateData.data.deadline).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "";

  const eventDeadlineDate = graduateData?.data?.deadline
    ? new Date(graduateData.data.deadline)
    : null;

  // Check if deadline has passed
  const isDeadlinePassed = eventDeadlineDate
    ? eventDeadlineDate < new Date()
    : true;

  // If deadline has passed, show ApplicationClosed component
  if (isDeadlinePassed) {
    return <ApplicationClosed breadcrumbItems={breadcrumbItems} />;
  }

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
            {eventDeadlineDate && (
              <CountDown targetDate={eventDeadlineDate} />
            )}
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

          <CustomText fontSize={24} fontWeight={600}>
            {t("apply.essayQuestions")}
          </CustomText>
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
            {loading && (
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
