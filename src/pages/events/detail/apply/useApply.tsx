import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb";
import { useForm } from "antd/es/form/Form";
import { Link, useLocation } from "react-router-dom";
import { useScreenSize } from "src/hooks/useScreenSize";
import { IFormItemType } from "src/components/form/type";

export default function useApply() {
  const [form] = useForm();
  const { screenSize } = useScreenSize();

  const { pathname } = useLocation();
  const splittedPath = pathname.split("/");
  const eventId = splittedPath[splittedPath.length - 2];

  const breadcrumbItems: BreadcrumbItemType[] = [
    {
      title: <Link to="/">Home</Link>,
    },
    {
      title: <Link to="/events">Events</Link>,
    },
    {
      title: <Link to={`/events`}>Event Information</Link>,
    },
    {
      title: "Apply to Event",
    },
  ];

  const col = screenSize < 768 ? 24 : 12;

  // Common form items for both undergraduate and graduate forms
  const commonFormItems: IFormItemType[] = [
    {
      name: "fullName",
      type: "input",
      label: "Full Name",
      inputType: "text",
      message: "Please enter your full name",
      placeholder: "Your full name",
      col,
    },
    {
      name: "birthDate", // Note: Undergraduate form uses dateOfBirth, but backend expects birthDate
      type: "datePicker",
      htmlType: "date",
      label: "Date of Birth",
      message: "Please select your date of birth",
      placeholder: "Select your date of birth",
      col,
    },
    {
      name: "jshshir",
      type: "input",
      htmlType: "number",
      inputType: "text",
      label: "Passport Number",
      message: "Please enter your passport number",
      placeholder: "Your passport number",
      col,
    },
    {
      name: "passportNumber",
      type: "input",
      htmlType: "number",
      inputType: "text",
      label: "Passport ID",
      message: "Please enter your passport ID",
      placeholder: "Passport series and number (e.g., 34567)",
      col,
    },
    {
      name: "passportIssuingAuthority",
      type: "input",
      label: "Passport Issuing Authority",
      inputType: "text",
      message: "Please enter your passport issuing authority",
      placeholder:
        "Name of the issuing body (e.g., Ministry of Internal Affairs)",
      col,
    },
    {
      name: "region",
      type: "input",
      inputType: "text",
      label: "Region",
      message: "Please enter your region",
      placeholder:
        "Your region (e.g., Tashkent City, Samarkand Region)",
      col,
    },
    {
      name: "parentFullName",
      type: "input",
      inputType: "text",
      label: "Parent/Guardian Full Name",
      message: "Please enter your parent/guardian full name",
      placeholder: "Your parent's or guardian's full name",
      col,
    },
    {
      name: "parentPhoneNumber", // Updated to use consistent naming with API
      type: "input",
      inputType: "text",
      mask: "+998 (00) 000-00-00",
      label: "Parent/Guardian Phone Number",
      message: "Please enter your parent/guardian phone number",
      placeholder: "+998 (XX) XXX-XX-XX",
      col,
    },
    {
      name: "parentEmail",
      type: "input",
      inputType: "text",
      htmlType: "email",
      label: "Parent/Guardian Email (optional)",
      placeholder: "parent.email@example.com",
      col,
    },
    {
      name: "emergencyContact",
      type: "input",
      inputType: "text",
      label: "Emergency Contact Information",
      message: "Please enter your emergency contact information",
      placeholder:
        "Contact person and phone number (e.g., Uncle John +998 XX XXX XX XX)",
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
