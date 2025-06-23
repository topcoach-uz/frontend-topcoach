import { message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from 'src/app/api';
import { useTypedSelector } from 'src/app/store';

interface Props {
  isLikedInitial?: boolean;
  universityId?: string;
  universityName?: string;
}

export default function useUniversityCard({
  isLikedInitial,
  universityId,
  universityName,
}: Props) {
  const [isLiked, setIsLiked] = useState<boolean>(isLikedInitial ?? false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const colors = useTypedSelector((state) => state.layout.colors);
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  useEffect(() => {
    setIsLiked(isLikedInitial ?? false);
  }, [isLikedInitial]);

  const handleLike = () => {
    if (!isAuthenticated) {
      setModalOpen(true);
      return;
    }

    if (isLiked && universityId) {
      setIsLiked(false);
      api.university
        .removeFromFavorite({ id: universityId })
        .then(() => {
          message.success(`${universityName} removed from favorites`);
        })
        .catch((err) => {
          message.error(err.response.data.message);
        });
    } else if (universityId) {
      setIsLiked(true);
      api.university
        .addToFavorite({ id: universityId })
        .then(() => {
          message.success(`${universityName} added to favorites`);
        })
        .catch((err) => message.error(err.response.data.message));
    }
  };

  return { isLiked, setIsLiked, colors, handleLike, modalOpen, setModalOpen };
}
