import { CustomCollapse } from 'src/components/common';
import CustomSelect from 'src/components/common/select';
import styles from './uniFilter.module.scss';
import useUniversityFilter from './useUniversityFilter';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { useTranslation } from 'react-i18next';

interface Props {
  checked?: boolean;
}

export default function UniversityFilter({ checked }: Props) {
  const {
    degreeOptions,
    majorOptions,
    items,
    handleChangeSelectMajor,
    handleChangeSelectDegree,
    onChangeCollaps,
    searchParams,
  } = useUniversityFilter({ checked });
  const { screenSize } = useScreenSize();
  const { t } = useTranslation();

  return (
    <aside className={styles.aside}>
      <div className={styles.filter}>
        {screenSize > 1024 && (
          <div className={styles.heading}>
            <div className={styles.eyebrow}>{t('universities.filterEyebrow', 'Filters')}</div>
            <h2 className={styles.title}>{t('universities.filterTitle')}</h2>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>
            {t('universities.degree')}
          </label>
          <CustomSelect
            allowClear
            placeholder={t('universities.degreePlaceholder')}
            onChange={handleChangeSelectDegree}
            style={{ width: '100%' }}
            options={degreeOptions}
            value={searchParams.get('degree')}
            disabled={checked === true ? true : false}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>
            {t('universities.major')}
          </label>
          <CustomSelect
            allowClear
            mode="multiple"
            placeholder={t('universities.majorPlaceholder')}
            onChange={handleChangeSelectMajor}
            style={{ width: '100%' }}
            optionFilterProp="label"
            options={majorOptions}
            disabled={checked === true ? true : false}
            value={
              searchParams.get('major')
                ? searchParams.get('major')?.split(',')
                : []
            }
          />
        </div>

        <CustomCollapse
          headerPadding="8px 0"
          contentPadding="0 0 6px 0"
          items={items}
          expandIconPosition="end"
          style={{ width: '100%' }}
          bordered={false}
          defaultActiveKey={['1', '2', '3']}
          onChange={onChangeCollaps}
        />
      </div>
    </aside>
  );
}
