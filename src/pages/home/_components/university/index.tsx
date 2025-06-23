import { Pagination } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import EmptyCardComp from 'src/components/emptyCard';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import UniversityCard from './card';
import styles from './university.module.scss';
import { useTranslation } from 'react-i18next';
import { getTranslation } from 'src/lib/i18n/translationUtils';

export default function FavoriteUniversitiesSection() {
  const colors = useColors();

  const meRes = useTypedSelector((state) => state.auth.profile);
  const favUniversities = meRes?.likedUniversities ?? [];
  const { t } = useTranslation();

  const handlePaginationChange = () => {};

  return (
    <section>
      <div className={'container ' + styles.container}>
        <CustomText
          fontWeight={themeFontWeight.fontWeightSemibold}
          fontSize={themeFontSize.fontSizeTitle3}
          color={colors.colorTextBase}
          mb={4}
        >
          {t('home.favorite')}
        </CustomText>
        <CustomText mb={24} color={colors.colorTextSecondary}>
          {t('home.favouriteDesc')}
        </CustomText>
        <div className={styles.cards_wrapper}>
          {favUniversities?.length > 0 ? (
            <ul className={styles.card_list}>
              {favUniversities?.map((university, i) => (
                <UniversityCard
                  key={university.id}
                  {...university} // image="/img/some-university.png"
                  image={university.media[0]?.url}
                  location={`${getTranslation(university.location?.region)}, ${getTranslation(university.location?.country)}`}
                  name={getTranslation(university.name) || ''}
                  ranking={university.rankings[0]?.rank.toString() || ''}
                  // major={university.majors.map((item) => item.name)}
                  // tuition={`${university.tuitionFees[0].currency.symbol}${(university.tuitionFees[0].fee * 1000).toLocaleString()}`}
                  isLiked={meRes?.likedUniversities?.some(
                    (uni) => uni.id === university.id
                  )}
                />
              ))}
            </ul>
          ) : (
            <EmptyCardComp
              title={t('home.noFavorite')}
              description={t('home.noFavoriteDesc')}
            ></EmptyCardComp>
          )}
          {favUniversities?.length > 0 && (
            <Pagination
              style={{ marginTop: 16 }}
              defaultCurrent={0}
              total={favUniversities?.length || 0}
              onChange={handlePaginationChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}
