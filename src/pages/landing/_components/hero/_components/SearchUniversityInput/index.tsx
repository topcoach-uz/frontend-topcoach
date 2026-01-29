import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import CustomSelect from 'src/components/common/select';
import { SearchIcon } from 'src/components/icons';
import useApi from 'src/hooks/useApi';
import styles from './SearchUniversityInput.module.scss';

export default function SearchUniversityInput() {
  const { response } = useApi(api.university.getUnivsList);

  const selectOntions = response?.data?.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    navigate(`universities/${value}`);
  };

  return (
    <div className={styles.selectWrapper}>
      <CustomSelect
        className={styles.select}
        // @ts-ignore
        options={selectOntions}
        height={48}
        placeholder={t('landing.uniSeach')}
        suffixIcon={<SearchIcon />}
        optionFilterProp="label"
        showSearch
        onChange={handleChange}
      />
    </div>
  );
}
