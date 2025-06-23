import { Steps } from 'antd';
import { FormInstance } from 'antd/lib';
import { Link } from 'react-router-dom';
import AlreadyHaveAccount from 'src/components/AlreadyHaveAccount';
import { Logo } from 'src/components/logos';
import useColors from 'src/hooks/useColors';
import AcademicInfo from '../_components/academicInfo';
import Background from '../_components/background';
import { FormButtonsProps } from '../_components/buttons';
import DetailedInfo from '../_components/detailedInfo';
import PersonalInfo from '../_components/personalInfo';
import Support from '../_components/support';
import styles from './mentor.module.scss';
import useMentorSignup from './useMentorSignup';

export interface MentorRegistrationFormProps {
  form: FormInstance;
  formButtonsProps: FormButtonsProps;
  checkEmail?: string;
}

export default function MentorRegistration() {
  const {
    Step,
    current,
    form,
    onChange,
    onComplete,
    onNext,
    onPrev,
    loading,
    formError,
  } = useMentorSignup();

  return (
    <div>
      <Steps
        progressDot={CustomProgressDot}
        onChange={onChange}
        current={current}
        direction="horizontal"
        responsive={false}
      >
        <Step className={styles.individual_step} />
        <Step className={styles.individual_step} />
        <Step className={styles.individual_step} />
        <Step className={styles.individual_step} />
        <Step className={styles.individual_step} />
      </Steps>

      <Link to="/">
        <Logo className={styles.logo} />
      </Link>
      {current === 0 ? (
        <PersonalInfo
          form={form}
          formButtonsProps={{ current, onNext, onPrev, onComplete }}
        />
      ) : current === 1 ? (
        <DetailedInfo
          form={form}
          formButtonsProps={{ current, onNext, onPrev, onComplete }}
          formError={formError}
        />
      ) : current === 2 ? (
        <AcademicInfo
          form={form}
          formButtonsProps={{ current, onNext, onPrev, onComplete }}
        />
      ) : current === 3 ? (
        <Support
          form={form}
          formButtonsProps={{ current, onNext, onPrev, onComplete }}
        />
      ) : current === 4 ? (
        <Background
          form={form}
          formButtonsProps={{ current, onNext, onPrev, onComplete, loading }}
        />
      ) : (
        ''
      )}
      <AlreadyHaveAccount />
    </div>
  );
}

const CustomProgressDot = (dot: any, { status }: any) => {
  const colors = useColors();
  return (
    <div
      style={{
        width: '62px',
        height: '4px',
        backgroundColor:
          status === 'process' || status === 'finish'
            ? colors.colorPrimary
            : colors.colorBorder,
        borderRadius: '2px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    ></div>
  );
};
