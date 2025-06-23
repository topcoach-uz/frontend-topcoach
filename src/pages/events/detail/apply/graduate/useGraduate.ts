import { message } from 'antd';
import { useForm } from 'antd/es/form/Form';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import useParamsHook from 'src/hooks/params';

export default function useGraduate() {
  const [form] = useForm();
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const country = searchParams.get('country');

  // Function to handle form submission
  const onComplete = async () => {
    const values = await form.validateFields(); // Validate the fields

    const allEssays = [
      {
        essayId: 'd50ab423-19bf-4306-bd5f-b4bc5203aceb',
        content: values.essay1,
      },
      {
        essayId: '548943d0-2e6d-4836-8f62-983e3f1e8462',
        content: values.essay2,
      },
      {
        essayId: '1c1e524d-dfd8-4d8f-b6d0-8f4d298ed7fd',
        content: values.essay3,
      },
      {
        essayId: 'e241a21f-1bd6-48e5-a683-b53f07b3711f',
        content: values.essay4,
      },
    ];

    const additionalResponses = [
      // {
      //   id: '8522b32f-d496-46cf-a0c7-14a72b27d3ce',
      //   response: values.academicTranscript,
      // },
      // { id: 'c7487a57-e3f9-4524-a670-f74a6142bb3b', response: values.cv },
      {
        id: '24564bfa-10e2-499a-8be5-382af7291775',
        response: values.attendedTop100UniCamp,
      },
      {
        id: 'ebe2baed-30b0-4a0c-b55b-cd9590baf0f8',
        response: values.standardized,
      },
      {
        id: 'a59ddcca-2395-4a98-960b-a5525b4287a4',
        response: values.currentYearOfStudy,
      },
      {
        id: '1cd46fd5-e94e-4081-bc74-6e3f80824cb0',
        response: values.fieldOfStudy,
      },
      {
        id: '493f0d9a-baa2-49c8-be1a-0ee6ca0351a0',
        response: values.university,
      },
    ];

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
      '8522b32f-d496-46cf-a0c7-14a72b27d3ce': values.academicTranscript?.file,
      'c7487a57-e3f9-4524-a670-f74a6142bb3b': values.cv?.file,
      birthDate: dayjs(values.birthDate).format('YYYY-MM-DD'),
      additionalResponses: additionalResponses || [],
      essays: allEssays || [],
      isDraft: false,
      country,
    };

    // Send the data to the backend
    handleSubmitEvent(requestPayload);
  };

  // Function to submit the data to your API
  const handleSubmitEvent = async (payload: any) => {
    setLoading(true);

    api.camps
      .apply('1c913324-e908-4fab-b704-c5d9158e8466', payload)
      .then((res) => {
        console.log('Form submitted successfully:', res);
        message.success('Form submitted successfully!');
        navigate('/events'); // Re
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
