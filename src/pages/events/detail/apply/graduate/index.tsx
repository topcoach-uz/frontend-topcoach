import { Breadcrumb, Flex, Form, Spin } from "antd";
import FormMaker from "src/components/form/FormMaker";
import MainTitleDescription from "src/components/mainTitleDesc";
import styles from "./apply.module.scss";
import { CustomButton, CustomText } from "src/components/common";
import { ArrowRight } from "src/components/icons";
import useApply from "../useApply";
import CountDown from "src/pages/events/_components/countdown";
import useGraduate from "./useGraduate";
import { EVENT_DEADLINE } from "src/pages/events/_components/CurrentEventSection/useCurrentEvent";
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

export default function ApplyToEventGraduatePage() {
  const { breadcrumbItems, commonFormItems } = useApply();
  const { i18n } = useTranslation();

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

  console.log("dynamicFormItems", dynamicFormItems);

  const showFileUploadWarning = graduateForm
    ? hasFileUploadFields(graduateForm)
    : false;

  return (
    <main>
      <div className={"container " + styles.container}>
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
          scrollToFirstError={{ behavior: "smooth", block: "center" }}
        >
          <FormMaker formItems={sortedFormItems} />

          {showFileUploadWarning && (
            <div className={styles.fileTypeInfo}>
              <p>
                Allowed file types are Text (TXT), PDF, Word Document
                (DOC), Word Document (DOCX), Image (JPEG/JPG), Image
                (PNG), Image (GIF)
              </p>
            </div>
          )}

          <CustomText fontSize={24} fontWeight={600}>
            Essay Questions
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
              Submit
            </CustomButton>
            {loading && (
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
