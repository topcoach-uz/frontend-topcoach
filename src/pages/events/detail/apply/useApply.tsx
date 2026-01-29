import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb";
import { useForm } from "antd/es/form/Form";
import { Link, useLocation } from "react-router-dom";
import { useScreenSize } from "src/hooks/useScreenSize";
import { IFormItemType } from "src/components/form/type";
import { useTranslation } from "react-i18next";

export default function useApply() {
  const [form] = useForm();
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  const { pathname } = useLocation();
  const splittedPath = pathname.split("/");
  const eventId = splittedPath[splittedPath.length - 2];

  const breadcrumbItems: BreadcrumbItemType[] = [
    {
      title: <Link to="/">{t("apply.breadcrumb.home")}</Link>,
    },
    {
      title: <Link to="/events">{t("apply.breadcrumb.events")}</Link>,
    },
    {
      title: (
        <Link to={`/events`}>{t("apply.breadcrumb.eventInfo")}</Link>
      ),
    },
    {
      title: t("apply.breadcrumb.applyToEvent"),
    },
  ];

  const col = screenSize < 768 ? 24 : 12;

  // Common form items for both undergraduate and graduate forms
  const commonFormItems: IFormItemType[] = [
    {
      name: "fullName",
      type: "input",
      label: t("apply.form.fullName"),
      inputType: "text",
      message: t("apply.form.fullNameMessage"),
      placeholder: t("apply.form.fullNamePlaceholder"),
      col,
    },
    {
      name: "birthDate", // Note: Undergraduate form uses dateOfBirth, but backend expects birthDate
      type: "datePicker",
      htmlType: "date",
      label: t("apply.form.dateOfBirth"),
      message: t("apply.form.dateOfBirthMessage"),
      placeholder: t("apply.form.dateOfBirthPlaceholder"),
      col,
    },
    {
      name: "jshshir",
      type: "input",
      htmlType: "number",
      inputType: "text",
      label: t("apply.form.passportNumber"),
      message: t("apply.form.passportNumberMessage"),
      placeholder: t("apply.form.passportNumberPlaceholder"),
      col,
    },
    {
      name: "passportNumber",
      type: "input",
      htmlType: "number",
      inputType: "text",
      label: t("apply.form.passportId"),
      message: t("apply.form.passportIdMessage"),
      placeholder: t("apply.form.passportIdPlaceholder"),
      col,
    },
    {
      name: "passportIssuingAuthority",
      type: "input",
      label: t("apply.form.passportIssuingAuthority"),
      inputType: "text",
      message: t("apply.form.passportIssuingAuthorityMessage"),
      placeholder: t(
        "apply.form.passportIssuingAuthorityPlaceholder"
      ),
      col,
    },
    {
      name: "region",
      type: "input",
      inputType: "text",
      label: t("apply.form.region"),
      message: t("apply.form.regionMessage"),
      placeholder: t("apply.form.regionPlaceholder"),
      col,
    },
    {
      name: "parentFullName",
      type: "input",
      inputType: "text",
      label: t("apply.form.parentFullName"),
      message: t("apply.form.parentFullNameMessage"),
      placeholder: t("apply.form.parentFullNamePlaceholder"),
      col,
    },
    {
      name: "parentPhoneNumber", // Updated to use consistent naming with API
      type: "input",
      inputType: "text",
      mask: "+998 (00) 000-00-00",
      label: t("apply.form.parentPhoneNumber"),
      message: t("apply.form.parentPhoneNumberMessage"),
      placeholder: t("apply.form.parentPhoneNumberPlaceholder"),
      col,
    },
    {
      name: "parentEmail",
      type: "input",
      inputType: "text",
      htmlType: "email",
      label: t("apply.form.parentEmail"),
      placeholder: t("apply.form.parentEmailPlaceholder"),
      col,
    },
    {
      name: "emergencyContact",
      type: "input",
      inputType: "text",
      label: t("apply.form.emergencyContact"),
      message: t("apply.form.emergencyContactMessage"),
      placeholder: t("apply.form.emergencyContactPlaceholder"),
      col,
    },
  ];

  return {
    form,
    commonFormItems,
    breadcrumbItems,
    eventId,
  };
}
