import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';
import useApi from 'src/hooks/useApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';

// getting Id from the URL
export default function useUniDetail() {
  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const uniId = splittedPathname[splittedPathname.length - 1];

  // Fetching data from the API
  const { response: universityDetailData, isLoading } = useApi(() =>
    api.university.universityDetail(uniId)
  );
  const meData = useTypedSelector((state) => state.auth.profile);
  // @ts-expect-error
  const blockData = universityDetailData?.data.content?.blocks; // Using 'any' to bypass type checking for 'blocks'.
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
    universityDetailData,
    blockData,
    isLoading,
    handleClose,
    handleLike,
    open,
    isLiked,
  };
}
