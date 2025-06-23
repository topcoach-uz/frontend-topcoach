import { Breadcrumb } from 'antd';
import { useScreenSize } from 'src/hooks/useScreenSize';
import UniversityDetailSection from '../_components/detail';
import UnivercityDetailOverview from '../_components/overview';
import useUniversityDetail from './useUniversityDetail';
import styles from './detail.module.scss';

function UniversityDetailPage() {
  const { screenSize } = useScreenSize();
  const {
    isLiked,
    blockData,
    isLoading,
    universityDetailData,
    handleLike,
    handleClose,
    open,
  } = useUniversityDetail();

  const breadcrumbItems = [
    {
      title: 'Home',
    },
    {
      title: <a href="/universities">Universities</a>,
    },
    {
      title: 'University information',
    },
  ];

  const firstTwoBlocks = Array.isArray(blockData) ? blockData.slice(0, 3) : [];

  const remainingBlocks = Array.isArray(blockData) ? blockData.slice(3) : [];

  return (
    <div className={styles.detail}>
      {screenSize < 768 && (
        <Breadcrumb
          items={breadcrumbItems}
          style={{ marginTop: 20, marginBottom: 20 }}
        />
      )}
      <UnivercityDetailOverview
        isLoading={isLoading}
        isLiked={isLiked}
        firstTwoBlocks={firstTwoBlocks}
        remainingBlocks={remainingBlocks}
        handleLike={handleLike}
        {...universityDetailData?.data}
      />
      <UniversityDetailSection
        isLoading={isLoading}
        handleClose={handleClose}
        open={open}
        handleLike={handleLike}
        isLiked={isLiked}
        {...universityDetailData?.data}
      />
    </div>
  );
}

export default UniversityDetailPage;
