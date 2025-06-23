import { message } from 'antd';
import { useForm } from 'antd/es/form/Form';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import useParamsHook from 'src/hooks/params';
import useApi from 'src/hooks/useApi';

export default function useUndergraduate() {
  const [form] = useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { searchParams } = useParamsHook();
  const country = searchParams.get('country'); // Default to 'United States' if not provided
  // const { data: camps } = useApi(() =>
  //   api.camps.campsList({
  //     _start: 0,
  //     _end: 5,
  //     _sort: 'startDate',
  //     _order: 'DESC',

  //   })
  // );

  // console.log('camps', camps);

  // Function to handle form submission
  const onComplete = async () => {
    const values = await form.validateFields(); // Validate the fields

    const allEssays = [
      {
        essayId: '6e5330f7-aec0-40b1-87e0-d26200f6e346',
        content: values.essay1,
      },
      {
        essayId: '2e899237-3c67-4d05-b6f8-903ef6581190',
        content: values.essay2,
      },
      {
        essayId: 'a7c0304b-4f4f-4dfa-bd25-49b903f900bc',
        content: values.essay3,
      },
      {
        essayId: '0e232198-f438-43dd-9e2a-e2062a247249',
        content: values.essay4,
      },
      {
        essayId: '872e22a9-de7e-4982-a006-adb4098d9c0c',
        content: values.essay5,
      },
    ];

    const additionalResponses = [
      {
        id: 'bbe7ada5-9c59-434e-bf3e-35c311af6b8d',
        response: values.school,
      },
      {
        id: '73379c5c-9962-421d-9e94-0781201e2ef2',
        response: values.standardizedTestScores,
      },
      {
        id: '098e362a-bd02-4bba-a406-f1de93b965f7',
        response: values.attendedTopUniCamp,
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
      parentPhoneNumber: values.parentPhone,
      parentEmail: values.parentEmail,
      emergencyContact: values.emergencyContact,
      birthDate: dayjs(values.birthDate).format('YYYY-MM-DD'),
      essays: allEssays || [],
      additionalResponses: additionalResponses || [],
      'ffecaabe-83ce-489a-994f-9d64c4be7945': values.cv?.file,
      'f9481606-99b7-41be-9d53-6ba7e75d487b': values.languageCertificates?.file,
      isDraft: false,
      country: country,
    };

    setLoading(true); // Start loading when the form is submitted

    // Convert requestPayload to FormData
    const formData = new FormData();

    Object.entries(requestPayload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays (e.g., essays)
        value.forEach((item, index) => {
          if (typeof item === 'object') {
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
  const handleSubmitEvent = async (payload: any) => {
    setLoading(true);
    api.camps
      .apply('32a745af-f682-4e4e-bcf3-1e5927399c44', payload)
      .then((response) => {
        message.success('Form submitted successfully!');
        console.log('API response:', response);
        navigate('/events');
      })
      .catch((error) => {
        message.error(
          error?.response?.data?.message ||
            'An error occurred while submitting the form.',
          12
        );
        console.error('Error while calling the API:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return { onComplete, form, loading };
}
