import { message, Steps } from 'antd';
import { useForm, useWatch } from 'antd/es/form/Form';
import { UploadFile } from 'antd/lib';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { RegisterMentorEmailDto, UserRole } from 'src/app/api/Api';
import { useInvalidateGetMeMutation } from 'src/app/services/users';
import {
  setProfile,
  setProfileImage,
  updateProfile,
} from 'src/app/slices/authSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import useParamsHook from 'src/hooks/params';

export default function useMentorSignup() {
  const { handleMakeParams, searchParams } = useParamsHook();
  const [inputData, setInputData] = useState<RegisterMentorEmailDto>();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<number>(
    Number(searchParams.get('step')) ?? 0
  );
  const [form] = useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile: userData, isAuthenticated } = useTypedSelector(
    (state) => state.auth
  );
  const fileList = useWatch('avatar', form) as UploadFile[];
  const [invalidateGetMe] = useInvalidateGetMeMutation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    setCurrent(Number(searchParams.get('step')));
  }, [searchParams]);

  const onNext = async () => {
    const emailCheckResult = await handleEmailCheck()
      .then(() => true)
      .catch((err) => {
        const error =
          'email must be an email' == err ? 'Please, enter a valid email' : err;
        form.setFields([
          {
            name: 'email',
            errors: [error],
          },
        ]);
        return false;
      });

    if (!emailCheckResult) return;

    const values = await form.validateFields(); // Validate form fields first
    if (current == 1 && fileList.length == 0) {
      setFormError('Please upload your profile image!');
      return;
    }
    setInputData((prev) => ({ ...prev, ...values }));
    handleMakeParams('step', String(current + 1));
  };

  const onPrev = () => {
    handleMakeParams('step', String(current - 1));
  };

  const handleEmailCheck = async () => {
    if (current !== 0) return Promise.resolve();

    try {
      const email = form.getFieldValue('email'); // Get email from form

      const response = await api.users.checkEmail({
        email,
      }); // Call API with email

      // @ts-ignore
      if (response.data?.emailExists) {
        return Promise.reject('User with this E-mail already exists');
      }

      return Promise.resolve(); // Email exists, continue
    } catch (error) {
      // @ts-ignore
      return Promise.reject(error?.response?.data?.message);
    }
  };

  const onComplete = async () => {
    try {
      const values = await form.validateFields(); // Validate form fields first
      setInputData((prev) => ({ ...prev, ...values }));
    } catch (error) {
      console.error('Error:', error);
    }
    form
      .validateFields()
      .then((values) => {
        handleRegister({ ...inputData, ...values });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const { Step } = Steps;

  const onChange = (value: number) => {
    handleMakeParams('step', value.toString());
  };

  // Registration
  const handleRegister = (val: any) => {
    const university = val.customUniversity
      ? { university: val.university?.trim() }
      : undefined;

    const selectedUniversities = val.customUniversity
      ? undefined
      : [val.selectedUniversities];

    const selectedUniversitiesForUpdate = val.customUniversity
      ? undefined
      : [{ id: val.selectedUniversities }];

    // @ts-ignore
    const fileList = inputData?.avatar as UploadFile[];

    if (!isAuthenticated) {
      // When the user is registering by email:
      const values = {
        email: val.email?.trim(),
        name: val.name?.trim(),
        password: val.password,
        socials: {
          linkedin: val.socials?.trim(),
        },
        mentorProfile: {
          major: val.major?.trim(),
          languages: val.languages,
          universityEndDate: dayjs(val.university_end_date).format('YYYY-MM'),
          universityStartDate: dayjs(val.university_start_date).format(
            'YYYY-MM'
          ),
          background: val.background?.trim(),
          mentorshipValue: val.mentorshipValue?.trim(),
          mentoringExperience: val.mentoringExperience?.trim(),
          ...university,
        },
        selectedUniversities,
      };

      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value)); // Stringify the objects
        } else {
          formData.append(key, value);
        }
      }
      if (fileList?.[0]?.originFileObj) {
        if (fileList?.[0]?.originFileObj) {
          formData.append('image', fileList[0].originFileObj); // Append the image file
        } else {
          message.error('Avatar file is missing or not correctly formatted');
        }
      } else {
        message.error('Avatar file is missing or not correctly formatted');
      }

      setLoading(true);
      api.auth
        .registerMentorByEmail(formData as any)
        .then((res) => {
          navigate(`/auth/verification?email=${val.email.trim()}`);
        })
        .catch((err) => {
          if (typeof err.response.data.message == 'string') {
            message.error(err.response.data.message);
          } else if (Array.isArray(err.response.data.message)) {
            err.response.data.message.forEach((error: string) => {
              message.error(error, 10);
            });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // ! When registering with google, or the user is trying to complete their profile:

      const formData = new FormData();
      if (fileList?.[0]?.originFileObj) {
        formData.append('profileImage', fileList?.[0]?.originFileObj); // Append the image file
      }
      setLoading(true);
      Promise.allSettled([
        api.users.updateProfileImage(formData as any).catch((err) => {
          if (Array.isArray(err.response.data.message)) {
            err.response.data.message.forEach((error: string) => {
              message.error(error, 10);
            });
          } else {
            message.error(err.response.data.message);
          }
        }),
        dispatch(
          updateProfile({
            // @ts-ignore
            mentorProfile: {
              major: val.major?.trim(),
              languages: val.languages,
              universityEndDate: dayjs(val.university_end_date).format(
                'YYYY-MM'
              ),
              universityStartDate: dayjs(val.university_start_date).format(
                'YYYY-MM'
              ),
              background: val.background?.trim(),
              mentorshipValue: val.mentorshipValue?.trim(),
              mentoringExperience: val.mentoringExperience?.trim(),
              ...university,
            },
            // Just giving the id itself
            // @ts-ignore
            selectedUniversities: selectedUniversitiesForUpdate,
            // @ts-ignore
            profile: {
              name: val.name?.trim(),
              profileComplete: true,
              role: UserRole.Mentor,
              contacts: {
                // @ts-ignore
                socials: {
                  linkedin: val.socials?.trim(),
                },
              },
            },
          })
        ),
      ])
        .then((results) => {
          let rejected = false;
          let errors: string[] = [];

          results.forEach((result) => {
            // @ts-ignore
            if (result?.value?.error?.message == 'Rejected') {
              rejected = true;
              // @ts-ignore
              errors.push(result?.value?.payload.message);
            }
            // @ts-ignore
            if (!result?.value) {
              rejected = true;
            }
          });

          if (!rejected) {
            navigate('/'); // Proceed only if all promises are resolved successfully
            dispatch(
              // @ts-ignore
              setProfileImage(results[0]?.value?.data?.media?.url)
            );
          } else {
            // Handle the case where one or more promises failed
            // You might want to show an error message to the user here
            errors.forEach((error) => {
              message.error(error, 10);
            });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return {
    onNext,
    onPrev,
    onComplete,
    Step,
    onChange,
    form,
    current,
    loading,
    formError,
  };
}
