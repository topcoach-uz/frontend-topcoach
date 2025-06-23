import { Flex } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from 'src/components/common';

export default function AuthButtonGroup() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Flex gap={16}>
      <CustomButton
        type="primary"
        width={81}
        height={44}
        onClick={() => navigate('/auth/signin')}
      >
        {t('header.login')}
      </CustomButton>
      <CustomButton
        type="default"
        height={44}
        pl={15}
        pr={15}
        onClick={() => navigate('/auth/signup')}
      >
        {t('header.signup')}
      </CustomButton>
    </Flex>
  );
}
