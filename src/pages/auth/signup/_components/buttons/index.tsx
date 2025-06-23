import { Form } from 'antd';
import { CustomButton } from 'src/components/common';
import styles from './form_buttons.module.scss';
import { useTypedSelector } from 'src/app/store';
import { useTranslation } from 'react-i18next';

export interface FormButtonsProps {
  current?: number;
  checkEmail?: string;
  onNext?: () => void;
  onPrev?: () => void;
  onComplete?: () => void;
  loading?: boolean;
}

export default function FormButtons({
  current,
  onPrev,
  onNext,
  onComplete,
  loading = false,
}: FormButtonsProps) {
  const { profile: userData, isAuthenticated } = useTypedSelector(
    (state) => state.auth
  );
  const { t } = useTranslation();
  return (
    <div className={styles.buttons}>
      {current === 0 ? (
        ''
      ) : current === 1 && isAuthenticated ? (
        <CustomButton onClick={onPrev} type="primary" height={46} disabled>
          {t('btn.previous')}
        </CustomButton>
      ) : (
        <CustomButton onClick={onPrev} type="primary" height={46}>
          {t('btn.previous')}
        </CustomButton>
      )}
      <Form.Item style={current === 0 ? { width: '100%' } : {}}>
        {current === 4 ? (
          <CustomButton
            onClick={onComplete}
            type="primary"
            height={46}
            htmlType="submit"
            loading={loading}
          >
            {t('signUp.completeButton')}
          </CustomButton>
        ) : (
          <CustomButton
            onClick={onNext}
            type="primary"
            height={46}
            htmlType="submit"
            width="100%"
          >
            {t('btn.continue')}
          </CustomButton>
        )}
      </Form.Item>
    </div>
  );
}
