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
          <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UKFlagIcon />
          </div>
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
          <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UzbekFlagIcon />
          </div>
          O'zbek
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
          <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RussiaFlagIcon />
          </div>
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
          <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KarakalpakFlagIcon />
          </div>
          Qoraqalpoq
        </div>
      ),
      value: 'kk',
      className: styles.languageOption,
    },
  ];

  // Get the current flag icon based on selected language
  const getCurrentFlagIcon = () => {
    switch (language) {
      case 'en':
        return <UKFlagIcon />;
      case 'uz':
        return <UzbekFlagIcon />;
      case 'ru':
        return <RussiaFlagIcon />;
      case 'kk':
        return <KarakalpakFlagIcon />;
      default:
        return <UKFlagIcon />;
    }
  };

  // return <MySelect />;

  return (
    <div className={`language-select-wrapper ${styles.languageSelectContainer}`}>
      <CustomSelect
        value={language}
        style={{ width: 40, minWidth: 40 }}
        onChange={handleLanguageChange}
        options={languageOptions}
        variant="borderless"
        fontSize={themeFontSize.fontSizeTitle8}
        className={'languageSelect ' + styles.languageSelect}
        suffixIcon={null}
        dropdownStyle={{ minWidth: 120 }}
      />
      <div className={styles.flagIconDisplay}>
        {getCurrentFlagIcon()}
      </div>
    </div>
  );
}
