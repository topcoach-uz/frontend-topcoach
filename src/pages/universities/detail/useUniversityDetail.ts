import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';
import useApi from 'src/hooks/useApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';

// getting Id from the URL
export default function useUniDetail() {
  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const uniId = splittedPathname[splittedPathname.length - 1];

  // Fetching data from the API using RTK Query for better caching
  const { data: universityDetailData, isLoading, error } = useGetUniversityDetailQuery(uniId, {
    // Skip if no university ID
    skip: !uniId,
    // Refetch on mount to ensure fresh data
    refetchOnMountOrArgChange: true,
  });
  const meData = useTypedSelector((state) => state.auth.profile);
  // @ts-expect-error
  const blockData = universityDetailData?.content?.blocks; // Using 'any' to bypass type checking for 'blocks'.
  const isLikedInitial =
    meData?.likedUniversities?.some((uni) => uni.id === uniId) ?? false;

  const [open, setOpen] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(isLikedInitial);
  const { isAuthenticated } = useTypedSelector((state) => state.auth);

  useEffect(() => {
    setIsLiked(isLikedInitial);
  }, [isLikedInitial]);

  const handleLike = () => {
    if (!isAuthenticated) {
      setOpen(true);
      return;
    }

    if (isLiked) {
      // removing from favorites
      api.university
        .removeFromFavorite({ id: uniId })
        .then(() => {
          message.success(
            `${getTranslation(universityDetailData?.data.name)} removed from favorites`
          );
        })
        .catch((err) => {
          message.error(err.response.data.message);
        });
    } else {
      // Add to favorites
      api.university
        .addToFavorite({ id: uniId })
        .then(() => {
          message.success(
            `${universityDetailData?.data.name} added to favorites`
          );
        })
        .catch((err) => message.error(err.response.data.message));
    }
    setIsLiked(!isLiked);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return {
    universityDetailData: { data: universityDetailData }, // Wrap in data property for compatibility
    blockData,
    isLoading,
    handleClose,
    handleLike,
    open,
    isLiked,
  };
}
