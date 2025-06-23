import { Checkbox, CollapseProps } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useState } from 'react';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';
import useParamsHook from 'src/hooks/params';
import useApi from 'src/hooks/useApi';
import styles from './uniFilter.module.scss';
import { useTranslation } from 'react-i18next';

interface Props {
  checked?: boolean;
}

export default function useUniversityFilter({ checked }: Props) {
  const { colors } = useTypedSelector((state) => state.layout);
  const { handleMakeParams, searchParams, setSearchParams } = useParamsHook();

  // Getting filters data
  const { response: responseFilter } = useApi(() =>
    api.university.getFilters()
  );
  const { t } = useTranslation();

  const filteredContinents = responseFilter?.data?.continents.filter(
    (continent: string) =>
      ['Asia', 'Europe', 'North America', 'South America'].includes(continent)
  );

  const translatedContinents = filteredContinents?.map((continent: string) => {
    switch (continent) {
      case 'Asia':
        return t('universities.asia');
      case 'Europe':
        return t('universities.europe');
      case 'North America':
        return t('universities.northAmerica');
      case 'South America':
        return t('universities.southAmerica');
      default:
        return continent;
    }
  });

  //State to store selected filters
  const [selectedFilters, setSelectedFilters] = useState({
    continents: [] as string[],
    scholarships: [] as string[],
    requiredCertificates: [] as string[],
    degrees: [] as string[],
    majors: [] as string[],
    sector: [] as string[],
  });

  const handleFilterChange = (
    filterType: string,
    value: string,
    checked: boolean
  ) => {
    setSelectedFilters((prevFilters: any) => ({
      ...prevFilters,
      [filterType]: checked
        ? [...prevFilters[filterType], value]
        : prevFilters[filterType].filter((item: any) => item !== value),
    }));
  };

  // Major select
  const handleChangeSelectMajor = (value: string) => {
    handleMakeParams('major', value.length !== 0 ? value : '');
  };
  // Degree select
  const handleChangeSelectDegree = (value: string) => {
    console.log(`selected ${value}`);
    handleMakeParams('degree', value);
  };

  // Transform degrees into options
  // const gradeOptions = responseFilter?.data?
  const degreeOptions =
    responseFilter?.data?.degrees?.map((degree) => ({
      label: degree.name,
      value: degree.id,
    })) || [];

  const majorOptions =
    responseFilter?.data?.majors?.map((major) => ({
      label: major.name,
      value: major.id,
    })) || [];

  // Checkbox continent
  const onChangeCheckContinent =
    (filterType: string) => (e: CheckboxChangeEvent) => {
      const { value, checked } = e.target;

      // Get the current values from the URL params
      const currentValues = searchParams.getAll(filterType); // Use `getAll` to get all values for the same key

      let updatedValues;
      if (checked) {
        // Add the new value to the list
        updatedValues = [...currentValues, value];
      } else {
        // Remove the unchecked value from the list
        updatedValues = currentValues.filter((item) => item !== value);
      }

      // Clear all existing values for the filterType
      searchParams.delete(filterType);

      // Add updated values as separate parameters
      updatedValues.forEach((val) => {
        searchParams.append(filterType, val); // Append the value correctly
      });

      // Update the URL
      setSearchParams(searchParams);
    };
  // Checkbox scholarship (radio button behavior)
  const onChangeCheckScholarship =
    (filterType: keyof typeof selectedFilters) => (e: CheckboxChangeEvent) => {
      const { value } = e.target;

      // Radio button behavior: only one value at a time
      let updatedValues: string[] = [];

      if (e.target.checked) {
        // If checked, this becomes the only value (replace previous selections)
        updatedValues = [value];
      } else {
        // If unchecked, clear all values
        updatedValues = [];
      }

      // Clear all existing values for the filterType
      searchParams.delete(filterType);

      // Add the single selected value or none if unchecked
      if (updatedValues.length > 0) {
        searchParams.append(filterType, updatedValues[0]);
      }

      // Update the URL
      setSearchParams(searchParams);
    };

  // Checkbox sertificate
  const onChangeCheckSertificate =
    (filterType: keyof typeof selectedFilters) => (e: CheckboxChangeEvent) => {
      const { value, checked } = e.target;
      // Get the current values from the URL params
      const currentValues = searchParams.getAll(filterType); // Use `getAll` to get all values for the same key

      let updatedValues;
      if (checked) {
        // Add the new value to the list
        updatedValues = [...currentValues, value.id];
      } else {
        // Remove the unchecked value from the list
        updatedValues = currentValues.filter((item) => item !== value.id);
      }

      // Clear all existing values for the filterType
      searchParams.delete(filterType);

      // Add updated values as separate parameters
      updatedValues.forEach((val) => {
        searchParams.append(filterType, val);
      });

      // Update the URL
      setSearchParams(searchParams);
    };

  // Collapse
  const onChangeCollaps = (key: string | string[]) => {
    console.log('clickkkkkk', key);
  };

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: t('universities.continent'),
      children: (
        <div className={styles.check}>
          {filteredContinents?.map((englishContinentName, index) => {
            let translatedName = '';
            switch (englishContinentName) {
              case 'Asia':
                translatedName = t('universities.asia');
                break;
              case 'Europe':
                translatedName = t('universities.europe');
                break;
              case 'North America':
                translatedName = t('universities.northAmerica');
                break;
              case 'South America':
                translatedName = t('universities.southAmerica');
                break;
              default:
                translatedName = englishContinentName;
            }
            return (
              <Checkbox
                key={index + englishContinentName}
                value={englishContinentName} // Use the English name as the value
                checked={searchParams
                  .getAll('continents')
                  .includes(englishContinentName)}
                onChange={onChangeCheckContinent('continents')}
                disabled={checked === true ? true : false}
              >
                {translatedName} {/* Display the translated name */}
              </Checkbox>
            );
          })}
        </div>
      ),
    },
    {
      key: '2',
      label: t('universities.scholarships'),
      children: (
        <div className={styles.check}>
          {responseFilter?.data.sector?.map((sector, i) => (
            <Checkbox
              key={i + sector}
              value={sector} // Use the English name as the value
              checked={searchParams.getAll('sector').includes(sector)}
              onChange={onChangeCheckScholarship('sector')}
              disabled={checked === true ? true : false}
            >
              {t(`universities.${sector}`)} {/* Translate the name */}
            </Checkbox>
          ))}
        </div>
      ),
    },
    {
      key: '3',
      label: t('universities.requiredCertificates'),
      children: (
        <div className={styles.check}>
          {responseFilter?.data.certifications.map((item, index) => (
            <Checkbox
              key={index + item.name}
              // value={searchParams.get('requiredCertificates') || item}
              value={item}
              checked={searchParams
                .getAll('requiredCertificates')
                .includes(item.id)}
              onChange={onChangeCheckSertificate('requiredCertificates')}
              disabled={checked === true ? true : false}
            >
              {item.name}
            </Checkbox>
          ))}
        </div>
      ),
    },
  ];

  return {
    colors,
    degreeOptions,
    majorOptions,
    items,
    selectedFilters,
    searchParams,
    handleChangeSelectMajor,
    handleChangeSelectDegree,
    onChangeCollaps,
    onChangeCheckContinent,
  };
}
