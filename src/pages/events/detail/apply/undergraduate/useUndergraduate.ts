import { message } from "antd";
import { useForm } from "antd/es/form/Form";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "src/app/api";
import { EventFormTypeEnum, EventsSchema } from "src/app/api/Api";
import useParamsHook from "src/hooks/params";
import useApi from "src/hooks/useApi";
import { createDynamicSubmissionPayload } from "src/utils/formTransformer";

export default function useUndergraduate() {
  const [form] = useForm();
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const country = searchParams.get("country");

  const { response: formRelatedData, isLoading: eventDataLoading } =
    useApi<AxiosResponse<EventsSchema>>(() =>
      api.camps.getCurrentActiveEvent()
    );

  const undergraduateForm = formRelatedData?.data.forms.find(
    (form) => form.type === EventFormTypeEnum.Undergraduate
  );

  const onComplete = async () => {
    const values = await form.validateFields(); // Validate the fields

    let dynamicSubmissionPayload;
    if (undergraduateForm) {
      dynamicSubmissionPayload = createDynamicSubmissionPayload(
        values,
        undergraduateForm
      );
    } else {
      message.error(
        "Undergraduate form schema is not available.",
        12
      );
      setSubmitLoading(false);
      return;
    }

    // Map form values to match the CreateApplicationDto structure
    const requestPayload = {
      fullName: values.fullName,
      jshshir: values.jshshir,
      passportNumber: values.passportNumber,
      passportIssuingAuthority: values.passportIssuingAuthority,
      region: values.region,
      parentFullName: values.parentFullName,
      parentPhoneNumber: values.parentPhoneNumber,
      parentEmail: values.parentEmail,
      emergencyContact: values.emergencyContact,
      birthDate: dayjs(values.birthDate).format("YYYY-MM-DD"),
      country: country,
      essays: dynamicSubmissionPayload.essays || [],
      additionalResponses:
        dynamicSubmissionPayload.additionalResponses || [],
      isDraft: false,
      ...dynamicSubmissionPayload.fileUploads,
      // "ffecaabe-83ce-489a-994f-9d64c4be7945": values.cv?.file,
      // "f9481606-99b7-41be-9d53-6ba7e75d487b":
      //   values.languageCertificates?.file,
    };

    setSubmitLoading(true); // Start loading when the form is submitted

    // Convert requestPayload to FormData
    const formData = new FormData();

    Object.entries(requestPayload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays (e.g., essays)
        value.forEach((item) => {
          if (typeof item === "object") {
            // If the array contains objects, stringify them
            formData.append(key, JSON.stringify(item));
          } else {
            formData.append(key, item);
          }
        });
      } else {
        // Handle other fields
        formData.append(key, value as string);
      }
    });

    // Send the data to the backend
    handleSubmitEvent(formData);
  };

  // Function to submit the data to your API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitEvent = async (payload: any) => {
    setSubmitLoading(true);
    api.camps
      .apply("32a745af-f682-4e4e-bcf3-1e5927399c44", payload)
      .then((response) => {
        message.success("Form submitted successfully!");
        console.log("API response:", response);
        navigate("/events");
      })
      .catch((error) => {
        message.error(
          error?.response?.data?.message ||
            "An error occurred while submitting the form.",
          12
        );
        console.error("Error while calling the API:", error);
      })
      .finally(() => {
        setSubmitLoading(false);
      });
  };

  return {
    onComplete,
    form,
    submitLoading,
    undergraduateForm,
    eventDataLoading,
  };
}
