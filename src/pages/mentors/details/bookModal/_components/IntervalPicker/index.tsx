import { Flex } from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';
import { api } from 'src/app/api';
import { IBaseOption } from 'src/app/type';
import useApi from 'src/hooks/useApi';
import styles from './interval_picker.module.scss';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

interface Props {
  intervals: IIntervals[];
  chosenInterval: IBaseOption;
  handleIntervalChange: (interval: IBaseOption) => void;
}

interface IIntervals {
  label: string;
  value: string;
}

export default function IntervalPicker({
  intervals,
  chosenInterval,
  handleIntervalChange,
}: Props) {
  const colors = useColors();

  return (
    <Flex vertical gap={4} className={styles.interval_picker_wrapper}>
      <CustomText
        fontWeight={themeFontWeight.fontWeightMedium}
        color={colors.colorTextSecondary}
        fontSize={themeFontSize.fontSizeTitle9}
      >
        Select a Time Slot
      </CustomText>
      {intervals.map((inter) => (
        <div
          key={inter.value}
          className={`${styles.item} ${chosenInterval?.value === inter.value ? styles.active : ''}`}
          onClick={() =>
            handleIntervalChange({ value: inter.value, label: inter.label })
          }
        >
          {inter.label}
        </div>
      ))}
    </Flex>
  );
}
