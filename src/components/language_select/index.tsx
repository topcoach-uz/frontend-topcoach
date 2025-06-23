import { DownOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { themeFontSize } from 'src/constants/theme';
import CustomSelect from '../common/select';
import {
  KarakalpakFlagIcon,
  RussiaFlagIcon,
  UKFlagIcon,
  UzbekFlagIcon,
} from '../icons';
import styles from './language_select.module.scss';
import i18n from 'src/lib/i18n';
import { DefaultOptionType } from 'antd/es/select';
import MySelect from '../common/MySelect';

type LanguageType = 'en' | 'uz' | 'ru' | 'kk';

interface Props {
  isInHeader?: boolean;
}

export default function LanguageSelect({ isInHeader = false }: Props) {
  // Language handling

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageType>(
    (localStorage.getItem('i18nextLng') as LanguageType) || 'en'
  );
  const handleLanguageChange = (language: LanguageType) => {
    setLanguage(language);
    i18n.changeLanguage(language);
    window.location.reload();
  };

  const languageOptions: DefaultOptionType[] = [
    {
      label: (
        <div
          className={'languageOptionWrapper ' + styles.language_option_wrapper}
        >
          <UKFlagIcon />
          English
        </div>
      ),
      value: 'en',
      className: styles.languageOption,
    },
    {
      label: (
        <div
          className={'languageOptionWrapper ' + styles.language_option_wrapper}
        >
          <UzbekFlagIcon />
          O‘zbekcha
        </div>
      ),
      value: 'uz',
      className: styles.languageOption,
    },
    {
      label: (
        <div
          className={'languageOptionWrapper ' + styles.language_option_wrapper}
        >
          <RussiaFlagIcon />
          Русский
        </div>
      ),
      value: 'ru',
      className: styles.languageOption,
    },
    {
      label: (
        <div
          className={'languageOptionWrapper ' + styles.language_option_wrapper}
        >
          <KarakalpakFlagIcon />
          Qoraqalpoq
        </div>
      ),
      value: 'kk',
      className: styles.languageOption,
    },
  ];

  // return <MySelect />;

  return (
    <CustomSelect
      value={language}
      style={{ width: language === 'kk' ? 170 : 155 }}
      onChange={handleLanguageChange}
      options={languageOptions}
      variant="borderless"
      fontSize={themeFontSize.fontSizeTitle8}
      className={'languageSelect ' + styles.languageSelect}
      suffixIcon={
        <DownOutlined className={styles.icon} onClick={() => setOpen(true)} />
      }
    />
  );
}
