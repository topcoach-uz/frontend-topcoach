import { GlobalOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { themeFontSize } from 'src/constants/theme';
import CustomSelect from '../common/select';
import styles from './language_select.module.scss';
import i18n from 'src/lib/i18n';
import { DefaultOptionType } from 'antd/es/select';

type LanguageType = 'en' | 'uz' | 'ru' | 'kk';

interface Props {
  isInHeader?: boolean;
}

export default function LanguageSelect({ isInHeader = false }: Props) {
  // Language handling
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
      label: 'English',
      value: 'en',
      className: styles.languageOption,
    },
    {
      label: "O'zbek",
      value: 'uz',
      className: styles.languageOption,
    },
    {
      label: 'Русский',
      value: 'ru',
      className: styles.languageOption,
    },
    {
      label: 'Qoraqalpoq',
      value: 'kk',
      className: styles.languageOption,
    },
  ];

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
      <div className={styles.languageIconDisplay}>
        <GlobalOutlined style={{ fontSize: '20px', color: 'white' }} />
      </div>
    </div>
  );
}
