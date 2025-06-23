import { Button } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { CloseCircleIcon, TickIcon } from 'src/components/icons';
import { themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './CheckListItem.module.scss';

export interface CheckListProps {
  stepName: string;
  isComplete: boolean;
  buttonText: string;
  onClick: () => void;
}

const CheckListItem = ({
  isComplete,
  stepName,
  buttonText,
  onClick,
}: CheckListProps) => {
  const colors = useColors();

  return (
    <li className={styles.checkListItem} key={stepName}>
      <div>
        <span>{isComplete ? <TickIcon /> : <CloseCircleIcon />}</span>
        <CustomText
          color={colors.colorText}
          fontSize={12}
          fontWeight={themeFontWeight.fontWeightMedium}
        >
          {stepName}
        </CustomText>
      </div>
      {!isComplete && (
        <Button onClick={onClick} className={styles.completeButton} type="link">
          {buttonText}
        </Button>
      )}
    </li>
  );
};

export default CheckListItem;
