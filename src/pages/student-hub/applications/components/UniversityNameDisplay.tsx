import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGetUniversityDetailQuery } from '../../../../app/services/universities';
import { getTranslation } from '../../../../lib/i18n/translationUtils';

const UniversityNameDisplay: React.FC<{ universityId?: string; universityName?: string }> = ({
  universityId,
  universityName,
}) => {
  const { t } = useTranslation();

  if (universityId) {
    const { data: university, isLoading } = useGetUniversityDetailQuery(universityId, {
      skip: !universityId,
    });

    if (isLoading) return <span>Loading...</span>;
    if (university) {
      const displayName = getTranslation(university.name);
      return <>{displayName || universityName || t('studentHub.applications.unknownUniversity')}</>;
    }
  }

  const displayName = universityName?.trim();
  if (!displayName || displayName === 'undefined' || displayName === 'null') {
    return (
      <span style={{ color: '#999', fontStyle: 'italic' }}>
        {t('studentHub.applications.unknownUniversity')}
      </span>
    );
  }
  return <>{displayName}</>;
};

export default UniversityNameDisplay;
