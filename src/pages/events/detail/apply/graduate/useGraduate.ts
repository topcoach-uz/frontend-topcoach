import { message } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "src/app/api";
import { EventFormTypeEnum, EventsSchema } from "src/app/api/Api";
import { AxiosResponse } from "axios";
import useParamsHook from "src/hooks/params";
import useApi from "src/hooks/useApi";
import { createDynamicSubmissionPayload } from "src/utils/formTransformer";

export default function useGraduate() {
  const [form] = useForm();
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const country = searchParams.get("country");

  const { response: formRelatedData } = useApi<
    AxiosResponse<EventsSchema>
  >(() => api.camps.getCurrentActiveEvent());

  const graduateForm = formRelatedData?.data.forms.find(
    (form) => form.type === EventFormTypeEnum.Postgraduate
  );

  // Function to handle form submission
  const onComplete = async () => {
    const values = await form.validateFields(); // Validate the fields

    let dynamicSubmissionPayload;
    if (graduateForm) {
      dynamicSubmissionPayload = createDynamicSubmissionPayload(
        values,
        graduateForm
      );
    } else {
      message.error("Graduate form schema is not available.", 12);
      setLoading(false);
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
      country,
      essays: dynamicSubmissionPayload.essays || [],
      additionalResponses:
        dynamicSubmissionPayload.additionalResponses || [],
      isDraft: false,
      ...dynamicSubmissionPayload.fileUploads,
    };

    setLoading(true);

    // Convert requestPayload to FormData like in undergraduate
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
    setLoading(true);

    api.camps
      .apply("1c913324-e908-4fab-b704-c5d9158e8466", payload)
      .then((res) => {
        console.log("Form submitted successfully:", res);
        message.success("Form submitted successfully!");
        navigate("/events"); // Re
      })
      .catch((error) => {
        message.error(error?.response?.data?.message, 12);
      })
      .finally(() => {
        setLoading(false); // Stop loading once the request is completed
      });
    // Handle success or further processing here (e.g., success message, redirect, etc.)
  };

  return { onComplete, loading, form };
}
