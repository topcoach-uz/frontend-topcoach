import { CustomCollapse, CustomText } from 'src/components/common';
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
    colors,
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
          <CustomText
            fontSize={20}
            fontWeight={600}
            color={colors.colorTextBase}
          >
            {t('universities.filterTitle')}
          </CustomText>
        )}
        <div className={styles.degree}>
          <CustomText
            fontSize={14}
            fontWeight={400}
            color={colors.colorText}
            lineHeight="22px"
            mb={4}
          >
            {t('universities.degree')}
          </CustomText>
          {/* <CustomSelect allowClear style={{ width: '100%' }} /> */}
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
        <div className={styles.items}>
          <CustomText
            fontSize={14}
            fontWeight={400}
            color={colors.colorText}
            lineHeight="22px"
            mb={4}
          >
            {t('universities.major')}
          </CustomText>
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
          headerPadding="16px 0 0 0"
          contentPadding="0"
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
