import { message } from 'antd';
import { useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import useParamsHook from 'src/hooks/params';
import { useScreenSize } from 'src/hooks/useScreenSize';
import UniversityFilter from './_components/filter';
import UniversitySection from './_components/university';
import styles from './iniversities.module.scss';

export default function UniversitiesPage() {
  const { screenSize } = useScreenSize();
  const meRes = useTypedSelector((state) => state.auth.profile);
  const aiLimit = meRes?.aiSearchLimit;
  const { isAuthenticated, profile: meData } = useTypedSelector(
    (state) => state.auth
  );
  const { searchParams } = useParamsHook();
  const aiId = searchParams.get('aiId') || '';

  // check
  const [checked, setChecked] = useState<boolean>(!!aiId);

  const handleSwitch = (isChecked: boolean) => {
    if (aiLimit === 0) {
      setChecked(false);
      message.error(
        'You have not booked a session yet or you reached your limit.'
      );
      return;
    }
    if (isAuthenticated) {
      setChecked(isChecked);
    } else {
      setChecked(false);
      message.error('You have not registered yet.');
    }
  };

  return (
    <div className={styles.univer}>
      {screenSize > 1024 && <UniversityFilter checked={checked} />}
      <div className={'container ' + styles.universitySection}>
        <UniversitySection
          checked={checked}
          handleSwitch={handleSwitch}
          aiLimit={aiLimit}
        />
      </div>
    </div>
  );
}
