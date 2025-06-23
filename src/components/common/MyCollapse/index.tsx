import { Flex } from 'antd';
import styles from './MyCollapse.module.scss';
import { UpArrowSvg } from 'src/assets/svg/mentor';
import { useState } from 'react';
import useColors from 'src/hooks/useColors';
import useParamsHook from 'src/hooks/params';

interface Props {
  question: string | React.ReactNode;
  answer: string | React.ReactNode;
  questionNumber: number;
}

export default function MyCollapse({
  answer,
  question,
  questionNumber,
}: Props) {
  const { searchParams } = useParamsHook();
  const [open, setOpen] = useState<boolean>(
    searchParams.get('questionNumber') === questionNumber.toString()
  );
  const colors = useColors();

  const toggleCollapse = () => {
    setOpen(!open);
  };

  return (
    <Flex
      vertical
      gap={12}
      id={'question' + questionNumber}
      style={open ? { marginBottom: 12 } : {}}
    >
      <div className={`${styles.header} `} onClick={toggleCollapse}>
        <h2>{question}</h2>
        <div className={`${styles.svg} ${open && styles.svgActive}`}>
          <UpArrowSvg color={colors.colorText} />
        </div>
      </div>
      <div className={` ${!open && styles.bodyNone} ${styles.body} `}>
        <p>{answer}</p>
      </div>
    </Flex>
  );
}
