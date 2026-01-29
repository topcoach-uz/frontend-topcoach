import { ConfigProvider, Input, Modal, Switch } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { themeColors } from 'src/constants/theme';
import { CustomButton, CustomText } from '../common';
import { CustomButtonProps } from '../common/button';
import { FilterIcon } from '../icons';
import styles from './multiAiSeach.module.scss';
import useParamsHook from 'src/hooks/params';

const { TextArea } = Input;

interface Props {
  isDark?: boolean;
  textAreaLabel?: string;
  isInUniversityPage?: boolean;
  filterButton?: boolean;
  filterButtonProps?: CustomButtonProps;
  title?: string;
  placeholderText: string;
  setText: (text: string) => void;
}

export default function MultiAiSearchTextArea({
  isDark = false,
  isInUniversityPage = false,
  filterButton = false,
  filterButtonProps,
  title,
  placeholderText,
  setText: setParentText,
}: Props) {
  // check if user is authenticated
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  const { t } = useTranslation();

  // word count in search
  const [text, setText] = useState('');

  const handleChange = (e: any) => {
    const inputText = e.target.value;

    if (inputText.length <= 500) {
      setText(inputText);
      setParentText(inputText);
    }
  };

  const handleSubmit = () => {
    if (checked && text.trim()) {
      setText(text);
    }
  };

  // Switch state
  const [checked, setChecked] = useState<boolean>(false);

  const placeholder = checked
    ? 'E.g. I am good at math and physics. I have an IELTS 7 and 1300 SAT certificate. I love learning about technology, software engineering, and startups.'
    : t('landing.aiSearchInputPlaceholder');

  const handleSwitch = (checked: boolean) => {
    if (isAuthenticated) {
      setChecked(checked);
    } else {
      if (checked) {
        handleOpen();
      }
      setChecked(checked);
    }
  };

  // Modal

  const [open, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleClose = () => {
    if (!isAuthenticated) {
      setChecked(false);
      setOpen(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleOk = () => {
    navigate('/auth/signin');
  };

  const { handleMakeParams } = useParamsHook();

  return (
    <ConfigProvider
      theme={{
        token: isDark ? { ...themeColors.dark } : { ...themeColors.light },
        components: {
          Button: {
            defaultColor: isDark
              ? themeColors.dark.colorText
              : themeColors.light.colorText,
          },
        },
      }}
    >
      <div
        className={styles.textArea}
        style={{
          background: isDark
            ? themeColors.dark.colorBgContainer
            : themeColors.light.colorBgContainer,
        }}
      >
        <TextArea
          placeholder={placeholderText}
          autoSize={{ minRows: 4, maxRows: 6 }}
          variant="borderless"
          value={text}
          onChange={handleChange}
          className={styles.textAreaInput}
        />
        {filterButton && (
          <CustomButton
            className={styles.filterButton}
            type="primary"
            icon={<FilterIcon />}
            {...filterButtonProps}
          />
        )}
        {isInUniversityPage ? (
          ''
        ) : (
          <div className={styles.switchInside}>
            <Switch
              checked={checked}
              className={styles.switch}
              onChange={handleSwitch}
            />
            <CustomText
              fontSize={14}
              fontWeight={400}
              color={
                isDark
                  ? themeColors.dark.colorTextPlaceholder
                  : themeColors.light.colorTextPlaceholder
              }
              onClick={() => handleSwitch(true)}
            >
              {t('landing.aiSearch')}
            </CustomText>
          </div>
        )}
      </div>

      {!isInUniversityPage && (
        <CustomButton mt={16} type="primary" onClick={handleSubmit}>
          {t('landing.submit')}
        </CustomButton>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        onCancel={handleClose}
        onOk={handleOk}
        okText="Sign in"
        centered
      >
        To be able to use the AI search feature, you need to sign in.
      </Modal>
    </ConfigProvider>
  );
}
