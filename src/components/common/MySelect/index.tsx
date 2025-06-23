import { useState } from 'react';
import styles from './MySelect.module.scss';
import {
  KarakalpakFlagIcon,
  RussiaFlagIcon,
  UKFlagIcon,
  UzbekFlagIcon,
} from 'src/components/icons';
import { DefaultOptionType } from 'antd/es/select';
import { Dropdown } from 'antd';

export default function MySelect() {
  const [open, setOpen] = useState(false);
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

  return <Dropdown></Dropdown>;
}
