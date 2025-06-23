import { ConfigProvider, Input, Modal, Switch } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { themeColors } from 'src/constants/theme';
import useParamsHook from 'src/hooks/params';
import { CustomButton, CustomText } from '../common';
import { CustomButtonProps } from '../common/button';
import { FilterIcon } from '../icons';
import styles from './aisearch.module.scss';

const { TextArea } = Input;

interface Props {
  isDark?: boolean;
  textAreaLabel?: string;
  isInUniversityPage?: boolean;
  filterButton?: boolean;
  filterButtonProps?: CustomButtonProps;
  universityName?: string; // Receive universityName prop
  setUniversityName: (value: string) => void;
  setSearchText: (value: string) => void;
}

export default function AiSearchTextArea({
  isDark = false,
  isInUniversityPage = false,
  filterButton = false,
  filterButtonProps,
  setUniversityName,
  setSearchText,
}: Props) {
  // check if user is authenticated
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );
  const { t } = useTranslation();
  const { handleMakeParams, searchParams } = useParamsHook();

  const handleSubmit = () => {
    if (text.trim()) {
      setSearchText(text);
      handleMakeParams('name', text.trim());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUniversityName(e.target.value);
    if (e.target.value === '') {
      handleMakeParams('name', '');
    } // Update state when the input changes

    const inputText = e.target.value;

    if (inputText.length <= 500) {
      setText(inputText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter key is pressed without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline insertion
      handleSubmit(); // Call the submit function
    }
  };

  // word count in search
  const [text, setText] = useState('');

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
          allowClear
          placeholder={placeholder}
          autoSize={{ minRows: 4, maxRows: 6 }}
          variant="borderless"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={text.length > 0 ? text : searchParams.get('name')?.toString()}
          className={styles.textAreaInput}
        />
        {filterButton && (
          <CustomButton
            className={styles.filterButton}
            type="primary"
            icon={<FilterIcon />}
            onClick={() => handleSubmit()}
            {...filterButtonProps}
          />
        )}
        {!isInUniversityPage && (
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
      {/* {isInUniversityPage && (
        <CustomButton mt={16} type="primary" onClick={handleSubmit}>
          {t('landing.submit')}
        </CustomButton>
      )} */}
      <Modal
        open={open}
        onClose={handleClose}
        onCancel={handleClose}
        onOk={handleOk}
        okText={t('btn.signIn')}
        cancelText={t('btn.cancel')}
        // footer={null}
        centered
      >
        {t('landing.signInMessage')}
      </Modal>
    </ConfigProvider>
  );
}
